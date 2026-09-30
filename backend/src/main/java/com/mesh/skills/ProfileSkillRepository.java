package com.mesh.skills;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ProfileSkillRepository extends JpaRepository<ProfileSkill, ProfileSkillKey> {
    @Query("select ps from ProfileSkill ps join fetch ps.skill where ps.profileUserId = :profileUserId order by ps.skill.name")
    List<ProfileSkill> findForProfile(UUID profileUserId);
    @Query("select ps from ProfileSkill ps join fetch ps.skill where ps.profileUserId in :profileUserIds order by ps.skill.name")
    List<ProfileSkill> findForProfiles(Collection<UUID> profileUserIds);
    void deleteByProfileUserId(UUID profileUserId);
}
