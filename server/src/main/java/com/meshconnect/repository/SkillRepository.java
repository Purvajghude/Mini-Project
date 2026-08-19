package com.meshconnect.repository;

import com.meshconnect.entity.Skill;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findByNameIgnoreCase(String name);
    List<Skill> findByIdIn(Collection<Long> ids);
    List<Skill> findAllByOrderByCategoryAscNameAsc();
}
