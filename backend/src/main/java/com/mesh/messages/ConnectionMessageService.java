package com.mesh.messages;

import com.mesh.common.ApiException;
import com.mesh.connections.ConnectionService;
import com.mesh.profiles.StudentProfile;
import com.mesh.profiles.StudentProfileRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class ConnectionMessageService {
    private final ConnectionMessageRepository messages;
    private final ConnectionService connections;
    private final StudentProfileRepository profiles;
    public ConnectionMessageService(ConnectionMessageRepository messages, ConnectionService connections, StudentProfileRepository profiles) { this.messages = messages; this.connections = connections; this.profiles = profiles; }
    @Transactional(readOnly = true)
    public List<MessageResponse> list(UUID userId, UUID connectionId, int limit) {
        connections.requireConnectionMember(userId, connectionId);
        List<ConnectionMessage> newestFirst = new ArrayList<>(messages.findByConnectionIdOrderByCreatedAtDesc(connectionId, PageRequest.of(0, limit)));
        Collections.reverse(newestFirst);
        return newestFirst.stream().map(this::response).toList();
    }
    @Transactional
    public MessageResponse send(UUID userId, UUID connectionId, String content) {
        connections.requireConnectionMember(userId, connectionId);
        return response(messages.save(new ConnectionMessage(connectionId, userId, content.trim())));
    }
    private MessageResponse response(ConnectionMessage message) {
        StudentProfile sender = profiles.findById(message.getSenderUserId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Message sender profile was not found."));
        return new MessageResponse(message.getId(), message.getConnectionId(), message.getSenderUserId(), sender.getDisplayName(), message.getContent(), message.getCreatedAt());
    }
    public record MessageResponse(UUID id, UUID connectionId, UUID senderId, String senderName, String content, Instant createdAt) { }
}
