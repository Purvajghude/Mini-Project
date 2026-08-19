package com.meshconnect.repository;

import com.meshconnect.entity.Message;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {
    @EntityGraph(attributePaths = "sender")
    List<Message> findByMatchIdOrderBySentAtAsc(Long matchId);

    /**
     * Conversation previews on the match list. Loading only the newest row keeps the
     * list endpoint from pulling every message of every conversation into memory.
     */
    Optional<Message> findFirstByMatchIdOrderBySentAtDesc(Long matchId);
}
