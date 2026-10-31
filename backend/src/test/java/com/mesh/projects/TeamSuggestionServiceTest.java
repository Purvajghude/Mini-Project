package com.mesh.projects;

import com.mesh.common.ApiException;
import com.mesh.connections.UserBlockRepository;
import com.mesh.github.GitHubRepositoryEvidenceRepository;
import com.mesh.profiles.*;
import com.mesh.skills.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TeamSuggestionServiceTest {
    private final ProjectAccessService access = mock(ProjectAccessService.class);
    private final ProjectMemberRepository members = mock(ProjectMemberRepository.class);
    private final ProjectSkillRequirementRepository requirements = mock(ProjectSkillRequirementRepository.class);
    private final StudentProfileRepository profiles = mock(StudentProfileRepository.class);
    private final ProfileSkillRepository skills = mock(ProfileSkillRepository.class);
    private final ProfileDesiredSkillRepository desired = mock(ProfileDesiredSkillRepository.class);
    private final AvailabilityWindowRepository availability = mock(AvailabilityWindowRepository.class);
    private final UserBlockRepository blocks = mock(UserBlockRepository.class);
    private final GitHubRepositoryEvidenceRepository evidence = mock(GitHubRepositoryEvidenceRepository.class);
    private final SkillGapAnalysisService gaps = mock(SkillGapAnalysisService.class);
    private final TeamSuggestionService service = new TeamSuggestionService(access, members, requirements, profiles, skills, desired, availability, blocks, evidence, gaps);
    private final UUID ownerId = UUID.randomUUID();
    private final UUID candidateId = UUID.randomUUID();
    private final ProjectGroup project = new ProjectGroup("Test", null, null, ownerId);
    private final TeamSuggestionService.Request request = new TeamSuggestionService.Request(3, Set.of(), TeamSuggestionService.AvailabilityPolicy.ALLOW_UNKNOWN);

    @Test void includes_real_candidate_with_declared_skill_and_current_owner_in_capacity() {
        when(access.requireProject(project.getId())).thenReturn(project);
        when(gaps.analyze(ownerId, project.getId())).thenReturn(new SkillGapAnalysisService.Analysis(project.getId(), "DRAFT", (short) 4, 1, 3, List.of(), List.of()));
        when(members.findByProjectId(project.getId())).thenReturn(List.of(new ProjectMember(project.getId(), ownerId, ProjectMember.Role.OWNER)));
        StudentProfile owner = mock(StudentProfile.class);
        when(owner.getUserId()).thenReturn(ownerId);
        StudentProfile candidate = mock(StudentProfile.class);
        when(candidate.getUserId()).thenReturn(candidateId);
        when(candidate.getDisplayName()).thenReturn("Student B");
        when(profiles.findAllById(any())).thenReturn(List.of(owner));
        when(profiles.findEligibleProjectCandidates()).thenReturn(List.of(candidate));
        Skill java = mock(Skill.class);
        when(java.getId()).thenReturn(1L);
        when(java.getName()).thenReturn("Java");
        when(requirements.findForProject(project.getId())).thenReturn(List.of(new ProjectSkillRequirement(project.getId(), java, (short) 3, ProjectSkillRequirement.Importance.REQUIRED, null)));
        when(skills.findForProfiles(any())).thenReturn(List.of(new ProfileSkill(candidateId, 1L, java, (short) 4)));

        var result = service.suggest(ownerId, project.getId(), request);

        assertEquals(1, result.currentMemberCount());
        assertEquals(3, result.remainingCapacity());
        assertEquals(candidateId, result.alternatives().get(0).candidates().get(0).userId());
        assertEquals(List.of(1L), result.alternatives().get(0).coveredRequiredSkillIds());
        var strict = service.suggest(ownerId, project.getId(), new TeamSuggestionService.Request(3, Set.of(), TeamSuggestionService.AvailabilityPolicy.REQUIRE_OVERLAP));
        assertTrue(strict.alternatives().isEmpty());
    }

    @Test void only_owner_can_request_suggestions() {
        UUID outsider = UUID.randomUUID();
        doThrow(new ApiException(HttpStatus.FORBIDDEN, "Only the project owner can perform this action."))
            .when(access).requireOwner(project.getId(), outsider);
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ApiException.class, () -> service.suggest(outsider, project.getId(), request)).status());
        verify(profiles, never()).findEligibleProjectCandidates();
    }

    @Test void active_projects_cannot_request_new_team_suggestions() {
        project.setRequirementsMetadata((short) 4, "ACTIVE");
        when(access.requireProject(project.getId())).thenReturn(project);
        assertEquals(HttpStatus.CONFLICT, assertThrows(ApiException.class, () -> service.suggest(ownerId, project.getId(), request)).status());
    }

    @Test void full_team_returns_no_addable_alternatives() {
        project.setRequirementsMetadata((short) 1, "DRAFT");
        when(access.requireProject(project.getId())).thenReturn(project);
        when(gaps.analyze(ownerId, project.getId())).thenReturn(new SkillGapAnalysisService.Analysis(project.getId(), "DRAFT", (short) 1, 1, 0, List.of(), List.of()));
        var result = service.suggest(ownerId, project.getId(), request);
        assertTrue(result.alternatives().isEmpty());
        verify(profiles, never()).findEligibleProjectCandidates();
    }

    @Test void availability_uses_actual_shared_minutes_and_preserves_unknown_timezones() {
        StudentProfile owner = mock(StudentProfile.class);
        StudentProfile candidate = mock(StudentProfile.class);
        when(owner.getUserId()).thenReturn(ownerId);
        when(candidate.getUserId()).thenReturn(candidateId);
        when(owner.getAvailabilityTimezone()).thenReturn("Asia/Kolkata");
        when(candidate.getAvailabilityTimezone()).thenReturn("Asia/Kolkata", "Asia/Kolkata", "UTC");
        var ownerWindow = new AvailabilityWindow(ownerId, (short) 1, (short) 600, (short) 720);
        var overlapping = new AvailabilityWindow(candidateId, (short) 1, (short) 630, (short) 720);
        var separate = new AvailabilityWindow(candidateId, (short) 1, (short) 800, (short) 900);
        assertEquals(TeamOptimizationEngine.AvailabilityStatus.COMPATIBLE,
            service.availabilityStatus(candidate, List.of(owner), Map.of(ownerId, List.of(ownerWindow), candidateId, List.of(overlapping))));
        assertEquals(TeamOptimizationEngine.AvailabilityStatus.INCOMPATIBLE,
            service.availabilityStatus(candidate, List.of(owner), Map.of(ownerId, List.of(ownerWindow), candidateId, List.of(separate))));
        assertEquals(TeamOptimizationEngine.AvailabilityStatus.UNKNOWN,
            service.availabilityStatus(candidate, List.of(owner), Map.of(ownerId, List.of(ownerWindow), candidateId, List.of(overlapping))));
    }
}
