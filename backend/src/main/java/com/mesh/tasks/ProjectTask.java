package com.mesh.tasks;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "project_task")
public class ProjectTask {
    @Id private UUID id;
    @Column(name = "project_id", nullable = false) private UUID projectId;
    @Column(nullable = false) private String title;
    private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Status status = Status.TODO;
    @Column(name = "assignee_user_id") private UUID assigneeUserId;
    @Column(name = "due_date") private LocalDate dueDate;
    @Column(name = "created_by_user_id", nullable = false) private UUID createdByUserId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    protected ProjectTask() { }
    public ProjectTask(UUID projectId, String title, String description, UUID assigneeUserId, LocalDate dueDate, UUID createdByUserId) { this.id = UUID.randomUUID(); this.projectId = projectId; this.title = title; this.description = description; this.assigneeUserId = assigneeUserId; this.dueDate = dueDate; this.createdByUserId = createdByUserId; }
    @PrePersist void created() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Status getStatus() { return status; }
    public UUID getAssigneeUserId() { return assigneeUserId; }
    public LocalDate getDueDate() { return dueDate; }
    public UUID getCreatedByUserId() { return createdByUserId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void update(String title, String description, Status status, UUID assigneeUserId, LocalDate dueDate) { this.title = title; this.description = description; this.status = status; this.assigneeUserId = assigneeUserId; this.dueDate = dueDate; }
    public enum Status { TODO, IN_PROGRESS, DONE }
}
