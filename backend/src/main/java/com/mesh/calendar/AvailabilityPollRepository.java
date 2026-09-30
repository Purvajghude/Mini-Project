package com.mesh.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AvailabilityPollRepository extends JpaRepository<AvailabilityPoll, UUID> {
    List<AvailabilityPoll> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
