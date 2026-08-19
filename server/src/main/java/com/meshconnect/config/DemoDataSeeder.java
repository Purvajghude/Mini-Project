package com.meshconnect.config;

import com.meshconnect.entity.AppUser;
import com.meshconnect.entity.Comment;
import com.meshconnect.entity.Interest;
import com.meshconnect.entity.InterestStatus;
import com.meshconnect.entity.Match;
import com.meshconnect.entity.Message;
import com.meshconnect.entity.Post;
import com.meshconnect.entity.PostKind;
import com.meshconnect.entity.PostStatus;
import com.meshconnect.entity.Profile;
import com.meshconnect.entity.Skill;
import com.meshconnect.entity.UserRole;
import com.meshconnect.entity.UserSkill;
import com.meshconnect.repository.AppUserRepository;
import com.meshconnect.repository.CommentRepository;
import com.meshconnect.repository.InterestRepository;
import com.meshconnect.repository.MatchRepository;
import com.meshconnect.repository.MessageRepository;
import com.meshconnect.repository.PostRepository;
import com.meshconnect.repository.ProfileRepository;
import com.meshconnect.repository.SkillRepository;
import com.meshconnect.repository.UserSkillRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Populates the embedded development database with a realistic cohort of students, so
 * the application is worth looking at the moment it starts.
 *
 * <p>Only active when {@code app.demo-data.enabled} is true, which the dev profile sets
 * and the prod profile clears. It also refuses to run against a database that already
 * holds users, so restarting against a persistent database never duplicates the dataset.
 *
 * <p>Passwords are written through the real {@link PasswordEncoder}, so these accounts
 * sign in through exactly the same code path as any registered user - there is no demo
 * back door in the authentication logic.
 *
 * <p>{@code run} is transactional and Spring invokes it through the proxy, so the whole
 * dataset is written in one unit of work. That matters beyond tidiness: the entities stay
 * managed across the method, which is what lets later rows reference the ids of earlier ones.
 */
