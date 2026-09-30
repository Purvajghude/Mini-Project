package com.mesh.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProjectTaskRepository extends JpaRepository<ProjectTask, UUID> {
    List<ProjectTask> findByProjectIdOrderByStatusAscDueDateAscCreatedAtAsc(UUID projectId);
}
