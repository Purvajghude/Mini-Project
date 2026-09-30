package com.mesh.messages;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "group_message")
public class GroupMessage {
    @Id private UUID id;
    @Column(name = "project_id", nullable = false) private UUID projectId;
    @Column(name = "sender_user_id", nullable = false) private UUID senderUserId;
    @Column(nullable = false) private String content;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected GroupMessage() { }
    public GroupMessage(UUID projectId, UUID senderUserId, String content) { this.id = UUID.randomUUID(); this.projectId = projectId; this.senderUserId = senderUserId; this.content = content; }
    @PrePersist void created() { createdAt = Instant.now(); }
    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public UUID getSenderUserId() { return senderUserId; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
