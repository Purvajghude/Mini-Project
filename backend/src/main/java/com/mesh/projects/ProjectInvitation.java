package com.mesh.projects;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_invitation")
public class ProjectInvitation {
    @Id private UUID id;
    @Column(name = "project_id", nullable = false) private UUID projectId;
    @Column(name = "inviter_user_id", nullable = false) private UUID inviterUserId;
    @Column(name = "invitee_user_id", nullable = false) private UUID inviteeUserId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Status status = Status.PENDING;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Column(name = "responded_at") private Instant respondedAt;

    protected ProjectInvitation() { }
    public ProjectInvitation(UUID projectId, UUID inviterUserId, UUID inviteeUserId) {
        this.id = UUID.randomUUID(); this.projectId = projectId; this.inviterUserId = inviterUserId; this.inviteeUserId = inviteeUserId;
    }
    @PrePersist void created() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public UUID getInviterUserId() { return inviterUserId; }
    public UUID getInviteeUserId() { return inviteeUserId; }
    public Status getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getRespondedAt() { return respondedAt; }
    public void accept() { transition(Status.ACCEPTED); }
    public void decline() { transition(Status.DECLINED); }
    public void cancel() { transition(Status.CANCELLED); }
    private void transition(Status next) { this.status = next; this.respondedAt = Instant.now(); }
    public enum Status { PENDING, ACCEPTED, DECLINED, CANCELLED }
}
