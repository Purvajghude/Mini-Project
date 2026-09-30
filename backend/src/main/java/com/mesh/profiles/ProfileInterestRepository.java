package com.mesh.profiles;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ProfileInterestRepository extends JpaRepository<ProfileInterest, ProfileInterestKey> {
    @Query("select item from ProfileInterest item join fetch item.interest where item.profileUserId in :profileUserIds order by item.interest.name")
    List<ProfileInterest> findForProfiles(Collection<UUID> profileUserIds);
    void deleteByProfileUserId(UUID profileUserId);
}
