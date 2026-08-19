package com.meshconnect.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "matches", uniqueConstraints = @UniqueConstraint(name = "uq_match_pair", columnNames = {"user_one_id", "user_two_id"}))
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_one_id", nullable = false)
    private AppUser userOne;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_two_id", nullable = false)
    private AppUser userTwo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Match() { }
    public Match(AppUser first, AppUser second) {
        if (first.getId() >= second.getId()) throw new IllegalArgumentException("Match members must be in canonical order");
        this.userOne = first;
        this.userTwo = second;
    }
    @PrePersist void onCreate() { createdAt = Instant.now(); }
    public Long getId() { return id; }
    public AppUser getUserOne() { return userOne; }
    public AppUser getUserTwo() { return userTwo; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean includes(Long userId) { return userOne.getId().equals(userId) || userTwo.getId().equals(userId); }
    public AppUser otherMember(Long userId) { return userOne.getId().equals(userId) ? userTwo : userOne; }
}
