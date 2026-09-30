package com.mesh.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AvailabilityPollOptionRepository extends JpaRepository<AvailabilityPollOption, UUID> {
    List<AvailabilityPollOption> findByPollIdOrderByStartsAtAsc(UUID pollId);
    Optional<AvailabilityPollOption> findByIdAndPollId(UUID id, UUID pollId);
}
