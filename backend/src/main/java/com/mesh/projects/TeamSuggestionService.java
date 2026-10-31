package com.mesh.projects;

import com.mesh.common.ApiException;
import com.mesh.connections.UserBlock;
import com.mesh.connections.UserBlockRepository;
import com.mesh.github.GitHubRepositoryEvidence;
import com.mesh.github.GitHubRepositoryEvidenceRepository;
import com.mesh.profiles.*;
import com.mesh.skills.ProfileSkill;
import com.mesh.skills.ProfileSkillRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TeamSuggestionService {
    private final ProjectAccessService access;
    private final ProjectMemberRepository members;
    private final ProjectSkillRequirementRepository requirements;
    private final StudentProfileRepository profiles;
    private final ProfileSkillRepository profileSkills;
    private final ProfileDesiredSkillRepository desiredSkills;
    private final AvailabilityWindowRepository availability;
    private final UserBlockRepository blocks;
    private final GitHubRepositoryEvidenceRepository evidence;
    private final SkillGapAnalysisService gapService;
    private final TeamOptimizationEngine engine = new TeamOptimizationEngine();

    public TeamSuggestionService(ProjectAccessService access, ProjectMemberRepository members,
                                 ProjectSkillRequirementRepository requirements, StudentProfileRepository profiles,
                                 ProfileSkillRepository profileSkills, ProfileDesiredSkillRepository desiredSkills,
                                 AvailabilityWindowRepository availability, UserBlockRepository blocks,
                                 GitHubRepositoryEvidenceRepository evidence, SkillGapAnalysisService gapService) {
        this.access = access; this.members = members; this.requirements = requirements; this.profiles = profiles;
        this.profileSkills = profileSkills; this.desiredSkills = desiredSkills; this.availability = availability;
        this.blocks = blocks; this.evidence = evidence; this.gapService = gapService;
    }

    @Transactional(readOnly = true)
    public SuggestionSet suggest(UUID ownerId, UUID projectId, Request request) {
        access.requireOwner(projectId, ownerId);
        ProjectGroup project = access.requireProject(projectId);
        if (!Set.of("DRAFT", "RECRUITING").contains(project.getLifecycle()))
            throw new ApiException(HttpStatus.CONFLICT, "Team suggestions require a draft or recruiting project.");
        SkillGapAnalysisService.Analysis gap = gapService.analyze(ownerId, projectId);
        if (gap.currentMemberCount() > project.getTargetTeamSize())
            throw new ApiException(HttpStatus.CONFLICT, "Target team size is below current membership.");
        if (gap.remainingCapacity() == 0)
            return new SuggestionSet(projectId, project.getTargetTeamSize(), gap.currentMemberCount(), 0, gap, List.of(),
                "The project is at its target team size.");

        List<TeamOptimizationEngine.Requirement> required = requirements.findForProject(projectId).stream()
            .map(r -> new TeamOptimizationEngine.Requirement(r.getSkill().getId(), r.getSkill().getName(), r.getMinimumProficiency(), r.getImportance())).toList();
        List<UUID> memberIds = members.findByProjectId(projectId).stream().map(ProjectMember::getUserId).distinct().sorted().toList();
        Set<UUID> memberSet = Set.copyOf(memberIds);
        List<StudentProfile> memberProfiles = profiles.findAllById(memberIds);
        if (memberProfiles.size() != memberIds.size()) throw new ApiException(HttpStatus.CONFLICT, "A project member profile is missing.");
        List<StudentProfile> candidates = profiles.findEligibleProjectCandidates().stream()
            .filter(profile -> !memberSet.contains(profile.getUserId()))
            .filter(profile -> !request.excludeCandidateIds().contains(profile.getUserId()))
            .sorted(Comparator.comparing(StudentProfile::getUserId)).toList();
        List<UUID> allIds = new ArrayList<>(memberIds);
        candidates.forEach(profile -> allIds.add(profile.getUserId()));
        Map<UUID, Map<Long, Short>> skillLevels = new HashMap<>();
        for (ProfileSkill row : profileSkills.findForProfiles(allIds))
            skillLevels.computeIfAbsent(row.getProfileUserId(), ignored -> new HashMap<>()).put(row.getSkill().getId(), row.getSelfAssessedProficiency());
        Map<UUID, Set<Long>> desired = new HashMap<>();
        for (ProfileDesiredSkill row : desiredSkills.findForProfiles(allIds))
            desired.computeIfAbsent(row.getProfileUserId(), ignored -> new HashSet<>()).add(row.getSkill().getId());
        Map<UUID, List<AvailabilityWindow>> windows = availability.findByProfileUserIdInOrderByDayOfWeekAscStartMinuteAsc(allIds).stream()
            .collect(Collectors.groupingBy(AvailabilityWindow::getProfileUserId));
        Map<UUID, Set<String>> evidenceLanguages = new HashMap<>();
        for (GitHubRepositoryEvidence row : evidence.findByMeshUserIdIn(allIds)) {
            Set<String> languages = evidenceLanguages.computeIfAbsent(row.getMeshUserId(), ignored -> new HashSet<>());
            if (row.getPrimaryLanguage() != null) languages.add(normalize(row.getPrimaryLanguage()));
            row.getLanguages().forEach(language -> languages.add(normalize(language.getLanguage())));
        }
        Map<UUID, StudentProfile> byId = new HashMap<>();
        memberProfiles.forEach(profile -> byId.put(profile.getUserId(), profile));
        candidates.forEach(profile -> byId.put(profile.getUserId(), profile));
        Set<UUID> allIdSet = Set.copyOf(allIds);
        Set<TeamOptimizationEngine.BlockedPair> blockedPairs = blocks.findByBlockerUserIdInOrBlockedUserIdIn(allIdSet, allIdSet).stream()
            .filter(block -> allIdSet.contains(block.getBlockerUserId()) && allIdSet.contains(block.getBlockedUserId()))
            .map(block -> TeamOptimizationEngine.BlockedPair.of(block.getBlockerUserId(), block.getBlockedUserId()))
            .collect(Collectors.toSet());
        List<TeamOptimizationEngine.Person> current = memberIds.stream().map(id -> person(byId.get(id), skillLevels, desired,
            TeamOptimizationEngine.AvailabilityStatus.UNKNOWN, evidenceLanguages, required)).toList();
        List<TeamOptimizationEngine.Person> eligible = candidates.stream()
            .filter(profile -> memberIds.stream().noneMatch(id -> blockedPairs.contains(TeamOptimizationEngine.BlockedPair.of(id, profile.getUserId()))))
            .map(profile -> person(profile, skillLevels, desired, availabilityStatus(profile, memberProfiles, windows), evidenceLanguages, required))
            .filter(person -> request.availabilityPolicy() != AvailabilityPolicy.REQUIRE_OVERLAP || person.availabilityStatus() == TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE)
            .toList();
        var input = new TeamOptimizationEngine.Input(required, current, eligible, blockedPairs, project.getTargetTeamSize(), request.alternativeCount());
        List<TeamOptimizationEngine.Alternative> alternatives = engine.suggest(input);
        return new SuggestionSet(projectId, project.getTargetTeamSize(), current.size(), gap.remainingCapacity(), gap,
            alternatives, alternatives.isEmpty() ? "No eligible students currently contribute to the project requirements." :
                "Suggestions use self-declared skills and conservative proficiency thresholds.");
    }

    private TeamOptimizationEngine.Person person(StudentProfile profile, Map<UUID, Map<Long, Short>> levels,
                                                  Map<UUID, Set<Long>> desired, TeamOptimizationEngine.AvailabilityStatus status,
                                                  Map<UUID, Set<String>> evidenceLanguages, List<TeamOptimizationEngine.Requirement> requirements) {
        UUID id = profile.getUserId();
        Set<String> languages = evidenceLanguages.getOrDefault(id, Set.of());
        Set<Long> supported = requirements.stream().filter(r -> levels.getOrDefault(id, Map.of()).getOrDefault(r.skillId(), (short) 0) >= r.minimumProficiency() && languages.contains(normalize(r.skillName())))
            .map(TeamOptimizationEngine.Requirement::skillId).collect(Collectors.toSet());
        return new TeamOptimizationEngine.Person(id, profile.getDisplayName(), levels.getOrDefault(id, Map.of()),
            desired.getOrDefault(id, Set.of()), status, supported);
    }

    TeamOptimizationEngine.AvailabilityStatus availabilityStatus(StudentProfile candidate, List<StudentProfile> members,
                                                                        Map<UUID, List<AvailabilityWindow>> windows) {
        String timezone = candidate.getAvailabilityTimezone();
        if (timezone == null || windows.getOrDefault(candidate.getUserId(), List.of()).isEmpty()) return TeamOptimizationEngine.AvailabilityStatus.UNKNOWN;
        List<AvailabilityWindow> memberWindows = new ArrayList<>();
        for (StudentProfile member : members) {
            List<AvailabilityWindow> current = windows.getOrDefault(member.getUserId(), List.of());
            if (current.isEmpty() || !timezone.equals(member.getAvailabilityTimezone())) return TeamOptimizationEngine.AvailabilityStatus.UNKNOWN;
            memberWindows.addAll(current);
        }
        if (memberWindows.isEmpty()) return TeamOptimizationEngine.AvailabilityStatus.UNKNOWN;
        boolean[] available = new boolean[7 * 1440];
        for (AvailabilityWindow window : memberWindows) mark(available, window);
        boolean[] candidateMinutes = new boolean[7 * 1440];
        for (AvailabilityWindow window : windows.get(candidate.getUserId())) mark(candidateMinutes, window);
        int overlap = 0;
        for (int minute = 0; minute < available.length; minute++) if (available[minute] && candidateMinutes[minute]) overlap++;
        return overlap >= 60 ? TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE : TeamOptimizationEngine.AvailabilityStatus.INCOMPATIBLE;
    }
    private void mark(boolean[] minutes, AvailabilityWindow window) {
        int start = (window.getDayOfWeek() - 1) * 1440 + window.getStartMinute();
        int end = (window.getDayOfWeek() - 1) * 1440 + window.getEndMinute();
        for (int minute = start; minute < end; minute++) minutes[minute] = true;
    }
    private String normalize(String value) { return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", ""); }

    public enum AvailabilityPolicy { REQUIRE_OVERLAP, ALLOW_UNKNOWN }
    public record Request(int alternativeCount, Set<UUID> excludeCandidateIds, AvailabilityPolicy availabilityPolicy) { }
    public record SuggestionSet(UUID projectId, short targetTeamSize, int currentMemberCount, int remainingCapacity,
                                SkillGapAnalysisService.Analysis gapAnalysis,
                                List<TeamOptimizationEngine.Alternative> alternatives, String explanation) { }
}
