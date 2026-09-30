package com.mesh.connections;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface UserBlockRepository extends JpaRepository<UserBlock, UserBlockKey> {
    List<UserBlock> findByBlockerUserIdOrBlockedUserId(UUID blockerUserId, UUID blockedUserId);
    boolean existsByBlockerUserIdAndBlockedUserId(UUID blockerUserId, UUID blockedUserId);
}
