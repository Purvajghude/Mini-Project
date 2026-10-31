package com.mesh.projects;

import com.mesh.common.ApiException;
import com.mesh.skills.Skill;
import com.mesh.skills.SkillRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProjectRequirementsServiceTest {
    private final ProjectAccessService access = mock(ProjectAccessService.class);
    private final ProjectMemberRepository members = mock(ProjectMemberRepository.class);
    private final ProjectSkillRequirementRepository requirements = mock(ProjectSkillRequirementRepository.class);
    private final SkillRepository skills = mock(SkillRepository.class);
    private final ProjectRequirementsService service = new ProjectRequirementsService(access, members, requirements, skills);
    private final UUID owner = UUID.randomUUID();
    private final ProjectGroup project = new ProjectGroup("Campus map", null, null, owner);

    @Test void rejects_duplicate_skills_before_replacing_rows() {
        when(access.requireProject(project.getId())).thenReturn(project);
        when(members.findByProjectId(project.getId())).thenReturn(List.of());
        var input = new ProjectRequirementsService.RequirementInput(1L, (short) 3, ProjectSkillRequirement.Importance.REQUIRED, null);
        assertThrows(ApiException.class, () -> service.replace(owner, project.getId(), new ProjectRequirementsService.ReplaceRequest((short) 4, "DRAFT", List.of(input, input))));
        verify(requirements, never()).deleteByProjectId(any());
    }

    @Test void rejects_target_below_existing_member_count() {
        when(access.requireProject(project.getId())).thenReturn(project);
        when(members.findByProjectId(project.getId())).thenReturn(List.of(new ProjectMember(project.getId(), owner, ProjectMember.Role.OWNER), new ProjectMember(project.getId(), UUID.randomUUID(), ProjectMember.Role.MEMBER)));
        assertThrows(ApiException.class, () -> service.replace(owner, project.getId(), new ProjectRequirementsService.ReplaceRequest((short) 1, "DRAFT", List.of())));
    }

    @Test void unrelated_user_cannot_read_private_requirements() {
        UUID stranger = UUID.randomUUID();
        doThrow(new ApiException(org.springframework.http.HttpStatus.FORBIDDEN, "Only project members can access this project."))
            .when(access).requireMember(project.getId(), stranger);
        assertThrows(ApiException.class, () -> service.get(stranger, project.getId()));
        verify(requirements, never()).findForProject(any());
    }

    @Test void new_projects_are_drafts_with_owner_in_target_size() {
        assertEquals("DRAFT", project.getLifecycle());
        assertEquals(4, project.getTargetTeamSize());
    }

    @Test void draft_requirements_can_be_saved_without_advancing_lifecycle() {
        when(access.requireProject(project.getId())).thenReturn(project);
        when(members.findByProjectId(project.getId())).thenReturn(List.of(new ProjectMember(project.getId(), owner, ProjectMember.Role.OWNER)));
        Skill skill = mock(Skill.class);
        when(skill.getId()).thenReturn(1L);
        when(skills.findAllById(any())).thenReturn(List.of(skill));
        var input = new ProjectRequirementsService.RequirementInput(1L, (short) 3, ProjectSkillRequirement.Importance.REQUIRED, null);
        service.replace(owner, project.getId(), new ProjectRequirementsService.ReplaceRequest((short) 1, "DRAFT", List.of(input)));
        assertEquals("DRAFT", project.getLifecycle());
        assertEquals(1, project.getTargetTeamSize());
        verify(requirements).save(any(ProjectSkillRequirement.class));
    }

    @Test void recruiting_requires_requirements_and_direct_draft_to_active_is_rejected() {
        when(access.requireProject(project.getId())).thenReturn(project);
        when(members.findByProjectId(project.getId())).thenReturn(List.of(new ProjectMember(project.getId(), owner, ProjectMember.Role.OWNER)));
        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST,
            assertThrows(ApiException.class, () -> service.replace(owner, project.getId(), new ProjectRequirementsService.ReplaceRequest((short) 4, "RECRUITING", List.of()))).status());
        assertEquals(org.springframework.http.HttpStatus.CONFLICT,
            assertThrows(ApiException.class, () -> service.replace(owner, project.getId(), new ProjectRequirementsService.ReplaceRequest((short) 4, "ACTIVE", List.of()))).status());
        verify(requirements, never()).deleteByProjectId(any());
    }

    @Test void owner_can_advance_recruiting_to_active_but_cannot_revert() {
        project.setRequirementsMetadata((short) 4, "RECRUITING");
        when(access.requireProject(project.getId())).thenReturn(project);
        when(members.findByProjectId(project.getId())).thenReturn(List.of(new ProjectMember(project.getId(), owner, ProjectMember.Role.OWNER)));
        Skill skill = mock(Skill.class);
        when(skill.getId()).thenReturn(1L);
        when(skills.findAllById(any())).thenReturn(List.of(skill));
        var input = new ProjectRequirementsService.RequirementInput(1L, (short) 3, ProjectSkillRequirement.Importance.REQUIRED, null);
        service.replace(owner, project.getId(), new ProjectRequirementsService.ReplaceRequest((short) 4, "ACTIVE", List.of(input)));
        assertEquals("ACTIVE", project.getLifecycle());
        assertEquals(org.springframework.http.HttpStatus.CONFLICT,
            assertThrows(ApiException.class, () -> service.replace(owner, project.getId(), new ProjectRequirementsService.ReplaceRequest((short) 4, "DRAFT", List.of(input)))).status());
    }
}
