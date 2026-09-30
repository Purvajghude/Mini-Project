package com.mesh.projects;

import com.mesh.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class ProjectAccessService {
    private final ProjectGroupRepository groups;
    private final ProjectMemberRepository members;
    public ProjectAccessService(ProjectGroupRepository groups, ProjectMemberRepository members) { this.groups = groups; this.members = members; }
    @Transactional(readOnly = true)
    public ProjectGroup requireProject(UUID projectId) { return groups.findById(projectId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project was not found.")); }
    @Transactional(readOnly = true)
    public void requireMember(UUID projectId, UUID userId) {
        requireProject(projectId);
        if (!members.existsByProjectIdAndUserId(projectId, userId)) throw new ApiException(HttpStatus.FORBIDDEN, "Only project members can access this project.");
    }
    @Transactional(readOnly = true)
    public void requireOwner(UUID projectId, UUID userId) {
        ProjectGroup project = requireProject(projectId);
        if (!project.getOwnerUserId().equals(userId)) throw new ApiException(HttpStatus.FORBIDDEN, "Only the project owner can perform this action.");
    }
}
