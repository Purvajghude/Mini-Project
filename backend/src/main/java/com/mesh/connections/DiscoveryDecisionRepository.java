package com.mesh.connections;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DiscoveryDecisionRepository extends JpaRepository<DiscoveryDecision, DiscoveryDecisionKey> {
    List<DiscoveryDecision> findByActorUserId(UUID actorUserId);
}
