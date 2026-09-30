package com.mesh.github;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface GitHubRepositoryEvidenceRepository extends JpaRepository<GitHubRepositoryEvidence, Long> {
    @EntityGraph(attributePaths = "languages")
    List<GitHubRepositoryEvidence> findByMeshUserIdIn(Collection<UUID> meshUserIds);
    void deleteByMeshUserId(UUID meshUserId);
}
