package com.mesh.profiles;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, UUID> {
    Optional<StudentProfile> findByUsername(String username);
    boolean existsByUsername(String username);
    List<StudentProfile> findByOnboardingCompleteTrueAndUserIdNot(UUID userId);
    @Query("select p from StudentProfile p join p.user u where p.onboardingComplete = true and u.accountStatus = 'ACTIVE' and u.role = 'STUDENT' and lower(u.email) not like '%@mesh.local'")
    List<StudentProfile> findEligibleProjectCandidates();
    @Query("select p from StudentProfile p join p.user u where p.userId = :userId and p.onboardingComplete = true and u.accountStatus = 'ACTIVE' and u.role = 'STUDENT' and lower(u.email) not like '%@mesh.local'")
    Optional<StudentProfile> findEligibleProjectCandidateById(UUID userId);
}
