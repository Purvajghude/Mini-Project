package com.mesh.recommendations;

import com.mesh.connections.ConnectionService;
import com.mesh.github.GitHubRepositoryEvidence;
import com.mesh.github.GitHubRepositoryEvidenceRepository;
import com.mesh.profiles.*;
import com.mesh.skills.ProfileSkill;
import com.mesh.skills.ProfileSkillRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RecommendationService {
    private final StudentProfileRepository profiles;
    private final ProfileSkillRepository profileSkills;
    private final ProfileGoalRepository profileGoals;
    private final ProfileInterestRepository profileInterests;
    private final ProfileDesiredSkillRepository desiredSkills;
    private final AvailabilityWindowRepository availability;
    private final ConnectionService connectionService;
    private final GitHubRepositoryEvidenceRepository githubEvidence;
    private final RecommendationScorer scorer = new RecommendationScorer();
    private final DiscoverFeedAllocator allocator = new DiscoverFeedAllocator();

    public RecommendationService(StudentProfileRepository profiles, ProfileSkillRepository profileSkills, ProfileGoalRepository profileGoals,
                                 ProfileInterestRepository profileInterests, ProfileDesiredSkillRepository desiredSkills,
                                 AvailabilityWindowRepository availability, ConnectionService connectionService,
                                 GitHubRepositoryEvidenceRepository githubEvidence) {
        this.profiles = profiles; this.profileSkills = profileSkills; this.profileGoals = profileGoals;
        this.profileInterests = profileInterests; this.desiredSkills = desiredSkills; this.availability = availability;
        this.connectionService = connectionService;
        this.githubEvidence = githubEvidence;
    }

    @Transactional(readOnly = true)
    public List<RecommendationResponse> discover(UUID viewerId, int limit) {
        StudentProfile viewer = profiles.findById(viewerId).orElseThrow(() -> new com.mesh.common.ApiException(HttpStatus.NOT_FOUND, "Student profile was not found."));
        Set<UUID> excluded = connectionService.recommendationExclusions(viewerId);
        List<StudentProfile> candidates = profiles.findByOnboardingCompleteTrueAndUserIdNot(viewerId).stream().filter(profile -> !excluded.contains(profile.getUserId())).toList();
        Set<UUID> ids = new HashSet<>(candidates.stream().map(StudentProfile::getUserId).toList()); ids.add(viewerId);
        ProfileSignals signals = loadSignals(ids);
        RecommendationScorer.Input viewerInput = inputFor(viewerId, signals);
        Set<UUID> saved = connectionService.savedCandidates(viewerId);
        List<RankedCandidate> ranked = candidates.stream().map(candidate -> {
            RecommendationScorer.Score score = scorer.score(viewerInput, inputFor(candidate.getUserId(), signals));
            return new RankedCandidate(candidate, score, signals.skillNames().getOrDefault(candidate.getUserId(), Map.of()), signals.skillLevels().getOrDefault(candidate.getUserId(), Map.of()), signals.desiredSkillIds().getOrDefault(viewerId, Set.of()), saved.contains(candidate.getUserId()));
        }).toList();
        CollaborationDomain viewerDomain = domainOf(viewer);
        return allocator.allocate(viewerDomain, ranked, limit).stream().map(item -> response(item.candidate(), item.source())).toList();
    }

    private ProfileSignals loadSignals(Set<UUID> ids) {
        Map<UUID, Set<String>> goals = grouped(profileGoals.findForProfiles(ids), ProfileGoal::getProfileUserId, item -> item.getGoal().getCode());
        Map<UUID, Set<Long>> interests = grouped(profileInterests.findForProfiles(ids), ProfileInterest::getProfileUserId, item -> item.getInterest().getId());
        Map<UUID, Set<Long>> desired = grouped(desiredSkills.findForProfiles(ids), ProfileDesiredSkill::getProfileUserId, item -> item.getSkill().getId());
        Map<UUID, Map<Long, Short>> levels = new HashMap<>();
        Map<UUID, Map<Long, String>> names = new HashMap<>();
        for (ProfileSkill item : profileSkills.findForProfiles(ids)) {
            levels.computeIfAbsent(item.getProfileUserId(), ignored -> new HashMap<>()).put(item.getSkill().getId(), item.getSelfAssessedProficiency());
            names.computeIfAbsent(item.getProfileUserId(), ignored -> new HashMap<>()).put(item.getSkill().getId(), item.getSkill().getName());
        }
        Map<UUID, List<RecommendationScorer.WeeklyWindow>> windows = availability.findByProfileUserIdInOrderByDayOfWeekAscStartMinuteAsc(ids).stream().collect(Collectors.groupingBy(AvailabilityWindow::getProfileUserId, Collectors.mapping(item -> new RecommendationScorer.WeeklyWindow(item.getDayOfWeek(), item.getStartMinute(), item.getEndMinute()), Collectors.toList())));
        Map<UUID, Set<String>> evidenceLanguages = new HashMap<>();
        for (GitHubRepositoryEvidence repository : githubEvidence.findByMeshUserIdIn(ids)) {
            Set<String> languages = evidenceLanguages.computeIfAbsent(repository.getMeshUserId(), ignored -> new HashSet<>());
            if (repository.getPrimaryLanguage() != null) languages.add(normalizeSkillName(repository.getPrimaryLanguage()));
            repository.getLanguages().forEach(language -> languages.add(normalizeSkillName(language.getLanguage())));
        }
        return new ProfileSignals(goals, interests, desired, levels, names, windows, evidenceLanguages);
    }

    private <T, V> Map<UUID, Set<V>> grouped(List<T> rows, Function<T, UUID> profileId, Function<T, V> value) {
        return rows.stream().collect(Collectors.groupingBy(profileId, Collectors.mapping(value, Collectors.toSet())));
    }
    private RecommendationScorer.Input inputFor(UUID userId, ProfileSignals signals) {
        Map<Long, String> declaredSkills = signals.skillNames().getOrDefault(userId, Map.of());
        Set<String> supportedLanguages = signals.evidenceLanguages().getOrDefault(userId, Set.of());
        double evidenceSignal = declaredSkills.isEmpty() ? 0 : declaredSkills.values().stream().map(this::normalizeSkillName).filter(supportedLanguages::contains).count() / (double) declaredSkills.size();
        return new RecommendationScorer.Input(signals.goals().getOrDefault(userId, Set.of()), signals.desiredSkillIds().getOrDefault(userId, Set.of()), signals.skillLevels().getOrDefault(userId, Map.of()), evidenceSignal, signals.windows().getOrDefault(userId, List.of()), signals.interestIds().getOrDefault(userId, Set.of()));
    }
    private String normalizeSkillName(String value) { return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", ""); }
    private CollaborationDomain domainOf(StudentProfile profile) {
        if (profile.getPrimaryDomain() == null) return null;
        return CollaborationDomain.valueOf(profile.getPrimaryDomain());
    }
    private RecommendationResponse response(RankedCandidate candidate, DiscoverFeedAllocator.FeedSource source) {
        StudentProfile profile = candidate.profile();
        RecommendationScorer.Breakdown breakdown = candidate.scoreResult().breakdown();
        List<String> complementary = candidate.skillNames().entrySet().stream().filter(skill -> candidate.viewerDesiredSkillIds().contains(skill.getKey())).map(Map.Entry::getValue).sorted().toList();
        return new RecommendationResponse(profile.getUserId(), profile.getUsername(), profile.getDisplayName(), profile.getDepartment(), profile.getYearOfStudy(), profile.getBio(), profile.getAvatarKey(), profile.getAvailability(), candidate.scoreResult().total(), reason(breakdown, source), new BreakdownResponse(breakdown.projectGoals(), breakdown.complementarySkills(), breakdown.skillEvidence(), breakdown.availabilityOverlap(), breakdown.sharedInterests()), candidate.skillNames().entrySet().stream().map(entry -> new SkillSummary(entry.getKey(), entry.getValue(), candidate.skillLevels().getOrDefault(entry.getKey(), (short) 0))).sorted(Comparator.comparing(SkillSummary::name)).toList(), complementary, candidate.saved(), source.name());
    }
    private String reason(RecommendationScorer.Breakdown breakdown, DiscoverFeedAllocator.FeedSource source) {
        List<String> reasons = new ArrayList<>();
        if (breakdown.complementarySkills() > 0) reasons.add("offers skills you are looking for");
        if (breakdown.projectGoals() > 0) reasons.add("shares project goals");
        if (breakdown.availabilityOverlap() > 0) reasons.add("has overlapping availability");
        if (breakdown.sharedInterests() > 0) reasons.add("shares interests");
        if (reasons.isEmpty() && source == DiscoverFeedAllocator.FeedSource.ADJACENT_DOMAIN) return "Included for adjacent-domain exploration.";
        if (reasons.isEmpty()) return "Complete your goals, desired skills, and availability to improve matches.";
        return String.join(", ", reasons) + ".";
    }

    private record ProfileSignals(Map<UUID, Set<String>> goals, Map<UUID, Set<Long>> interestIds, Map<UUID, Set<Long>> desiredSkillIds, Map<UUID, Map<Long, Short>> skillLevels, Map<UUID, Map<Long, String>> skillNames, Map<UUID, List<RecommendationScorer.WeeklyWindow>> windows, Map<UUID, Set<String>> evidenceLanguages) { }
    private record RankedCandidate(StudentProfile profile, RecommendationScorer.Score scoreResult, Map<Long, String> skillNames, Map<Long, Short> skillLevels, Set<Long> viewerDesiredSkillIds, boolean saved) implements DiscoverFeedAllocator.Candidate {
        @Override public CollaborationDomain domain() { return profile.getPrimaryDomain() == null ? null : CollaborationDomain.valueOf(profile.getPrimaryDomain()); }
        @Override public double score() { return scoreResult.total(); }
        @Override public String stableTieBreak() { return profile.getUserId().toString(); }
    }
    public record RecommendationResponse(UUID userId, String username, String displayName, String department, Short yearOfStudy, String bio, String avatarKey, String availability, double score, String reason, BreakdownResponse breakdown, List<SkillSummary> skills, List<String> complementarySkills, boolean saved, String feedSource) { }
    public record BreakdownResponse(double projectGoals, double complementarySkills, double skillEvidence, double availabilityOverlap, double sharedInterests) { }
    public record SkillSummary(Long id, String name, short proficiency) { }
}
