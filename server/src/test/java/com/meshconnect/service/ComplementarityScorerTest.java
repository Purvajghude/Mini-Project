package com.meshconnect.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.meshconnect.entity.AppUser;
import com.meshconnect.entity.Skill;
import com.meshconnect.entity.UserSkill;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * The ranking rules are the heart of the product, so they are tested directly rather
 * than only through the API. The scorer takes plain data and holds no repositories,
 * which is what makes these tests fast and free of a database.
 */
class ComplementarityScorerTest {

    private final ComplementarityScorer scorer = new ComplementarityScorer();

    private static long nextSkillId = 1;
    private static final Map<String, Skill> SKILLS = new HashMap<>();

    /** A backend student: strong Java and Spring, no design and no data. */
    private Map<Long, Integer> backendStudent() {
        Map<Long, Integer> mine = new HashMap<>();
        mine.put(skill("Java", "Development").getId(), 5);
        mine.put(skill("Spring Boot", "Development").getId(), 4);
        mine.put(skill("PostgreSQL", "Data").getId(), 4);
        return mine;
    }

    @Test
    @DisplayName("a designer outranks a second backend developer with the same skills as me")
    void complementBeatsDuplicate() {
        Map<Long, Integer> mine = backendStudent();
        Set<String> myCategories = Set.of("Development", "Data");

        var designer = skills(Map.of("Figma", 5, "UI/UX Design", 5, "User Research", 4), Map.of(
                "Figma", "Design", "UI/UX Design", "Design", "User Research", "Design"));
        var duplicate = skills(Map.of("Java", 5, "Spring Boot", 4), Map.of(
                "Java", "Development", "Spring Boot", "Development"));

        var designerScore = scorer.assess(mine, myCategories, designer);
        var duplicateScore = scorer.assess(mine, myCategories, duplicate);

        assertThat(designerScore.score()).isGreaterThan(duplicateScore.score());
    }

    @Test
    @DisplayName("someone whose every skill I already have at a high level is not recommendable")
    void identicalProfileIsNotRecommendable() {
        Map<Long, Integer> mine = backendStudent();
        var twin = skills(Map.of("Java", 4, "Spring Boot", 3), Map.of(
                "Java", "Development", "Spring Boot", "Development"));

        var assessment = scorer.assess(mine, Set.of("Development", "Data"), twin);

        assertThat(assessment.recommendable()).isFalse();
        assertThat(assessment.score()).isZero();
    }

    @Test
    @DisplayName("gap fill keeps a gradient instead of saturating at two skills")
    void gapFillDiscriminatesBeyondTwoSkills() {
        Map<Long, Integer> mine = backendStudent();
        Set<String> myCategories = Set.of("Development", "Data");

        var twoSkills = skills(Map.of("Figma", 5, "UI/UX Design", 5), Map.of(
                "Figma", "Design", "UI/UX Design", "Design"));
        var fiveSkills = skills(
                Map.of("Figma", 5, "UI/UX Design", 5, "Illustration", 4, "User Research", 4, "Video Editing", 3),
                Map.of("Figma", "Design", "UI/UX Design", "Design", "Illustration", "Design",
                        "User Research", "Design", "Video Editing", "Communication"));

        double two = scorer.assess(mine, myCategories, twoSkills).breakdown().gapFill();
        double five = scorer.assess(mine, myCategories, fiveSkills).breakdown().gapFill();

        assertThat(five).isGreaterThan(two);
        assertThat(five).isLessThanOrEqualTo(100.0);
    }

    @Test
    @DisplayName("a partly-held skill counts less than one I do not have at all")
    void partialGapsAreWorthLess() {
        Map<Long, Integer> beginner = new HashMap<>();
        beginner.put(skill("React", "Development").getId(), 2);
        Map<Long, Integer> none = new HashMap<>();

        var candidate = skills(Map.of("React", 5), Map.of("React", "Development"));

        double whenIKnowSome = scorer.assess(beginner, Set.of("Development"), candidate).breakdown().gapFill();
        double whenIKnowNone = scorer.assess(none, Set.of(), candidate).breakdown().gapFill();

        assertThat(whenIKnowNone).isGreaterThan(whenIKnowSome);
    }

    @Test
    @DisplayName("shared ground rewards overlap but stops rewarding it past two skills")
    void sharedGroundPeaks() {
        Map<Long, Integer> mine = backendStudent();
        Set<String> myCategories = Set.of("Development", "Data");

        var twoShared = skills(Map.of("Java", 4, "Spring Boot", 4, "Figma", 5), Map.of(
                "Java", "Development", "Spring Boot", "Development", "Figma", "Design"));
        var threeShared = skills(Map.of("Java", 4, "Spring Boot", 4, "PostgreSQL", 4, "Figma", 5), Map.of(
                "Java", "Development", "Spring Boot", "Development", "PostgreSQL", "Data", "Figma", "Design"));

        assertThat(scorer.assess(mine, myCategories, twoShared).breakdown().sharedGround()).isEqualTo(100.0);
        assertThat(scorer.assess(mine, myCategories, threeShared).breakdown().sharedGround()).isEqualTo(100.0);
    }

