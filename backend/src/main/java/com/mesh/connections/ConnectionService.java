package com.mesh.connections;

import com.mesh.common.ApiException;
import com.mesh.profiles.StudentProfile;
import com.mesh.profiles.StudentProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class ConnectionService {
    private final StudentProfileRepository profiles;
    private final DiscoveryDecisionRepository decisions;
    private final UserBlockRepository blocks;
    private final ConnectionRequestRepository requests;
    private final CollaborationConnectionRepository connections;

    public ConnectionService(StudentProfileRepository profiles, DiscoveryDecisionRepository decisions, UserBlockRepository blocks, ConnectionRequestRepository requests, CollaborationConnectionRepository connections) {
        this.profiles = profiles; this.decisions = decisions; this.blocks = blocks; this.requests = requests; this.connections = connections;
    }

    @Transactional
    public void pass(UUID actorId, UUID targetId) { setDecision(actorId, targetId, DiscoveryDecision.Decision.PASSED); }
    @Transactional
    public void save(UUID actorId, UUID targetId) { setDecision(actorId, targetId, DiscoveryDecision.Decision.SAVED); }
    @Transactional
    public void unsave(UUID actorId, UUID targetId) {
        assertDistinctAndProfileExists(actorId, targetId);
        decisions.findById(new DiscoveryDecisionKey(actorId, targetId))
                .filter(decision -> decision.getDecision() == DiscoveryDecision.Decision.SAVED)
                .ifPresent(decisions::delete);
    }
    @Transactional
    public void block(UUID actorId, UUID targetId) {
        assertDistinctAndProfileExists(actorId, targetId);
        blocks.findById(new UserBlockKey(actorId, targetId)).orElseGet(() -> blocks.save(new UserBlock(actorId, targetId)));
    }
    @Transactional
    public void unblock(UUID actorId, UUID targetId) { blocks.deleteById(new UserBlockKey(actorId, targetId)); }

    @Transactional
    public ConnectionRequestResponse requestConnection(UUID senderId, UUID recipientId) {
        assertDistinctAndProfileExists(senderId, recipientId);
        if (isBlockedBetween(senderId, recipientId)) throw new ApiException(HttpStatus.FORBIDDEN, "This student is unavailable for connection requests.");
        if (connectionExists(senderId, recipientId)) throw new ApiException(HttpStatus.CONFLICT, "You are already connected.");
        ConnectionRequest opposite = requests.findBySenderUserIdAndRecipientUserId(recipientId, senderId).orElse(null);
        if (opposite != null && opposite.getStatus() == ConnectionRequest.Status.PENDING) throw new ApiException(HttpStatus.CONFLICT, "This student has already sent you a request. Accept it from your incoming requests.");
        ConnectionRequest request = requests.findBySenderUserIdAndRecipientUserId(senderId, recipientId).orElseGet(() -> new ConnectionRequest(senderId, recipientId));
        if (request.getStatus() == ConnectionRequest.Status.PENDING) throw new ApiException(HttpStatus.CONFLICT, "A connection request is already pending.");
        if (request.getStatus() != ConnectionRequest.Status.PENDING) request.reopen();
        requests.save(request);
        return requestResponse(request);
    }

    @Transactional
    public ConnectionResponse accept(UUID recipientId, UUID requestId) {
        ConnectionRequest request = requireIncomingPendingRequest(recipientId, requestId);
        request.accept();
        CollaborationConnection connection = connections.save(new CollaborationConnection(request.getSenderUserId(), recipientId));
        return connectionResponse(connection, recipientId);
    }
    @Transactional
    public void decline(UUID recipientId, UUID requestId) { requireIncomingPendingRequest(recipientId, requestId).decline(); }
    @Transactional
    public void cancel(UUID senderId, UUID requestId) {
        ConnectionRequest request = requests.findById(requestId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Connection request was not found."));
        if (!request.getSenderUserId().equals(senderId) || request.getStatus() != ConnectionRequest.Status.PENDING) throw new ApiException(HttpStatus.NOT_FOUND, "Pending connection request was not found.");
        request.cancel();
    }

    @Transactional(readOnly = true)
    public List<ConnectionRequestResponse> incoming(UUID recipientId) { return requests.findByRecipientUserIdAndStatusOrderByCreatedAtDesc(recipientId, ConnectionRequest.Status.PENDING).stream().map(this::requestResponse).toList(); }
    @Transactional(readOnly = true)
    public List<ConnectionResponse> connections(UUID userId) {
        Set<UUID> blocked = blockedCounterparts(userId);
        return connections.findByUserOneIdOrUserTwoId(userId, userId).stream()
                .filter(connection -> !blocked.contains(connection.getUserOneId().equals(userId) ? connection.getUserTwoId() : connection.getUserOneId()))
                .map(connection -> connectionResponse(connection, userId)).toList();
    }
    @Transactional(readOnly = true)
    public Set<UUID> recommendationExclusions(UUID userId) {
        Set<UUID> excluded = new HashSet<>();
        decisions.findByActorUserId(userId).stream().filter(decision -> decision.getDecision() == DiscoveryDecision.Decision.PASSED).map(DiscoveryDecision::getTargetUserId).forEach(excluded::add);
        blocks.findByBlockerUserIdOrBlockedUserId(userId, userId).forEach(block -> excluded.add(block.getBlockerUserId().equals(userId) ? block.getBlockedUserId() : block.getBlockerUserId()));
        connections.findByUserOneIdOrUserTwoId(userId, userId).forEach(connection -> excluded.add(connection.getUserOneId().equals(userId) ? connection.getUserTwoId() : connection.getUserOneId()));
        excluded.remove(userId);
        return Set.copyOf(excluded);
    }
    @Transactional(readOnly = true)
    public Set<UUID> savedCandidates(UUID userId) { return decisions.findByActorUserId(userId).stream().filter(decision -> decision.getDecision() == DiscoveryDecision.Decision.SAVED).map(DiscoveryDecision::getTargetUserId).collect(java.util.stream.Collectors.toUnmodifiableSet()); }
    @Transactional(readOnly = true)
    public boolean areConnected(UUID firstUserId, UUID secondUserId) { return connectionExists(firstUserId, secondUserId); }
    @Transactional(readOnly = true)
    public CollaborationConnection requireConnectionMember(UUID userId, UUID connectionId) {
        CollaborationConnection connection = connections.findById(connectionId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Connection was not found."));
        if (!connection.getUserOneId().equals(userId) && !connection.getUserTwoId().equals(userId)) throw new ApiException(HttpStatus.FORBIDDEN, "Only connected students can access this conversation.");
        if (isBlockedBetween(connection.getUserOneId(), connection.getUserTwoId())) throw new ApiException(HttpStatus.FORBIDDEN, "This conversation is unavailable because one student has blocked the other.");
        return connection;
    }

    private void setDecision(UUID actorId, UUID targetId, DiscoveryDecision.Decision decision) {
        assertDistinctAndProfileExists(actorId, targetId);
        DiscoveryDecision record = decisions.findById(new DiscoveryDecisionKey(actorId, targetId)).orElseGet(() -> new DiscoveryDecision(actorId, targetId, decision));
        record.setDecision(decision); decisions.save(record);
    }
    private void assertDistinctAndProfileExists(UUID actorId, UUID targetId) {
        if (actorId.equals(targetId)) throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot perform this action on your own profile.");
        if (!profiles.existsById(targetId)) throw new ApiException(HttpStatus.NOT_FOUND, "Student profile was not found.");
    }
    private boolean isBlockedBetween(UUID first, UUID second) { return blocks.existsByBlockerUserIdAndBlockedUserId(first, second) || blocks.existsByBlockerUserIdAndBlockedUserId(second, first); }
    private Set<UUID> blockedCounterparts(UUID userId) {
        return blocks.findByBlockerUserIdOrBlockedUserId(userId, userId).stream()
                .map(block -> block.getBlockerUserId().equals(userId) ? block.getBlockedUserId() : block.getBlockerUserId())
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }
    private boolean connectionExists(UUID first, UUID second) { return connections.existsByUserOneIdAndUserTwoId(first.compareTo(second) < 0 ? first : second, first.compareTo(second) < 0 ? second : first); }
    private ConnectionRequest requireIncomingPendingRequest(UUID recipientId, UUID requestId) {
        ConnectionRequest request = requests.findById(requestId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pending connection request was not found."));
        if (!request.getRecipientUserId().equals(recipientId) || request.getStatus() != ConnectionRequest.Status.PENDING) throw new ApiException(HttpStatus.NOT_FOUND, "Pending connection request was not found.");
        return request;
    }
    private ConnectionRequestResponse requestResponse(ConnectionRequest request) {
        StudentProfile sender = profiles.findById(request.getSenderUserId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile was not found."));
        return new ConnectionRequestResponse(request.getId(), sender.getUserId(), sender.getUsername(), sender.getDisplayName(), request.getStatus().name(), request.getCreatedAt());
    }
    private ConnectionResponse connectionResponse(CollaborationConnection connection, UUID viewerId) {
        UUID collaboratorId = connection.getUserOneId().equals(viewerId) ? connection.getUserTwoId() : connection.getUserOneId();
        StudentProfile collaborator = profiles.findById(collaboratorId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile was not found."));
        return new ConnectionResponse(connection.getId(), new CollaboratorResponse(collaborator.getUserId(), collaborator.getUsername(), collaborator.getDisplayName(), collaborator.getDepartment(), collaborator.getYearOfStudy(), collaborator.getBio(), collaborator.getAvatarKey()), connection.getCreatedAt());
    }

    public record ConnectionRequestResponse(UUID id, UUID senderId, String senderUsername, String senderName, String status, Instant createdAt) { }
    public record ConnectionResponse(UUID id, CollaboratorResponse collaborator, Instant createdAt) { }
    public record CollaboratorResponse(UUID id, String username, String displayName, String department, Short yearOfStudy, String bio, String avatarKey) { }
}
