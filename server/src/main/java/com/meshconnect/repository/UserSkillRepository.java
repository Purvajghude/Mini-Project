package com.meshconnect.repository;

import com.meshconnect.entity.UserSkill;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {
    @EntityGraph(attributePaths = "skill")
    List<UserSkill> findByUserIdOrderBySkillNameAsc(Long userId);

    @EntityGraph(attributePaths = "skill")
    List<UserSkill> findByUserIdIn(Collection<Long> userIds);
    void deleteByUserId(Long userId);
}
