package com.mesh.calendar;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "calendar_event")
public class CalendarEvent {
    @Id private UUID id;
    @Column(name = "project_id", nullable = false) private UUID projectId;
    @Column(nullable = false) private String title;
    private String description;
    @Column(name = "starts_at", nullable = false) private Instant startsAt;
    @Column(name = "ends_at", nullable = false) private Instant endsAt;
    @Column(name = "created_by_user_id", nullable = false) private UUID createdByUserId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected CalendarEvent() { }
    public CalendarEvent(UUID projectId, String title, String description, Instant startsAt, Instant endsAt, UUID createdByUserId) { this.id = UUID.randomUUID(); this.projectId = projectId; this.title = title; this.description = description; this.startsAt = startsAt; this.endsAt = endsAt; this.createdByUserId = createdByUserId; }
    @PrePersist void created() { createdAt = Instant.now(); }
    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Instant getStartsAt() { return startsAt; }
    public Instant getEndsAt() { return endsAt; }
    public UUID getCreatedByUserId() { return createdByUserId; }
    public Instant getCreatedAt() { return createdAt; }
    public void update(String title, String description, Instant startsAt, Instant endsAt) { this.title = title; this.description = description; this.startsAt = startsAt; this.endsAt = endsAt; }
}
