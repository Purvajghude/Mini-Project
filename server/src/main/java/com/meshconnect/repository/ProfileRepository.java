package com.meshconnect.repository;

import com.meshconnect.entity.Profile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    @EntityGraph(attributePaths = "user")
    Optional<Profile> findByUserId(Long userId);

    @EntityGraph(attributePaths = "user")
    List<Profile> findByUserActiveTrueAndUserIdNot(Long userId);
}
