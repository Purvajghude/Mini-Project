package com.mesh.projects;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@IdClass(ProjectMemberKey.class)
@Table(name = "project_member")
public class ProjectMember {
    @Id @Column(name = "project_id") private UUID projectId;
    @Id @Column(name = "user_id") private UUID userId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Role role;
    @Column(name = "joined_at", nullable = false) private Instant joinedAt;
    protected ProjectMember() { }
    public ProjectMember(UUID projectId, UUID userId, Role role) { this.projectId = projectId; this.userId = userId; this.role = role; }
    @PrePersist void created() { joinedAt = Instant.now(); }
    public UUID getProjectId() { return projectId; }
    public UUID getUserId() { return userId; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public enum Role { OWNER, MEMBER }
}
