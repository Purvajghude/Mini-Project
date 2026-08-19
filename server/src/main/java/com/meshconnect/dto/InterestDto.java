package com.meshconnect.dto;

import java.time.Instant;

public final class InterestDto {
    private InterestDto() { }

    public record InterestResponse(
            Long id,
            Long senderId,
            String senderName,
            Long receiverId,
            String receiverName,
            String status,
            Instant createdAt,
            Long matchId
    ) { }
}
