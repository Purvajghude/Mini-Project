package com.meshconnect.repository;

import com.meshconnect.entity.Match;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchRepository extends JpaRepository<Match, Long> {
    @EntityGraph(attributePaths = {"userOne", "userTwo"})
    Optional<Match> findByUserOneIdAndUserTwoId(Long userOneId, Long userTwoId);

    @EntityGraph(attributePaths = {"userOne", "userTwo"})
    List<Match> findByUserOneIdOrUserTwoIdOrderByCreatedAtDesc(Long userOneId, Long userTwoId);
}
