package com.mesh.connections;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@IdClass(DiscoveryDecisionKey.class)
@Table(name = "discovery_decision")
public class DiscoveryDecision {
    @Id @Column(name = "actor_user_id") private UUID actorUserId;
    @Id @Column(name = "target_user_id") private UUID targetUserId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Decision decision;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    protected DiscoveryDecision() { }
    public DiscoveryDecision(UUID actorUserId, UUID targetUserId, Decision decision) { this.actorUserId = actorUserId; this.targetUserId = targetUserId; this.decision = decision; }
    @PrePersist void created() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    public UUID getTargetUserId() { return targetUserId; }
    public Decision getDecision() { return decision; }
    public void setDecision(Decision decision) { this.decision = decision; }
    public enum Decision { PASSED, SAVED }
}
