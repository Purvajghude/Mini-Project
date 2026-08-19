package com.meshconnect.dto;

import com.meshconnect.entity.ReportTargetType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class SafetyDto {
    private SafetyDto() { }
    public record CreateReportRequest(@NotNull ReportTargetType targetType, @NotNull Long targetId, @Size(max = 500) String reason) { }
    public record ReportResponse(Long id, Long reporterId, String reporterName, String targetType, Long targetId, String reason, String status, Instant createdAt) { }
}
