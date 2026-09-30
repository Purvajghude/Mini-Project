package com.mesh.messages;

import com.mesh.common.ApiException;
import com.mesh.profiles.StudentProfile;
import com.mesh.profiles.StudentProfileRepository;
import com.mesh.projects.ProjectAccessService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Collections;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class GroupMessageService {
    private final GroupMessageRepository messages;
    private final StudentProfileRepository profiles;
    private final ProjectAccessService access;
    public GroupMessageService(GroupMessageRepository messages, StudentProfileRepository profiles, ProjectAccessService access) { this.messages = messages; this.profiles = profiles; this.access = access; }
    @Transactional(readOnly = true)
    public List<MessageResponse> list(UUID userId, UUID projectId, int limit) {
        access.requireMember(projectId, userId);
        List<GroupMessage> newestFirst = new ArrayList<>(messages.findByProjectIdOrderByCreatedAtDesc(projectId, PageRequest.of(0, limit)));
        Collections.reverse(newestFirst);
        return newestFirst.stream().map(this::response).toList();
    }
    @Transactional
    public MessageResponse send(UUID userId, UUID projectId, String content) {
        access.requireMember(projectId, userId);
        return response(messages.save(new GroupMessage(projectId, userId, content.trim())));
    }
    private MessageResponse response(GroupMessage message) {
        StudentProfile sender = profiles.findById(message.getSenderUserId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Message sender profile was not found."));
        return new MessageResponse(message.getId(), message.getProjectId(), message.getSenderUserId(), sender.getDisplayName(), message.getContent(), message.getCreatedAt());
    }
    public record MessageResponse(UUID id, UUID projectId, UUID senderId, String senderName, String content, Instant createdAt) { }
}
