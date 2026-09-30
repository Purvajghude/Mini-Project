package com.mesh.projects;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProjectOwnershipModelTest {
    @Test
    void transferKeepsProjectAndMembershipOwnershipInSync() {
        UUID originalOwner = UUID.randomUUID();
        UUID newOwner = UUID.randomUUID();
        ProjectGroup project = new ProjectGroup("Campus map", null, null, originalOwner);
        ProjectMember oldMember = new ProjectMember(project.getId(), originalOwner, ProjectMember.Role.OWNER);
        ProjectMember newMember = new ProjectMember(project.getId(), newOwner, ProjectMember.Role.MEMBER);

        oldMember.setRole(ProjectMember.Role.MEMBER);
        newMember.setRole(ProjectMember.Role.OWNER);
        project.transferOwnership(newOwner);

        assertEquals(newOwner, project.getOwnerUserId());
        assertEquals(ProjectMember.Role.MEMBER, oldMember.getRole());
        assertEquals(ProjectMember.Role.OWNER, newMember.getRole());
    }
}
