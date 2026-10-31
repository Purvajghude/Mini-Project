package com.mesh.projects;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_group")
public class ProjectGroup {
    @Id private UUID id;
    @Column(nullable = false) private String name;
    private String summary;
    private String domain;
    @Column(nullable = false) private String lifecycle = "ACTIVE";
    @Column(name = "target_team_size", nullable = false) private short targetTeamSize = 4;
    @Column(name = "owner_user_id", nullable = false) private UUID ownerUserId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    protected ProjectGroup() { }
    public ProjectGroup(String name, String summary, String domain, UUID ownerUserId) { this.id = UUID.randomUUID(); this.name = name; this.summary = summary; this.domain = domain; this.ownerUserId = ownerUserId; this.lifecycle = "DRAFT"; }
    @PrePersist void created() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getSummary() { return summary; }
    public String getDomain() { return domain; }
    public String getLifecycle() { return lifecycle; }
    public short getTargetTeamSize() { return targetTeamSize; }
    public void setRequirementsMetadata(short targetTeamSize, String lifecycle) { this.targetTeamSize = targetTeamSize; this.lifecycle = lifecycle; }
    public UUID getOwnerUserId() { return ownerUserId; }
    public Instant getCreatedAt() { return createdAt; }
    public void update(String name, String summary, String domain) { this.name = name; this.summary = summary; this.domain = domain; }
    public void transferOwnership(UUID newOwnerUserId) { this.ownerUserId = newOwnerUserId; }
}
