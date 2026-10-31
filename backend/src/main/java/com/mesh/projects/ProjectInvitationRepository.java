package com.mesh.projects;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select invitation from ProjectInvitation invitation where invitation.id = :id")
    Optional<ProjectInvitation> findByIdForUpdate(UUID id);
    boolean existsByProjectIdAndInviteeUserIdAndStatus(UUID projectId, UUID inviteeUserId, ProjectInvitation.Status status);
    long countByProjectIdAndStatus(UUID projectId, ProjectInvitation.Status status);
    List<ProjectInvitation> findByInviteeUserIdAndStatusOrderByCreatedAtDesc(UUID inviteeUserId, ProjectInvitation.Status status);
    List<ProjectInvitation> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
