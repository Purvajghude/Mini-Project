package com.mesh.projects;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberKey> {
    List<ProjectMember> findByProjectId(UUID projectId);
    List<ProjectMember> findByUserIdOrderByJoinedAtDesc(UUID userId);
    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);
}
