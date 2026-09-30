package com.mesh.calendar;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "availability_poll_option")
public class AvailabilityPollOption {
    @Id private UUID id;
    @Column(name = "poll_id", nullable = false) private UUID pollId;
    @Column(name = "starts_at", nullable = false) private Instant startsAt;
    @Column(name = "ends_at", nullable = false) private Instant endsAt;
    protected AvailabilityPollOption() { }
    public AvailabilityPollOption(UUID pollId, Instant startsAt, Instant endsAt) { this.id = UUID.randomUUID(); this.pollId = pollId; this.startsAt = startsAt; this.endsAt = endsAt; }
    public UUID getId() { return id; }
    public UUID getPollId() { return pollId; }
    public Instant getStartsAt() { return startsAt; }
    public Instant getEndsAt() { return endsAt; }
}
