package com.mesh.profiles;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface AvailabilityWindowRepository extends JpaRepository<AvailabilityWindow, Long> {
    List<AvailabilityWindow> findByProfileUserIdInOrderByDayOfWeekAscStartMinuteAsc(Collection<UUID> profileUserIds);
    void deleteByProfileUserId(UUID profileUserId);
}