@Component
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    /** Shared by every seeded account so the demo sign-in is easy to remember. */
    public static final String DEMO_PASSWORD = "MeshDemo2026";
    public static final String DEMO_EMAIL = "demo@college.edu";

    private final AppUserRepository users;
    private final ProfileRepository profiles;
    private final SkillRepository skills;
    private final UserSkillRepository userSkills;
    private final InterestRepository interests;
    private final MatchRepository matches;
    private final MessageRepository messages;
    private final PostRepository posts;
    private final CommentRepository comments;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(
            AppUserRepository users, ProfileRepository profiles, SkillRepository skills,
            UserSkillRepository userSkills, InterestRepository interests, MatchRepository matches,
            MessageRepository messages, PostRepository posts, CommentRepository comments,
            PasswordEncoder passwordEncoder
    ) {
        this.users = users;
        this.profiles = profiles;
        this.skills = skills;
        this.userSkills = userSkills;
        this.interests = interests;
        this.matches = matches;
        this.messages = messages;
        this.posts = posts;
        this.comments = comments;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.count() > 0) {
            log.info("Demo data skipped: the database already holds {} users", users.count());
            return;
        }

        Map<String, Skill> catalog = new LinkedHashMap<>();
        for (Skill skill : skills.findAll()) catalog.put(skill.getName(), skill);

        // The account the reviewer signs in as. Deliberately a strong backend profile
        // with no design or data skills, so the recommendation engine has an obvious and
        // explainable gap to fill on the very first screen.
        AppUser purvaj = student("purvaj", DEMO_EMAIL, "Purvaj Ghude", "Computer Engineering", 3,
                "Backend-leaning. I like APIs that are boring in the best way.", "Weekday evenings", "ink");
        AppUser divya = student("divya", "divya@college.edu", "Divya Kokane", "Design", 2,
                "Product designer. I care most about the first thirty seconds of an app.", "Weekday afternoons", "amber");
        AppUser pooja = student("pooja", "pooja@college.edu", "Pooja Ghule", "Data Science", 3,
                "I work with messy datasets and turn them into something a human can read.", "Weekends", "violet");
        AppUser sanskar = student("sanskar", "sanskar@college.edu", "Sanskar Bandekar", "Information Technology", 4,
                "Frontend and motion. Currently obsessed with making lists feel fast.", "Most evenings", "teal");
        AppUser parth = student("parth", "parth@college.edu", "Parth Patil", "Computer Engineering", 3,
                "Backend and infrastructure. I will happily argue about database indexes.", "Evenings and weekends", "ink");
        AppUser yogesh = student("yogesh", "yogesh@college.edu", "Yogesh Gaikawad", "Mechanical Engineering", 2,
                "Hardware side of things, learning to code. I document everything.", "Tuesday and Thursday", "rose");
        AppUser siddhant = student("siddhant", "siddhant@college.edu", "Siddhant Surwade", "Management Studies", 4,
                "I keep projects shipping. Deadlines, scope, and the awkward questions.", "Flexible", "moss");
        AppUser divyesh = student("divyesh", "divyesh@college.edu", "Divyesh Phulambrikar", "Computer Engineering", 2,
                "Android mostly. I want to ship something people actually install.", "Weekends", "teal");
        AppUser mrunali = student("mrunali", "mrunali@college.edu", "Mrunali Shinde", "Design", 3,
                "I do the research nobody wants to do, then the design is easy.", "Weekday afternoons", "amber");
        AppUser raza = student("raza", "raza@college.edu", "Raza Patel", "Information Technology", 4,
                "Deployment, pipelines, and making sure it runs on someone else's laptop.", "Late evenings", "graphite");
        AppUser harsh = student("harsh", "harsh@college.edu", "Harsh Patil", "Data Science", 4,
                "Models are the easy part. Getting clean data is the project.", "Weekends", "violet");
        AppUser sejal = student("sejal", "sejal@college.edu", "Sejal Pawar", "Management Studies", 2,
                "I can explain your project better than you can, and I will happily pitch it.", "Flexible", "rose");

        AppUser admin = users.save(admin());
        profiles.save(describe(new Profile(admin, "Platform Admin"), "Administration", null,
                "Reviews reported content.", "Weekdays", "graphite"));

        addSkills(catalog, purvaj, Map.of("Java", 5, "Spring Boot", 4, "PostgreSQL", 4, "REST APIs", 4, "Git", 4));
        addSkills(catalog, divya, Map.of("Figma", 5, "UI/UX Design", 5, "User Research", 4, "Illustration", 3));
        addSkills(catalog, pooja, Map.of("Python", 5, "Data Analysis", 5, "Machine Learning", 4, "Technical Writing", 3));
        addSkills(catalog, sanskar, Map.of("React", 5, "JavaScript", 5, "HTML/CSS", 4, "Git", 3));
        addSkills(catalog, parth, Map.of("Java", 4, "Spring Boot", 4, "Docker", 3, "PostgreSQL", 3));
        addSkills(catalog, yogesh, Map.of("Technical Writing", 4, "Video Editing", 3, "Python", 2));
        addSkills(catalog, siddhant, Map.of("Project Management", 5, "Public Speaking", 4, "Event Management", 4));
        addSkills(catalog, divyesh, Map.of("Android", 4, "Java", 3, "Git", 3));
        addSkills(catalog, mrunali, Map.of("User Research", 5, "UI/UX Design", 4, "Figma", 3));
        addSkills(catalog, raza, Map.of("Docker", 4, "Git", 4, "PostgreSQL", 3));
        addSkills(catalog, harsh, Map.of("Machine Learning", 5, "Python", 4, "Data Analysis", 3));
        addSkills(catalog, sejal, Map.of("Public Speaking", 5, "Technical Writing", 4, "Event Management", 3));

        // One completed handshake, so Connections is populated on first load.
        Interest handshake = new Interest(sanskar, purvaj);
        handshake.setStatus(InterestStatus.ACCEPTED);
        interests.save(handshake);
        Match demoAndSanskar = matches.save(canonical(purvaj, sanskar));
        messages.save(new Message(demoAndSanskar, sanskar,
                "Saw you are running the API side. I can take the whole React client if you want to split it that way."));
        messages.save(new Message(demoAndSanskar, purvaj,
                "That works. I will have auth and the profile endpoints done tonight, then you can wire the screens."));
        messages.save(new Message(demoAndSanskar, sanskar,
                "Perfect. Send me the endpoint list when it is up and I will start on the discover view."));

        // Two pending requests, so the interest inbox has something in it. These come from
        // Kabir and Meera rather than from Diya or Ishita, because anyone who has already
        // sent interest drops out of Discover - and Diya (design) and Ishita (data) are
        // exactly the complementary profiles the ranking should be surfacing there.
        interests.save(new Interest(yogesh, purvaj));
        interests.save(new Interest(siddhant, purvaj));

        Post helpPost = posts.save(new Post(yogesh, PostKind.HELP,
                "Flyway migration keeps failing on a fresh database",
                "The first migration runs but the second one cannot see the table it created. I am probably "
                        + "misunderstanding how Flyway orders files. Has anyone hit this?",
                "Backend", "Java,PostgreSQL"));
        Comment answer = comments.save(new Comment(helpPost, parth,
                "Check the version prefixes. Flyway sorts by version, not by file name, so V10 runs before V2 "
                        + "unless you pad them. Rename them V001, V002 and the order comes out right."));
        helpPost.setSolvedComment(answer);
        helpPost.setStatus(PostStatus.SOLVED);
        comments.save(new Comment(helpPost, yogesh, "That was exactly it. Thank you."));

        Post projectPost = posts.save(new Post(siddhant, PostKind.PROJECT,
                "Looking for a designer and a backend dev for a campus lost-and-found app",
                "The idea is simple: post what you lost, post what you found, and the app matches them. I can run "
                        + "the project and handle the pitch. I need someone on the API, and someone who can make it "
                        + "not look like a college project.",
                "Product", "Project Management,UI/UX Design,Java"));
        comments.save(new Comment(projectPost, divya,
                "I would be interested in the design side. I have wanted an excuse to work on a matching interface."));

        posts.save(new Post(pooja, PostKind.SHOWCASE,
                "Built a dashboard that shows which library seats are actually free",
                "Scraped the entry logs, cleaned about forty thousand rows, and put a small dashboard on top. The "
                        + "interesting part was not the model, it was realising the sensor data lies between 4pm and 6pm.",
                "Data", "Python,Data Analysis"));

        posts.save(new Post(sanskar, PostKind.HELP,
                "How do you keep a long list smooth on a low-end Android phone?",
                "My list stutters once it passes about two hundred rows. I have tried memoising the row component "
                        + "but it has not helped much. Curious what has actually worked for people.",
                "Frontend", "React,JavaScript"));

        log.info("Demo data ready: {} accounts, {} posts, {} matches, {} pending interests.",
                users.count(), posts.count(), matches.count(),
                interests.findByReceiverIdAndStatusOrderByCreatedAtDesc(purvaj.getId(), InterestStatus.PENDING).size());
        log.info("Sign in at http://localhost:8080 with {} / {}", DEMO_EMAIL, DEMO_PASSWORD);
    }

    private AppUser student(String username, String email, String displayName,
            String department, Integer year, String bio, String availability, String avatarKey) {
        AppUser user = users.save(new AppUser(username, email, passwordEncoder.encode(DEMO_PASSWORD)));
        profiles.save(describe(new Profile(user, displayName), department, year, bio, availability, avatarKey));
        return user;
    }

    private Profile describe(Profile profile, String department, Integer year, String bio, String availability, String avatarKey) {
        profile.setDepartment(department);
        profile.setYearOfStudy(year);
        profile.setBio(bio);
        profile.setAvailability(availability);
        profile.setAvatarKey(avatarKey);
        profile.setOnboardingComplete(true);
        return profile;
    }

    private AppUser admin() {
        AppUser admin = new AppUser("admin", "admin@college.edu", passwordEncoder.encode(DEMO_PASSWORD));
        admin.setRole(UserRole.ADMIN);
        return admin;
    }

    private void addSkills(Map<String, Skill> catalog, AppUser user, Map<String, Integer> levels) {
        List<UserSkill> rows = levels.entrySet().stream()
                .map(entry -> {
                    Skill skill = catalog.get(entry.getKey());
                    if (skill == null) throw new IllegalStateException("Demo data references an unknown skill: " + entry.getKey());
                    return new UserSkill(user, skill, entry.getValue());
                })
                .toList();
        userSkills.saveAll(rows);
    }

    /** Matches store their members in ascending id order; the entity enforces it. */
    private Match canonical(AppUser first, AppUser second) {
        return first.getId() < second.getId() ? new Match(first, second) : new Match(second, first);
    }
}
