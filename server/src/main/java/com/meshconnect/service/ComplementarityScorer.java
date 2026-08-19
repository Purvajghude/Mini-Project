package com.meshconnect.service;

import com.meshconnect.dto.RecommendationDto;
import com.meshconnect.entity.UserSkill;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Scores how well another student complements the signed-in student.
 *
 * <p>The question this answers is deliberately not "who is most similar to me?" - that
 * ranking returns your own duplicate, which is the least useful person to build with. It
 * answers "can the two of us build something neither of us could alone?"
 *
 * <p>Four components, each in the range 0..1, combined with fixed weights:
 *
 * <ul>
 *   <li><b>Gap fill (45%)</b> - how much of what I lack they bring, weighted by how strong
 *       they are in it and by how large the gap is. Saturates smoothly rather than being
 *       clipped, so a candidate with five relevant skills still ranks above one with two.
 *   <li><b>Shared ground (20%)</b> - collaborators need enough overlap to communicate. This
 *       peaks at two shared skills; beyond that, more overlap is not more useful, it is
 *       just redundancy.
 *   <li><b>Depth (20%)</b> - how strong they actually are in the skills that fill my gaps.
 *       Someone who is a beginner in the thing I need does not solve my problem.
 *   <li><b>Category reach (15%)</b> - whether they bring a different kind of work (design,
 *       data, management) rather than more of the same. This is what stops the ranking
 *       collapsing back into "more developers".
 * </ul>
 *
 * <p>Pure functions over already-loaded data, with no repository or persistence access, so
 * the ranking can be unit tested directly without a database.
 */
@Component
public class ComplementarityScorer {

    /** A skill only counts as a gap if my own level is below this. */
    static final int GAP_THRESHOLD = 3;
    /** Shared-skill count at which "we can talk to each other" is fully satisfied. */
    private static final double SHARED_GROUND_TARGET = 2.0;
    /** Distinct new categories at which category reach is fully satisfied. */
    private static final double CATEGORY_REACH_TARGET = 3.0;
    /**
     * Controls how quickly gap fill saturates. Smaller values saturate sooner. At 1.5 a
     * single strong relevant skill scores about 0.49 and four score about 0.90, which
     * keeps a usable gradient across a realistic cohort instead of flattening everyone
     * with two or more matching skills to the same value.
     */
    private static final double GAP_FILL_SCALE = 1.5;

    private static final double WEIGHT_GAP_FILL = 0.45;
    private static final double WEIGHT_SHARED_GROUND = 0.20;
    private static final double WEIGHT_DEPTH = 0.20;
    private static final double WEIGHT_CATEGORY_REACH = 0.15;

    /**
     * @param mySkills   my skill id to my proficiency (1..5)
     * @param myCategories the categories I already cover
     * @param theirSkills  the candidate's skills
     */
    public Assessment assess(Map<Long, Integer> mySkills, Set<String> myCategories, List<UserSkill> theirSkills) {
        // Name as the secondary sort so equally-strong skills come out in a stable order;
        // otherwise the same profile can produce a differently worded reason each request.
        List<UserSkill> complementary = theirSkills.stream()
                .filter(skill -> mySkills.getOrDefault(skill.getSkill().getId(), 0) < GAP_THRESHOLD)
                .sorted(Comparator.comparingInt(UserSkill::getProficiency).reversed()
                        .thenComparing(skill -> skill.getSkill().getName()))
                .toList();
        List<UserSkill> shared = theirSkills.stream()
                .filter(skill -> mySkills.containsKey(skill.getSkill().getId()))
                .toList();

        if (complementary.isEmpty()) return Assessment.none();

        double gapFillRaw = complementary.stream().mapToDouble(skill -> {
            int myLevel = mySkills.getOrDefault(skill.getSkill().getId(), 0);
            // A skill I have none of is worth the full weight; a partial gap is worth less.
            double gapWeight = myLevel == 0 ? 1.0 : (double) (GAP_THRESHOLD - myLevel) / GAP_THRESHOLD;
            return gapWeight * (skill.getProficiency() / 5.0);
        }).sum();
        double gapFill = 1.0 - Math.exp(-gapFillRaw / GAP_FILL_SCALE);

        double sharedGround = Math.min(1.0, shared.size() / SHARED_GROUND_TARGET);

        double depth = complementary.stream().limit(3).mapToInt(UserSkill::getProficiency).average().orElse(0) / 5.0;

        Set<String> newCategories = new LinkedHashSet<>();
        for (UserSkill skill : complementary) {
            String category = skill.getSkill().getCategory();
            if (!myCategories.contains(category)) newCategories.add(category);
        }
        double categoryReach = Math.min(1.0, newCategories.size() / CATEGORY_REACH_TARGET);

        double score = WEIGHT_GAP_FILL * gapFill
                + WEIGHT_SHARED_GROUND * sharedGround
                + WEIGHT_DEPTH * depth
                + WEIGHT_CATEGORY_REACH * categoryReach;

        List<String> complementNames = complementary.stream().limit(3).map(skill -> skill.getSkill().getName()).toList();
        List<String> sharedNames = shared.stream().limit(2).map(skill -> skill.getSkill().getName()).toList();
        // The category clause must describe the skills the sentence actually names, so it
        // comes from the lead skill rather than from any new category the candidate has.
        String leadCategory = complementary.get(0).getSkill().getCategory();

        return new Assessment(
                round(score * 100.0),
                complementNames,
                sharedNames,
                List.copyOf(newCategories),
                explain(complementNames, sharedNames, newCategories.contains(leadCategory) ? leadCategory : null),
                new RecommendationDto.ScoreBreakdown(round(gapFill * 100), round(sharedGround * 100), round(depth * 100), round(categoryReach * 100))
        );
    }

    /**
     * A score without a reason is not actionable, so every recommendation carries a
     * sentence naming the specific skills that produced it.
     */
    private String explain(List<String> complementary, List<String> shared, String leadCategory) {
        String strengths = joinNaturally(complementary.stream().limit(2).toList());
        if (!shared.isEmpty()) {
            return "Brings " + strengths + ", and you already share " + joinNaturally(shared) + ".";
        }
        if (leadCategory != null) {
            return "Brings " + strengths + " - " + leadCategory.toLowerCase()
                    + " work that is missing from your current skill set.";
        }
        return "Strong in " + strengths + ", which fills a gap in your current skill set.";
    }

    private String joinNaturally(List<String> values) {
        if (values.isEmpty()) return "";
        if (values.size() == 1) return values.get(0);
        return String.join(" and ", values);
    }

    private double round(double value) { return Math.round(value * 10.0) / 10.0; }

    /**
     * The outcome of scoring one candidate. {@code score} of zero with empty lists means
     * the candidate brings nothing this student lacks and should not be recommended.
     */
    public record Assessment(
            double score,
            List<String> complementarySkills,
            List<String> sharedSkills,
            List<String> newCategories,
            String reason,
            RecommendationDto.ScoreBreakdown breakdown
    ) {
        static Assessment none() {
            return new Assessment(0, List.of(), List.of(), List.of(), "", new RecommendationDto.ScoreBreakdown(0, 0, 0, 0));
        }

        public boolean recommendable() { return !complementarySkills.isEmpty(); }
    }
}
