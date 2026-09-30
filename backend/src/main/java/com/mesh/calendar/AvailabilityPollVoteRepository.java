package com.mesh.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface AvailabilityPollVoteRepository extends JpaRepository<AvailabilityPollVote, AvailabilityPollVoteKey> {
    List<AvailabilityPollVote> findByPollOptionIdIn(Collection<UUID> optionIds);
}
