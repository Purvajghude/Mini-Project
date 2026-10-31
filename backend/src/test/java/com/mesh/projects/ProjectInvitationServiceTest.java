package com.mesh.projects;

import com.mesh.common.ApiException;
import com.mesh.connections.UserBlockRepository;
import com.mesh.profiles.StudentProfile;
import com.mesh.profiles.StudentProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProjectInvitationServiceTest {
    private final ProjectGroupRepository projects = mock(ProjectGroupRepository.class);
    private final ProjectMemberRepository members = mock(ProjectMemberRepository.class);
    private final ProjectInvitationRepository invitations = mock(ProjectInvitationRepository.class);
    private final StudentProfileRepository profiles = mock(StudentProfileRepository.class);
    private final UserBlockRepository blocks = mock(UserBlockRepository.class);
    private final ProjectAccessService access = mock(ProjectAccessService.class);
    private final ProjectInvitationService service = new ProjectInvitationService(projects, members, invitations, profiles, blocks, access);
    private final UUID ownerId = UUID.randomUUID(), inviteeId = UUID.randomUUID();
    private final ProjectGroup project = new ProjectGroup("Demo", null, null, ownerId);

    private void recruitingProject() {
        project.setRequirementsMetadata((short) 2, "RECRUITING");
        when(projects.findByIdForUpdate(project.getId())).thenReturn(Optional.of(project));
        when(access.requireProject(project.getId())).thenReturn(project);
        when(members.findByProjectId(project.getId())).thenReturn(List.of(new ProjectMember(project.getId(), ownerId, ProjectMember.Role.OWNER)));
        StudentProfile inviter = mock(StudentProfile.class);
        when(inviter.getDisplayName()).thenReturn("Student A");
        when(profiles.findById(ownerId)).thenReturn(Optional.of(inviter));
    }

    @Test void sends_without_a_personal_connection_and_reserves_capacity() {
        recruitingProject();
        when(profiles.findEligibleProjectCandidateById(inviteeId)).thenReturn(Optional.of(mock(StudentProfile.class)));
        when(invitations.saveAndFlush(any(ProjectInvitation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var response = service.send(ownerId, project.getId(), inviteeId);
        assertEquals("PENDING", response.status());
        assertEquals(inviteeId, response.inviteeUserId());
        verify(invitations).saveAndFlush(any(ProjectInvitation.class));
    }

    @Test void rejects_duplicate_pending_invitation_and_reserved_capacity() {
        recruitingProject();
        when(profiles.findEligibleProjectCandidateById(inviteeId)).thenReturn(Optional.of(mock(StudentProfile.class)));
        when(invitations.existsByProjectIdAndInviteeUserIdAndStatus(project.getId(), inviteeId, ProjectInvitation.Status.PENDING)).thenReturn(true);
        assertEquals(HttpStatus.CONFLICT, assertThrows(ApiException.class, () -> service.send(ownerId, project.getId(), inviteeId)).status());
        when(invitations.existsByProjectIdAndInviteeUserIdAndStatus(project.getId(), inviteeId, ProjectInvitation.Status.PENDING)).thenReturn(false);
        when(invitations.countByProjectIdAndStatus(project.getId(), ProjectInvitation.Status.PENDING)).thenReturn(1L);
        assertEquals(HttpStatus.CONFLICT, assertThrows(ApiException.class, () -> service.send(ownerId, project.getId(), inviteeId)).status());
        verify(invitations, never()).saveAndFlush(any());
    }

    @Test void rejects_synthetic_or_unonboarded_candidate_and_blocks() {
        recruitingProject();
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ApiException.class, () -> service.send(ownerId, project.getId(), inviteeId)).status());
        when(profiles.findEligibleProjectCandidateById(inviteeId)).thenReturn(Optional.of(mock(StudentProfile.class)));
        when(blocks.existsByBlockerUserIdAndBlockedUserId(ownerId, inviteeId)).thenReturn(true);
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ApiException.class, () -> service.send(ownerId, project.getId(), inviteeId)).status());
    }

    @Test void acceptance_atomically_adds_member_without_connection_check() {
        recruitingProject();
        ProjectInvitation invitation = new ProjectInvitation(project.getId(), ownerId, inviteeId);
        when(invitations.findById(invitation.getId())).thenReturn(Optional.of(invitation));
        when(invitations.findByIdForUpdate(invitation.getId())).thenReturn(Optional.of(invitation));
        when(profiles.findEligibleProjectCandidateById(inviteeId)).thenReturn(Optional.of(mock(StudentProfile.class)));
        when(members.saveAndFlush(any(ProjectMember.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var response = service.accept(inviteeId, invitation.getId());
        assertEquals("ACCEPTED", response.status());
        verify(members).saveAndFlush(argThat(member -> member.getUserId().equals(inviteeId) && member.getRole() == ProjectMember.Role.MEMBER));
        assertEquals(ProjectInvitation.Status.ACCEPTED, invitation.getStatus());
    }

    @Test void stale_or_full_acceptance_never_adds_membership() {
        recruitingProject();
        ProjectInvitation invitation = new ProjectInvitation(project.getId(), ownerId, inviteeId);
        when(invitations.findById(invitation.getId())).thenReturn(Optional.of(invitation));
        when(invitations.findByIdForUpdate(invitation.getId())).thenReturn(Optional.of(invitation));
        when(profiles.findEligibleProjectCandidateById(inviteeId)).thenReturn(Optional.of(mock(StudentProfile.class)));
        project.setRequirementsMetadata((short) 1, "RECRUITING");
        assertEquals(HttpStatus.CONFLICT, assertThrows(ApiException.class, () -> service.accept(inviteeId, invitation.getId())).status());
        project.setRequirementsMetadata((short) 2, "ACTIVE");
        assertEquals(HttpStatus.CONFLICT, assertThrows(ApiException.class, () -> service.accept(inviteeId, invitation.getId())).status());
        verify(members, never()).saveAndFlush(any());
    }

    @Test void another_student_cannot_accept_and_replay_is_rejected() {
        recruitingProject();
        ProjectInvitation invitation = new ProjectInvitation(project.getId(), ownerId, inviteeId);
        when(invitations.findById(invitation.getId())).thenReturn(Optional.of(invitation));
        when(invitations.findByIdForUpdate(invitation.getId())).thenReturn(Optional.of(invitation));
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ApiException.class, () -> service.accept(UUID.randomUUID(), invitation.getId())).status());
        invitation.decline();
        assertEquals(HttpStatus.CONFLICT, assertThrows(ApiException.class, () -> service.accept(inviteeId, invitation.getId())).status());
        verify(members, never()).saveAndFlush(any());
    }

    @Test void invitee_can_decline_and_owner_can_cancel_only_pending_invitations() {
        recruitingProject();
        ProjectInvitation decline = new ProjectInvitation(project.getId(), ownerId, inviteeId);
        when(invitations.findByIdForUpdate(decline.getId())).thenReturn(Optional.of(decline));
        assertEquals("DECLINED", service.decline(inviteeId, decline.getId()).status());
        ProjectInvitation cancel = new ProjectInvitation(project.getId(), ownerId, UUID.randomUUID());
        when(invitations.findByIdForUpdate(cancel.getId())).thenReturn(Optional.of(cancel));
        assertEquals("CANCELLED", service.cancel(ownerId, project.getId(), cancel.getId()).status());
        assertEquals(HttpStatus.CONFLICT, assertThrows(ApiException.class, () -> service.cancel(ownerId, project.getId(), cancel.getId())).status());
    }

    @Test void nonowner_cannot_send_or_cancel_invitations() {
        recruitingProject();
        UUID outsider = UUID.randomUUID();
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ApiException.class, () -> service.send(outsider, project.getId(), inviteeId)).status());
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ApiException.class, () -> service.cancel(outsider, project.getId(), UUID.randomUUID())).status());
        verify(invitations, never()).saveAndFlush(any());
    }
}
