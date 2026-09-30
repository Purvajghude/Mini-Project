package com.mesh.connections;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@IdClass(UserBlockKey.class)
@Table(name = "user_block")
public class UserBlock {
    @Id @Column(name = "blocker_user_id") private UUID blockerUserId;
    @Id @Column(name = "blocked_user_id") private UUID blockedUserId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected UserBlock() { }
    public UserBlock(UUID blockerUserId, UUID blockedUserId) { this.blockerUserId = blockerUserId; this.blockedUserId = blockedUserId; }
    @PrePersist void created() { createdAt = Instant.now(); }
    public UUID getBlockerUserId() { return blockerUserId; }
    public UUID getBlockedUserId() { return blockedUserId; }
}
