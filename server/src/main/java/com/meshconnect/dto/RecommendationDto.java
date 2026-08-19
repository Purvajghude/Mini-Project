package com.meshconnect.dto;

import java.util.List;

public final class RecommendationDto {
    private RecommendationDto() { }

    /**
     * The four components behind {@code score}, each 0-100. Exposed so the interface can
     * show a student why someone was suggested instead of asking them to trust a number.
     */
    public record ScoreBreakdown(double gapFill, double sharedGround, double depth, double categoryReach) { }

    public record RecommendationResponse(
            Long userId,
            String username,
            String displayName,
            String department,
            Integer yearOfStudy,
            String bio,
            String availability,
            String avatarKey,
            double score,
            List<String> complementarySkills,
            List<String> sharedSkills,
            String reason,
            ScoreBreakdown breakdown,
            List<ProfileDto.SkillItem> skills
    ) { }
}
