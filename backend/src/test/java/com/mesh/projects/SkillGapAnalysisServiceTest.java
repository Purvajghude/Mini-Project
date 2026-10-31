package com.mesh.projects;

import com.mesh.common.ApiException;
import com.mesh.skills.ProfileSkill;
import com.mesh.skills.ProfileSkillRepository;
import com.mesh.skills.Skill;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SkillGapAnalysisServiceTest {
    private final ProjectAccessService access = mock(ProjectAccessService.class);
    private final ProjectMemberRepository members = mock(ProjectMemberRepository.class);
    private final ProjectSkillRequirementRepository requirements = mock(ProjectSkillRequirementRepository.class);
    private final ProfileSkillRepository profileSkills = mock(ProfileSkillRepository.class);
    private final SkillGapAnalysisService service = new SkillGapAnalysisService(access, members, requirements, profileSkills);
    private final UUID owner = UUID.randomUUID();
    private final UUID teammate = UUID.randomUUID();
    private final ProjectGroup project = new ProjectGroup("Analysis test", null, null, owner);

    private Skill skill(long id, String name) {
        Skill skill = mock(Skill.class);
        when(skill.getId()).thenReturn(id);
        when(skill.getName()).thenReturn(name);
        return skill;
    }

    @Test void analyzes_all_members_without_adding_proficiencies() {
        Skill java = skill(1L, "Java");
        Skill python = skill(2L, "Python");
        Skill figma = skill(3L, "Figma");
        Skill git = skill(4L, "Git");
        when(access.requireProject(project.getId())).thenReturn(project);
        when(members.findByProjectId(project.getId())).thenReturn(List.of(
            new ProjectMember(project.getId(), owner, ProjectMember.Role.OWNER),
            new ProjectMember(project.getId(), teammate, ProjectMember.Role.MEMBER)));
        when(requirements.findForProject(project.getId())).thenReturn(List.of(
            new ProjectSkillRequirement(project.getId(), java, (short) 4, ProjectSkillRequirement.Importance.REQUIRED, null),
            new ProjectSkillRequirement(project.getId(), python, (short) 4, ProjectSkillRequirement.Importance.REQUIRED, null),
            new ProjectSkillRequirement(project.getId(), figma, (short) 3, ProjectSkillRequirement.Importance.REQUIRED, null),
            new ProjectSkillRequirement(project.getId(), git, (short) 2, ProjectSkillRequirement.Importance.PREFERRED, null)));
        when(profileSkills.findForProfiles(any())).thenReturn(List.of(
            new ProfileSkill(owner, 1L, java, (short) 2),
            new ProfileSkill(teammate, 1L, java, (short) 4),
            new ProfileSkill(owner, 2L, python, (short) 2),
            new ProfileSkill(teammate, 2L, python, (short) 3),
            new ProfileSkill(owner, 4L, git, (short) 2)));

        var result = service.analyze(owner, project.getId());

        assertEquals(2, result.currentMemberCount());
        assertEquals(2, result.remainingCapacity());
        assertEquals(SkillGapAnalysisService.CoverageStatus.COVERED, result.required().get(0).coverageStatus());
        assertEquals(List.of(teammate), result.required().get(0).satisfyingMemberIds());
        assertEquals(SkillGapAnalysisService.CoverageStatus.PARTIAL, result.required().get(1).coverageStatus());
        assertTrue(result.required().get(1).satisfyingMemberIds().isEmpty());
        assertEquals(SkillGapAnalysisService.CoverageStatus.UNCOVERED, result.required().get(2).coverageStatus());
        assertEquals(SkillGapAnalysisService.CoverageStatus.COVERED, result.preferred().get(0).coverageStatus());
        assertEquals(List.of(owner), result.preferred().get(0).satisfyingMemberIds());
    }

    @Test void rejects_unauthorized_viewer_before_loading_private_data() {
        UUID outsider = UUID.randomUUID();
        doThrow(new ApiException(HttpStatus.FORBIDDEN, "Only project members can access this project."))
            .when(access).requireMember(project.getId(), outsider);
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ApiException.class, () -> service.analyze(outsider, project.getId())).status());
        verify(requirements, never()).findForProject(any());
    }

    @Test void missing_requirements_return_conflict() {
        when(access.requireProject(project.getId())).thenReturn(project);
        when(requirements.findForProject(project.getId())).thenReturn(List.of());
        ApiException error = assertThrows(ApiException.class, () -> service.analyze(owner, project.getId()));
        assertEquals(HttpStatus.CONFLICT, error.status());
        assertEquals("Project requirements are missing.", error.getMessage());
    }

    @Test void full_team_has_zero_remaining_capacity() {
        project.setRequirementsMetadata((short) 1, "DRAFT");
        Skill java = skill(1L, "Java");
        when(access.requireProject(project.getId())).thenReturn(project);
        when(requirements.findForProject(project.getId())).thenReturn(List.of(new ProjectSkillRequirement(project.getId(), java, (short) 3, ProjectSkillRequirement.Importance.REQUIRED, null)));
        when(members.findByProjectId(project.getId())).thenReturn(List.of(new ProjectMember(project.getId(), owner, ProjectMember.Role.OWNER)));
        when(profileSkills.findForProfiles(any())).thenReturn(List.of());
        assertEquals(0, service.analyze(owner, project.getId()).remainingCapacity());
    }
}
