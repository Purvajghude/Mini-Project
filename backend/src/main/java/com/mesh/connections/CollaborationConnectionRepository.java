package com.mesh.connections;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CollaborationConnectionRepository extends JpaRepository<CollaborationConnection, UUID> {
    List<CollaborationConnection> findByUserOneIdOrUserTwoId(UUID userOneId, UUID userTwoId);
    boolean existsByUserOneIdAndUserTwoId(UUID userOneId, UUID userTwoId);
}