    @Test
    @DisplayName("bringing a different kind of work scores higher than more of the same")
    void categoryReachRewardsDifferentDisciplines() {
        Map<Long, Integer> mine = backendStudent();
        Set<String> myCategories = Set.of("Development", "Data");

        var sameDiscipline = skills(Map.of("Python", 5, "React", 5), Map.of(
                "Python", "Development", "React", "Development"));
        var newDisciplines = skills(Map.of("Figma", 5, "Project Management", 5), Map.of(
                "Figma", "Design", "Project Management", "Management"));

        double same = scorer.assess(mine, myCategories, sameDiscipline).breakdown().categoryReach();
        double different = scorer.assess(mine, myCategories, newDisciplines).breakdown().categoryReach();

        assertThat(same).isZero();
        assertThat(different).isGreaterThan(0.0);
    }

    @Test
    @DisplayName("every recommendation names the skills that produced it")
    void reasonNamesTheSkills() {
        Map<Long, Integer> mine = backendStudent();
        var designer = skills(Map.of("Figma", 5, "UI/UX Design", 4), Map.of(
                "Figma", "Design", "UI/UX Design", "Design"));

        var assessment = scorer.assess(mine, Set.of("Development", "Data"), designer);

        assertThat(assessment.reason()).contains("Figma");
        assertThat(assessment.complementarySkills()).contains("Figma", "UI/UX Design");
    }

    @Test
    @DisplayName("the reason's discipline matches the skills it actually names")
    void reasonCategoryMatchesNamedSkills() {
        Map<Long, Integer> mine = backendStudent();
        // Their strongest skills are development and data; only their weakest is
        // communication. The sentence must not call Python "communication work".
        var dataScientist = skills(
                Map.of("Python", 5, "Data Analysis", 5, "Technical Writing", 3),
                Map.of("Python", "Development", "Data Analysis", "Data", "Technical Writing", "Communication"));

        var assessment = scorer.assess(mine, Set.of("Development", "Data"), dataScientist);

        assertThat(assessment.reason()).doesNotContain("communication work");
    }

    @Test
    @DisplayName("equally strong skills are named in a stable order across calls")
    void reasonIsDeterministic() {
        Map<Long, Integer> mine = backendStudent();
        var designer = skills(Map.of("Figma", 5, "UI/UX Design", 5, "Illustration", 5), Map.of(
                "Figma", "Design", "UI/UX Design", "Design", "Illustration", "Design"));

        String first = scorer.assess(mine, Set.of("Development", "Data"), designer).reason();
        for (int attempt = 0; attempt < 5; attempt++) {
            assertThat(scorer.assess(mine, Set.of("Development", "Data"), designer).reason()).isEqualTo(first);
        }
    }

    @Test
    @DisplayName("the score stays within 0 and 100 even for an extreme profile")
    void scoreStaysInRange() {
        Map<Long, Integer> mine = backendStudent();
        Map<String, Integer> levels = new HashMap<>();
        Map<String, String> categories = new HashMap<>();
        for (int i = 0; i < 30; i++) {
            levels.put("Skill" + i, 5);
            categories.put("Skill" + i, "Category" + (i % 6));
        }

        var assessment = scorer.assess(mine, Set.of("Development", "Data"), skills(levels, categories));

        assertThat(assessment.score()).isBetween(0.0, 100.0);
    }

    // --- helpers -----------------------------------------------------------

    private static Skill skill(String name, String category) {
        return SKILLS.computeIfAbsent(name, key -> {
            Skill created = new Skill(key, category);
            setId(created, nextSkillId++);
            return created;
        });
    }

    private static List<UserSkill> skills(Map<String, Integer> levels, Map<String, String> categories) {
        AppUser owner = new AppUser("candidate", "candidate@college.edu", "hash");
        setId(owner, 99L);
        List<UserSkill> result = new ArrayList<>();
        levels.forEach((name, proficiency) ->
                result.add(new UserSkill(owner, skill(name, categories.getOrDefault(name, "General")), proficiency)));
        return result;
    }

    /** Ids are database-generated, so tests set them directly rather than persisting. */
    private static void setId(Object entity, Long value) {
        try {
            Field field = entity.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, value);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException("Could not set id on " + entity.getClass(), exception);
        }
    }
}
