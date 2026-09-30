package com.mesh.connections;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "collaboration_connection")
public class CollaborationConnection {
    @Id private UUID id;
    @Column(name = "user_one_id", nullable = false) private UUID userOneId;
    @Column(name = "user_two_id", nullable = false) private UUID userTwoId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected CollaborationConnection() { }
    public CollaborationConnection(UUID firstUserId, UUID secondUserId) {
        this.id = UUID.randomUUID();
        if (firstUserId.compareTo(secondUserId) < 0) { this.userOneId = firstUserId; this.userTwoId = secondUserId; }
        else { this.userOneId = secondUserId; this.userTwoId = firstUserId; }
    }
    @PrePersist void created() { createdAt = Instant.now(); }
    public UUID getId() { return id; }
    public UUID getUserOneId() { return userOneId; }
    public UUID getUserTwoId() { return userTwoId; }
    public Instant getCreatedAt() { return createdAt; }
}
