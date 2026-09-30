package com.mesh.messages;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "connection_message")
public class ConnectionMessage {
    @Id private UUID id;
    @Column(name = "connection_id", nullable = false) private UUID connectionId;
    @Column(name = "sender_user_id", nullable = false) private UUID senderUserId;
    @Column(nullable = false) private String content;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected ConnectionMessage() { }
    public ConnectionMessage(UUID connectionId, UUID senderUserId, String content) { this.id = UUID.randomUUID(); this.connectionId = connectionId; this.senderUserId = senderUserId; this.content = content; }
    @PrePersist void created() { createdAt = Instant.now(); }
    public UUID getId() { return id; }
    public UUID getConnectionId() { return connectionId; }
    public UUID getSenderUserId() { return senderUserId; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
