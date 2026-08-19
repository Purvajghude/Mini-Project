package com.meshconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class MatchDto {
    private MatchDto() { }

    public record MatchResponse(
            Long id,
            Instant createdAt,
            ProfileDto.PublicProfileResponse collaborator,
            String lastMessage,
            Instant lastMessageAt
    ) { }

    public record MessageResponse(Long id, Long senderId, String content, Instant sentAt, Instant readAt) { }
    public record SendMessageRequest(@NotBlank @Size(max = 2000) String content) { }
    public record MessageListResponse(List<MessageResponse> messages) { }
}
