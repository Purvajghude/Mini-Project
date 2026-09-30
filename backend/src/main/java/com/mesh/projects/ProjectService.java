package com.mesh.projects;

import com.mesh.common.ApiException;
import com.mesh.connections.ConnectionService;
import com.mesh.profiles.StudentProfile;
import com.mesh.profiles.StudentProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {
    private final ProjectGroupRepository groups;
    private final ProjectMemberRepository members;
    private final StudentProfileRepository profiles;
    private final ConnectionService connections;
    private final ProjectAccessService access;

    public ProjectService(ProjectGroupRepository groups, ProjectMemberRepository members, StudentProfileRepository profiles, ConnectionService connections, ProjectAccessService access) {
        this.groups = groups; this.members = members; this.profiles = profiles; this.connections = connections; this.access = access;
    }
    @Transactional
    public ProjectResponse create(UUID ownerId, CreateProjectRequest request) {
        requireProfile(ownerId);
        ProjectGroup project = groups.save(new ProjectGroup(request.name().trim(), nullable(request.summary()), nullable(request.domain()), ownerId));
        members.save(new ProjectMember(project.getId(), ownerId, ProjectMember.Role.OWNER));
        return response(project);
    }
    @Transactional(readOnly = true)
    public List<ProjectResponse> list(UUID userId) { return members.findByUserIdOrderByJoinedAtDesc(userId).stream().map(member -> response(access.requireProject(member.getProjectId()))).toList(); }
    @Transactional(readOnly = true)
    public ProjectResponse get(UUID userId, UUID projectId) { access.requireMember(projectId, userId); return response(access.requireProject(projectId)); }
    @Transactional
    public ProjectResponse update(UUID ownerId, UUID projectId, UpdateProjectRequest request) {
        access.requireOwner(projectId, ownerId);
        ProjectGroup project = access.requireProject(projectId);
        project.update(request.name().trim(), nullable(request.summary()), nullable(request.domain()));
        return response(project);
    }
    @Transactional
    public ProjectResponse addMember(UUID ownerId, UUID projectId, UUID userId) {
        access.requireOwner(projectId, ownerId);
        requireProfile(userId);
        if (members.existsByProjectIdAndUserId(projectId, userId)) throw new ApiException(HttpStatus.CONFLICT, "This student is already a project member.");
        if (!connections.areConnected(ownerId, userId)) throw new ApiException(HttpStatus.BAD_REQUEST, "You can add only students you are connected with.");
        members.save(new ProjectMember(projectId, userId, ProjectMember.Role.MEMBER));
        return response(access.requireProject(projectId));
    }
    @Transactional
    public void removeMember(UUID ownerId, UUID projectId, UUID userId) {
        access.requireOwner(projectId, ownerId);
        if (ownerId.equals(userId)) throw new ApiException(HttpStatus.BAD_REQUEST, "Transfer ownership before leaving the project.");
        ProjectMemberKey key = new ProjectMemberKey(projectId, userId);
        if (!members.existsById(key)) throw new ApiException(HttpStatus.NOT_FOUND, "Project member was not found.");
        members.deleteById(key);
    }
    @Transactional
    public ProjectResponse transferOwnership(UUID ownerId, UUID projectId, UUID newOwnerId) {
        access.requireOwner(projectId, ownerId);
        if (ownerId.equals(newOwnerId)) throw new ApiException(HttpStatus.BAD_REQUEST, "The selected student already owns this project.");
        ProjectMember currentOwner = members.findById(new ProjectMemberKey(projectId, ownerId)).orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "The project owner membership is missing."));
        ProjectMember newOwner = members.findById(new ProjectMemberKey(projectId, newOwnerId)).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "The new owner must already be a project member."));
        ProjectGroup project = access.requireProject(projectId);
        currentOwner.setRole(ProjectMember.Role.MEMBER);
        newOwner.setRole(ProjectMember.Role.OWNER);
        project.transferOwnership(newOwnerId);
        return response(project);
    }
    @Transactional
    public void delete(UUID ownerId, UUID projectId) { access.requireOwner(projectId, ownerId); groups.delete(access.requireProject(projectId)); }

    private ProjectResponse response(ProjectGroup project) {
        List<MemberResponse> memberResponses = members.findByProjectId(project.getId()).stream().map(member -> {
            StudentProfile profile = requireProfile(member.getUserId());
            return new MemberResponse(profile.getUserId(), profile.getUsername(), profile.getDisplayName(), profile.getAvatarKey(), member.getRole().name());
        }).toList();
        return new ProjectResponse(project.getId(), project.getName(), project.getSummary(), project.getDomain(), project.getOwnerUserId(), project.getCreatedAt(), memberResponses);
    }
    private StudentProfile requireProfile(UUID userId) { return profiles.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile was not found.")); }
    private String nullable(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    public record CreateProjectRequest(String name, String summary, String domain) { }
    public record UpdateProjectRequest(String name, String summary, String domain) { }
    public record ProjectResponse(UUID id, String name, String summary, String domain, UUID ownerUserId, Instant createdAt, List<MemberResponse> members) { }
    public record MemberResponse(UUID userId, String username, String displayName, String avatarKey, String role) { }
}
