package com.mesh.profiles;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ProfileDesiredSkillRepository extends JpaRepository<ProfileDesiredSkill, ProfileDesiredSkillKey> {
    @Query("select item from ProfileDesiredSkill item join fetch item.skill where item.profileUserId in :profileUserIds order by item.skill.name")
    List<ProfileDesiredSkill> findForProfiles(Collection<UUID> profileUserIds);
    void deleteByProfileUserId(UUID profileUserId);
}
