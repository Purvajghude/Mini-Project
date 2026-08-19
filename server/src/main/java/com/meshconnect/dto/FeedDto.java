package com.meshconnect.dto;

import com.meshconnect.entity.PostKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class FeedDto {
    private FeedDto() { }

    public record CreatePostRequest(
            @NotNull PostKind kind,
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 4000) String body,
            @Size(max = 80) String category,
            @Size(max = 500) String tags
    ) { }

    public record AuthorSummary(Long id, String username, String displayName, String avatarKey) { }
    public record PostResponse(
            Long id,
            AuthorSummary author,
            String kind,
            String title,
            String body,
            String category,
            List<String> tags,
            String status,
            Long solvedCommentId,
            long commentCount,
            Instant createdAt
    ) { }

    public record CommentResponse(Long id, AuthorSummary author, String body, Instant createdAt, boolean solution) { }
    public record CreateCommentRequest(@NotBlank @Size(max = 2000) String body) { }
    public record FeedPage(List<PostResponse> items, int page, int size, long totalItems, int totalPages) { }
}
