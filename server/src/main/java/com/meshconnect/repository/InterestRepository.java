package com.meshconnect.repository;

import com.meshconnect.entity.Interest;
import com.meshconnect.entity.InterestStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterestRepository extends JpaRepository<Interest, Long> {
    @EntityGraph(attributePaths = {"sender", "receiver"})
    Optional<Interest> findBySenderIdAndReceiverId(Long senderId, Long receiverId);
    @EntityGraph(attributePaths = {"sender", "receiver"})
    List<Interest> findByReceiverIdAndStatusOrderByCreatedAtDesc(Long receiverId, InterestStatus status);

    @EntityGraph(attributePaths = {"sender", "receiver"})
    List<Interest> findBySenderIdAndStatusOrderByCreatedAtDesc(Long senderId, InterestStatus status);
    boolean existsBySenderIdAndReceiverId(Long senderId, Long receiverId);
}
