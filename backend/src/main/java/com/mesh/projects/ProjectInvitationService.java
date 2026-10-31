package com.mesh.projects;

import com.mesh.common.ApiException;
import com.mesh.connections.UserBlockRepository;
import com.mesh.profiles.StudentProfile;
import com.mesh.profiles.StudentProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ProjectInvitationService {
    private final ProjectGroupRepository projects;
    private final ProjectMemberRepository members;
    private final ProjectInvitationRepository invitations;
    private final StudentProfileRepository profiles;
    private final UserBlockRepository blocks;
    private final ProjectAccessService access;

    public ProjectInvitationService(ProjectGroupRepository projects, ProjectMemberRepository members,
                                    ProjectInvitationRepository invitations, StudentProfileRepository profiles,
                                    UserBlockRepository blocks, ProjectAccessService access) {
        this.projects = projects; this.members = members; this.invitations = invitations;
        this.profiles = profiles; this.blocks = blocks; this.access = access;
    }

    @Transactional
    public InvitationResponse send(UUID ownerId, UUID projectId, UUID inviteeId) {
        ProjectGroup project = lockedProject(projectId);
        requireOwner(project, ownerId);
        requireRecruiting(project);
        if (ownerId.equals(inviteeId) || members.existsByProjectIdAndUserId(projectId, inviteeId))
            throw new ApiException(HttpStatus.CONFLICT, "This student is already a project member.");
        requireEligible(inviteeId);
        requireUnblocked(projectId, inviteeId);
        if (invitations.existsByProjectIdAndInviteeUserIdAndStatus(projectId, inviteeId, ProjectInvitation.Status.PENDING))
            throw new ApiException(HttpStatus.CONFLICT, "A project invitation is already pending for this student.");
        long occupied = members.findByProjectId(projectId).size() + invitations.countByProjectIdAndStatus(projectId, ProjectInvitation.Status.PENDING);
        if (occupied >= project.getTargetTeamSize()) throw new ApiException(HttpStatus.CONFLICT, "Project team capacity is full or reserved by pending invitations.");
        return response(invitations.saveAndFlush(new ProjectInvitation(projectId, ownerId, inviteeId)), project);
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> incoming(UUID inviteeId) {
        return invitations.findByInviteeUserIdAndStatusOrderByCreatedAtDesc(inviteeId, ProjectInvitation.Status.PENDING).stream()
            .map(invitation -> response(invitation, access.requireProject(invitation.getProjectId()))).toList();
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> projectInvitations(UUID ownerId, UUID projectId) {
        access.requireOwner(projectId, ownerId);
        ProjectGroup project = access.requireProject(projectId);
        return invitations.findByProjectIdOrderByCreatedAtDesc(projectId).stream().map(invitation -> response(invitation, project)).toList();
    }

    @Transactional
    public InvitationResponse accept(UUID inviteeId, UUID invitationId) {
        ProjectInvitation snapshot = invitations.findById(invitationId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project invitation was not found."));
        ProjectGroup project = lockedProject(snapshot.getProjectId());
        ProjectInvitation invitation = lockedInvitation(invitationId);
        requireIncomingPending(invitation, inviteeId);
        requireRecruiting(project);
        requireEligible(inviteeId);
        requireUnblocked(project.getId(), inviteeId);
        if (members.existsByProjectIdAndUserId(project.getId(), inviteeId))
            throw new ApiException(HttpStatus.CONFLICT, "This student is already a project member.");
        if (members.findByProjectId(project.getId()).size() >= project.getTargetTeamSize())
            throw new ApiException(HttpStatus.CONFLICT, "Project team is full. Ask the owner to refresh invitations.");
        members.saveAndFlush(new ProjectMember(project.getId(), inviteeId, ProjectMember.Role.MEMBER));
        invitation.accept();
        return response(invitation, project);
    }

    @Transactional
    public InvitationResponse decline(UUID inviteeId, UUID invitationId) {
        ProjectInvitation invitation = lockedInvitation(invitationId);
        requireIncomingPending(invitation, inviteeId);
        invitation.decline();
        return response(invitation, access.requireProject(invitation.getProjectId()));
    }

    @Transactional
    public InvitationResponse cancel(UUID ownerId, UUID projectId, UUID invitationId) {
        ProjectGroup project = lockedProject(projectId);
        requireOwner(project, ownerId);
        ProjectInvitation invitation = lockedInvitation(invitationId);
        if (!invitation.getProjectId().equals(projectId)) throw new ApiException(HttpStatus.NOT_FOUND, "Project invitation was not found.");
        if (invitation.getStatus() != ProjectInvitation.Status.PENDING) throw new ApiException(HttpStatus.CONFLICT, "Only a pending invitation can be cancelled.");
        invitation.cancel();
        return response(invitation, project);
    }

    private ProjectGroup lockedProject(UUID projectId) {
        return projects.findByIdForUpdate(projectId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project was not found."));
    }
    private ProjectInvitation lockedInvitation(UUID invitationId) {
        return invitations.findByIdForUpdate(invitationId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project invitation was not found."));
    }
    private void requireOwner(ProjectGroup project, UUID ownerId) {
        if (!project.getOwnerUserId().equals(ownerId)) throw new ApiException(HttpStatus.FORBIDDEN, "Only the project owner can perform this action.");
    }
    private void requireRecruiting(ProjectGroup project) {
        if (!"RECRUITING".equals(project.getLifecycle())) throw new ApiException(HttpStatus.CONFLICT, "Project must be recruiting to invite or accept students.");
    }
    private StudentProfile requireEligible(UUID userId) {
        return profiles.findEligibleProjectCandidateById(userId).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "This student is not eligible for project invitations."));
    }
    private void requireUnblocked(UUID projectId, UUID inviteeId) {
        for (ProjectMember member : members.findByProjectId(projectId)) {
            UUID memberId = member.getUserId();
            if (blocks.existsByBlockerUserIdAndBlockedUserId(memberId, inviteeId) || blocks.existsByBlockerUserIdAndBlockedUserId(inviteeId, memberId))
                throw new ApiException(HttpStatus.FORBIDDEN, "This student is unavailable for project invitations.");
        }
    }
    private void requireIncomingPending(ProjectInvitation invitation, UUID inviteeId) {
        if (!invitation.getInviteeUserId().equals(inviteeId)) throw new ApiException(HttpStatus.FORBIDDEN, "This invitation belongs to another student.");
        if (invitation.getStatus() != ProjectInvitation.Status.PENDING) throw new ApiException(HttpStatus.CONFLICT, "Project invitation is no longer pending.");
    }
    private InvitationResponse response(ProjectInvitation invitation, ProjectGroup project) {
        StudentProfile inviter = profiles.findById(invitation.getInviterUserId()).orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Invitation sender profile is missing."));
        return new InvitationResponse(invitation.getId(), project.getId(), project.getName(), invitation.getInviterUserId(), inviter.getDisplayName(),
            invitation.getInviteeUserId(), invitation.getStatus().name(), invitation.getCreatedAt(), invitation.getRespondedAt());
    }

    public record InvitationResponse(UUID id, UUID projectId, String projectName, UUID inviterUserId, String inviterName,
                                     UUID inviteeUserId, String status, Instant createdAt, Instant respondedAt) { }
}
