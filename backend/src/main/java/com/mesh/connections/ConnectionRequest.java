package com.mesh.connections;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "connection_request")
public class ConnectionRequest {
    @Id private UUID id;
    @Column(name = "sender_user_id", nullable = false) private UUID senderUserId;
    @Column(name = "recipient_user_id", nullable = false) private UUID recipientUserId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Status status = Status.PENDING;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Column(name = "responded_at") private Instant respondedAt;
    protected ConnectionRequest() { }
    public ConnectionRequest(UUID senderUserId, UUID recipientUserId) { this.id = UUID.randomUUID(); this.senderUserId = senderUserId; this.recipientUserId = recipientUserId; }
    @PrePersist void created() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void updated() { updatedAt = Instant.now(); }
    public UUID getId() { return id; }
    public UUID getSenderUserId() { return senderUserId; }
    public UUID getRecipientUserId() { return recipientUserId; }
    public Status getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public void accept() { changeStatus(Status.ACCEPTED); }
    public void decline() { changeStatus(Status.DECLINED); }
    public void cancel() { changeStatus(Status.CANCELLED); }
    public void reopen() { this.status = Status.PENDING; this.respondedAt = null; }
    private void changeStatus(Status status) { this.status = status; this.respondedAt = Instant.now(); }
    public enum Status { PENDING, ACCEPTED, DECLINED, CANCELLED }
}
