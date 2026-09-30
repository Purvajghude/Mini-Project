package com.mesh.profiles;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, UUID> {
    Optional<StudentProfile> findByUsername(String username);
    boolean existsByUsername(String username);
    List<StudentProfile> findByOnboardingCompleteTrueAndUserIdNot(UUID userId);
}
