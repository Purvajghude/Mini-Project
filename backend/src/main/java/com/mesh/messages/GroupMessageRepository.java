package com.mesh.messages;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface GroupMessageRepository extends JpaRepository<GroupMessage, UUID> {
    List<GroupMessage> findByProjectIdOrderByCreatedAtDesc(UUID projectId, Pageable pageable);
}
