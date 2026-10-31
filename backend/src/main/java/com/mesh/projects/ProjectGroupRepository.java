package com.mesh.projects;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

public interface ProjectGroupRepository extends JpaRepository<ProjectGroup, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select project from ProjectGroup project where project.id = :projectId")
    Optional<ProjectGroup> findByIdForUpdate(UUID projectId);
}
