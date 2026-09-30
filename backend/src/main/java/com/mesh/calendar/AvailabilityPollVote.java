package com.mesh.calendar;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@IdClass(AvailabilityPollVoteKey.class)
@Table(name = "availability_poll_vote")
public class AvailabilityPollVote {
    @Id @Column(name = "poll_option_id") private UUID pollOptionId;
    @Id @Column(name = "user_id") private UUID userId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected AvailabilityPollVote() { }
    public AvailabilityPollVote(UUID pollOptionId, UUID userId) { this.pollOptionId = pollOptionId; this.userId = userId; }
    @PrePersist void created() { createdAt = Instant.now(); }
    public UUID getPollOptionId() { return pollOptionId; }
    public UUID getUserId() { return userId; }
}
