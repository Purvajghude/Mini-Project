package com.mesh.skills;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Long> {
    List<Skill> findAllByOrderByNameAsc();
    Optional<Skill> findFirstByNameIgnoreCase(String name);

    /** The catalogue is open: any real skill can be added. Names are unique case-insensitively (V13). */
    // ponytail: two simultaneous creates of one new name lose to the unique index; the loser just retries.
    default Skill findOrCreate(String name, String category) {
        return findFirstByNameIgnoreCase(name).orElseGet(() -> save(new Skill(name, category)));
    }
}
