package com.mesh.connections;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConnectionRequestRepository extends JpaRepository<ConnectionRequest, UUID> {
    Optional<ConnectionRequest> findBySenderUserIdAndRecipientUserId(UUID senderUserId, UUID recipientUserId);
    List<ConnectionRequest> findByRecipientUserIdAndStatusOrderByCreatedAtDesc(UUID recipientUserId, ConnectionRequest.Status status);
}
