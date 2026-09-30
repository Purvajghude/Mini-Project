package com.mesh.messages;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ConnectionMessageRepository extends JpaRepository<ConnectionMessage, UUID> {
    List<ConnectionMessage> findByConnectionIdOrderByCreatedAtDesc(UUID connectionId, Pageable pageable);
}
