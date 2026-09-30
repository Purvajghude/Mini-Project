package com.mesh.calendar;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "availability_poll")
public class AvailabilityPoll {
    @Id private UUID id;
    @Column(name = "project_id", nullable = false) private UUID projectId;
    @Column(nullable = false) private String title;
    @Column(name = "created_by_user_id", nullable = false) private UUID createdByUserId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Status status = Status.OPEN;
    @Column(name = "selected_option_id") private UUID selectedOptionId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "closed_at") private Instant closedAt;
    protected AvailabilityPoll() { }
    public AvailabilityPoll(UUID projectId, String title, UUID createdByUserId) { this.id = UUID.randomUUID(); this.projectId = projectId; this.title = title; this.createdByUserId = createdByUserId; }
    @PrePersist void created() { createdAt = Instant.now(); }
    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public String getTitle() { return title; }
    public UUID getCreatedByUserId() { return createdByUserId; }
    public Status getStatus() { return status; }
    public UUID getSelectedOptionId() { return selectedOptionId; }
    public Instant getCreatedAt() { return createdAt; }
    public void close(UUID selectedOptionId) { this.selectedOptionId = selectedOptionId; this.status = Status.CLOSED; this.closedAt = Instant.now(); }
    public void markScheduled() { this.status = Status.SCHEDULED; }
    public enum Status { OPEN, CLOSED, SCHEDULED }
}
