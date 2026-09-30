package com.mesh.profiles;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CollaborationGoalRepository extends JpaRepository<CollaborationGoal, String> {
    List<CollaborationGoal> findAllByOrderByNameAsc();
}
