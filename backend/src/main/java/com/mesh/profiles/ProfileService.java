package com.mesh.profiles;

import com.mesh.auth.AppUser;
import com.mesh.common.ApiException;
import com.mesh.github.GitHubRepositoryEvidence;
import com.mesh.github.GitHubRepositoryEvidenceRepository;
import com.mesh.skills.ProfileSkill;
import com.mesh.skills.ProfileSkillRepository;
import com.mesh.skills.Skill;
import com.mesh.skills.SkillRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProfileService {
    private final StudentProfileRepository profiles;
    private final ProfileSkillRepository profileSkills;
    private final SkillRepository skills;
    private final CollaborationGoalRepository goals;
    private final ProfileGoalRepository profileGoals;
    private final InterestRepository interests;
    private final ProfileInterestRepository profileInterests;
    private final ProfileDesiredSkillRepository desiredSkills;
    private final AvailabilityWindowRepository availabilityWindows;
    private final GitHubRepositoryEvidenceRepository githubEvidence;

    public ProfileService(StudentProfileRepository profiles, ProfileSkillRepository profileSkills, SkillRepository skills,
                          CollaborationGoalRepository goals, ProfileGoalRepository profileGoals,
                          InterestRepository interests, ProfileInterestRepository profileInterests,
                          ProfileDesiredSkillRepository desiredSkills, AvailabilityWindowRepository availabilityWindows,
                          GitHubRepositoryEvidenceRepository githubEvidence) {
        this.profiles = profiles;
        this.profileSkills = profileSkills;
        this.skills = skills;
        this.goals = goals;
        this.profileGoals = profileGoals;
        this.interests = interests;
        this.profileInterests = profileInterests;
        this.desiredSkills = desiredSkills;
        this.availabilityWindows = availabilityWindows;
        this.githubEvidence = githubEvidence;
    }

    @Transactional
    public StudentProfile create(AppUser user, String username, String displayName) {
        if (profiles.existsByUsername(username)) throw new ApiException(HttpStatus.CONFLICT, "Username is already in use.");
        return profiles.save(new StudentProfile(user, username, displayName));
    }

    @Transactional(readOnly = true)
    public ProfileResponse get(UUID userId) { return response(requireProfile(userId)); }

    @Transactional
    public ProfileResponse update(UUID userId, UpdateProfileRequest request) {
        StudentProfile profile = requireProfile(userId);
        String primaryDomain = normalizeDomain(request.primaryDomain());
        profile.update(request.displayName().trim(), nullable(request.department()), request.yearOfStudy(), nullable(request.bio()), nullable(request.avatarKey()), nullable(request.availability()), primaryDomain, request.onboardingComplete());
        return response(profile);
    }

    @Transactional
    public ProfileResponse replaceSkills(UUID userId, ReplaceSkillsRequest request) {
        List<Long> skillIds = request.skills().stream().map(SkillSelection::skillId).toList();
        assertExistingSkillIds(skillIds);
        Map<Long, Skill> skillMap = skills.findAllById(skillIds).stream().collect(Collectors.toMap(Skill::getId, Function.identity()));
        profileSkills.deleteByProfileUserId(userId);
        profileSkills.flush();
        request.skills().forEach(selection -> profileSkills.save(new ProfileSkill(userId, selection.skillId(), skillMap.get(selection.skillId()), selection.proficiency())));
        profileSkills.flush();
        return response(requireProfile(userId));
    }

    @Transactional
    public ProfileResponse replaceGoals(UUID userId, ReplaceGoalsRequest request) {
        requireProfile(userId);
        List<String> codes = distinctCodes(request.goalCodes(), "goal");
        List<CollaborationGoal> goalList = goals.findAllById(codes);
        if (goalList.size() != codes.size()) throw new ApiException(HttpStatus.BAD_REQUEST, "One or more goal codes do not exist.");
        Map<String, CollaborationGoal> goalMap = goalList.stream().collect(Collectors.toMap(CollaborationGoal::getCode, Function.identity()));
        profileGoals.deleteByProfileUserId(userId);
        profileGoals.flush();
        codes.forEach(code -> profileGoals.save(new ProfileGoal(userId, code, goalMap.get(code))));
        profileGoals.flush();
        return response(requireProfile(userId));
    }

    @Transactional
    public ProfileResponse replaceInterests(UUID userId, ReplaceInterestsRequest request) {
        requireProfile(userId);
        assertExistingInterestIds(request.interestIds());
        Map<Long, Interest> interestMap = interests.findAllById(request.interestIds()).stream().collect(Collectors.toMap(Interest::getId, Function.identity()));
        profileInterests.deleteByProfileUserId(userId);
        profileInterests.flush();
        request.interestIds().forEach(id -> profileInterests.save(new ProfileInterest(userId, id, interestMap.get(id))));
        profileInterests.flush();
        return response(requireProfile(userId));
    }

    @Transactional
    public ProfileResponse replaceDesiredSkills(UUID userId, ReplaceDesiredSkillsRequest request) {
        requireProfile(userId);
        assertExistingSkillIds(request.skillIds());
        Map<Long, Skill> skillMap = skills.findAllById(request.skillIds()).stream().collect(Collectors.toMap(Skill::getId, Function.identity()));
        desiredSkills.deleteByProfileUserId(userId);
        desiredSkills.flush();
        request.skillIds().forEach(id -> desiredSkills.save(new ProfileDesiredSkill(userId, id, skillMap.get(id))));
        desiredSkills.flush();
        return response(requireProfile(userId));
    }

    @Transactional
    public ProfileResponse replaceAvailability(UUID userId, ReplaceAvailabilityRequest request) {
        StudentProfile profile = requireProfile(userId);
        validateTimezone(request.timezone());
        validateAvailability(request.windows());
        availabilityWindows.deleteByProfileUserId(userId);
        availabilityWindows.flush();
        request.windows().forEach(window -> availabilityWindows.save(new AvailabilityWindow(userId, window.dayOfWeek(), window.startMinute(), window.endMinute())));
        profile.updateAvailabilityTimezone(request.timezone());
        return response(profile);
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> catalog() { return skills.findAllByOrderByNameAsc().stream().map(skill -> new SkillResponse(skill.getId(), skill.getName(), skill.getCategory())).toList(); }
    @Transactional(readOnly = true)
    public List<GoalResponse> goalCatalog() { return goals.findAllByOrderByNameAsc().stream().map(goal -> new GoalResponse(goal.getCode(), goal.getName())).toList(); }
    @Transactional(readOnly = true)
    public List<InterestResponse> interestCatalog() { return interests.findAllByOrderByNameAsc().stream().map(interest -> new InterestResponse(interest.getId(), interest.getName())).toList(); }
    public List<DomainResponse> domainCatalog() { return Arrays.stream(CollaborationDomain.values()).map(domain -> new DomainResponse(domain.name(), title(domain.name()))).toList(); }

    private StudentProfile requireProfile(UUID userId) { return profiles.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile was not found.")); }

    private ProfileResponse response(StudentProfile profile) {
        UUID id = profile.getUserId();
        Set<String> evidenceLanguages = new HashSet<>();
        for (GitHubRepositoryEvidence repository : githubEvidence.findByMeshUserIdIn(List.of(id))) {
            if (repository.getPrimaryLanguage() != null) evidenceLanguages.add(normalizeEvidenceName(repository.getPrimaryLanguage()));
            repository.getLanguages().forEach(language -> evidenceLanguages.add(normalizeEvidenceName(language.getLanguage())));
        }
        List<ProfileSkillResponse> declared = profileSkills.findForProfiles(List.of(id)).stream().map(item -> new ProfileSkillResponse(item.getSkill().getId(), item.getSkill().getName(), item.getSkill().getCategory(), item.getSelfAssessedProficiency(), evidenceLanguages.contains(normalizeEvidenceName(item.getSkill().getName())))).toList();
        List<GoalResponse> selectedGoals = profileGoals.findForProfiles(List.of(id)).stream().map(item -> new GoalResponse(item.getGoal().getCode(), item.getGoal().getName())).toList();
        List<InterestResponse> selectedInterests = profileInterests.findForProfiles(List.of(id)).stream().map(item -> new InterestResponse(item.getInterest().getId(), item.getInterest().getName())).toList();
        List<SkillResponse> desired = desiredSkills.findForProfiles(List.of(id)).stream().map(item -> new SkillResponse(item.getSkill().getId(), item.getSkill().getName(), item.getSkill().getCategory())).toList();
        List<AvailabilityWindowResponse> windows = availabilityWindows.findByProfileUserIdInOrderByDayOfWeekAscStartMinuteAsc(List.of(id)).stream().map(window -> new AvailabilityWindowResponse(window.getDayOfWeek(), window.getStartMinute(), window.getEndMinute())).toList();
        return new ProfileResponse(id, profile.getUsername(), profile.getDisplayName(), profile.getDepartment(), profile.getYearOfStudy(), profile.getBio(), profile.getAvatarKey(), profile.getAvailability(), profile.getAvailabilityTimezone(), profile.getPrimaryDomain(), profile.isOnboardingComplete(), declared, selectedGoals, selectedInterests, desired, windows);
    }

    private void assertExistingSkillIds(List<Long> ids) { assertExisting(ids, skills::findAllById, "skill IDs"); }
    private void assertExistingInterestIds(List<Long> ids) { assertExisting(ids, interests::findAllById, "interest IDs"); }
    private <T> void assertExisting(List<T> ids, Function<Iterable<T>, List<?>> finder, String resource) {
        Set<T> distinct = new LinkedHashSet<>(ids);
        if (distinct.size() != ids.size()) throw new ApiException(HttpStatus.BAD_REQUEST, "Each " + resource.substring(0, resource.length() - 1) + " may appear only once.");
        if (finder.apply(distinct).size() != distinct.size()) throw new ApiException(HttpStatus.BAD_REQUEST, "One or more " + resource + " do not exist.");
    }
    private List<String> distinctCodes(List<String> codes, String resource) {
        List<String> normalized = codes.stream().map(code -> code.trim().toUpperCase(Locale.ROOT)).toList();
        if (new HashSet<>(normalized).size() != normalized.size()) throw new ApiException(HttpStatus.BAD_REQUEST, "Each " + resource + " may appear only once.");
        return normalized;
    }
    private String normalizeDomain(String domain) {
        if (domain == null || domain.isBlank()) return null;
        try { return CollaborationDomain.valueOf(domain.trim().toUpperCase(Locale.ROOT)).name(); }
        catch (IllegalArgumentException exception) { throw new ApiException(HttpStatus.BAD_REQUEST, "primaryDomain must use a value from the domain catalogue."); }
    }
    private void validateTimezone(String timezone) {
        try { ZoneId.of(timezone); }
        catch (DateTimeException exception) { throw new ApiException(HttpStatus.BAD_REQUEST, "timezone must be a valid IANA time zone, for example Asia/Kolkata."); }
    }
    private void validateAvailability(List<AvailabilityWindowRequest> windows) {
        Map<Short, List<AvailabilityWindowRequest>> byDay = windows.stream().collect(Collectors.groupingBy(AvailabilityWindowRequest::dayOfWeek));
        for (List<AvailabilityWindowRequest> day : byDay.values()) {
            List<AvailabilityWindowRequest> sorted = day.stream().sorted(Comparator.comparingInt(AvailabilityWindowRequest::startMinute)).toList();
            for (int index = 1; index < sorted.size(); index++) if (sorted.get(index).startMinute() < sorted.get(index - 1).endMinute()) throw new ApiException(HttpStatus.BAD_REQUEST, "Availability windows on the same day cannot overlap.");
        }
    }
    private String nullable(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String normalizeEvidenceName(String value) { return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", ""); }
    private String title(String code) { return Arrays.stream(code.split("_")).map(word -> word.substring(0, 1) + word.substring(1).toLowerCase(Locale.ROOT)).collect(Collectors.joining(" ")); }

    public record ProfileResponse(UUID id, String username, String displayName, String department, Short yearOfStudy, String bio, String avatarKey, String availability, String availabilityTimezone, String primaryDomain, boolean onboardingComplete, List<ProfileSkillResponse> skills, List<GoalResponse> goals, List<InterestResponse> interests, List<SkillResponse> desiredSkills, List<AvailabilityWindowResponse> availabilityWindows) { }
    public record ProfileSkillResponse(Long id, String name, String category, short proficiency, boolean evidenceSupported) { }
    public record SkillResponse(Long id, String name, String category) { }
    public record GoalResponse(String code, String name) { }
    public record InterestResponse(Long id, String name) { }
    public record DomainResponse(String code, String name) { }
    public record AvailabilityWindowResponse(short dayOfWeek, short startMinute, short endMinute) { }
    public record UpdateProfileRequest(String displayName, String department, Short yearOfStudy, String bio, String avatarKey, String availability, String primaryDomain, boolean onboardingComplete) { }
    public record ReplaceSkillsRequest(List<SkillSelection> skills) { }
    public record SkillSelection(Long skillId, short proficiency) { }
    public record ReplaceGoalsRequest(List<String> goalCodes) { }
    public record ReplaceInterestsRequest(List<Long> interestIds) { }
    public record ReplaceDesiredSkillsRequest(List<Long> skillIds) { }
    public record ReplaceAvailabilityRequest(String timezone, List<AvailabilityWindowRequest> windows) { }
    public record AvailabilityWindowRequest(short dayOfWeek, short startMinute, short endMinute) { }
}
