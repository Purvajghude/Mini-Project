package com.meshconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "interests", uniqueConstraints = @UniqueConstraint(name = "uq_interest_direction", columnNames = {"sender_id", "receiver_id"}))
public class Interest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private AppUser sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_id", nullable = false)
    private AppUser receiver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InterestStatus status = InterestStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Interest() { }
    public Interest(AppUser sender, AppUser receiver) { this.sender = sender; this.receiver = receiver; }
    @PrePersist void onCreate() { createdAt = Instant.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
    public Long getId() { return id; }
    public AppUser getSender() { return sender; }
    public AppUser getReceiver() { return receiver; }
    public InterestStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setStatus(InterestStatus status) { this.status = status; }
}
