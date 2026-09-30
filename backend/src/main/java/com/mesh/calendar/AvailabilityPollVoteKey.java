package com.mesh.calendar;

import java.io.Serializable;
import java.util.UUID;

public record AvailabilityPollVoteKey(UUID pollOptionId, UUID userId) implements Serializable { }
