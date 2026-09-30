package com.mesh.profiles;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ProfileGoalRepository extends JpaRepository<ProfileGoal, ProfileGoalKey> {
    @Query("select item from ProfileGoal item join fetch item.goal where item.profileUserId in :profileUserIds order by item.goal.name")
    List<ProfileGoal> findForProfiles(Collection<UUID> profileUserIds);
    void deleteByProfileUserId(UUID profileUserId);
}
