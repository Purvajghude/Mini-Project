package com.meshconnect.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class TeamDto {
    private TeamDto() { }

    /**
     * @param skillIds what the project needs, chosen from the skill catalogue
     * @param size     how many teammates to suggest, excluding the requester
     */
    public record SuggestTeamRequest(
            @NotEmpty(message = "Choose at least one skill the project needs")
            List<@NotNull Long> skillIds,
            @Min(1) @Max(5) int size
    ) { }

    /**
     * @param covers       the requested skills this person is the chosen provider of
     * @param contribution how much of the outstanding requirement they closed, 0-100
     */
    public record TeamMember(
            Long userId,
            String username,
            String displayName,
            String department,
            Integer yearOfStudy,
            String avatarKey,
            String availability,
            List<String> covers,
            double contribution
    ) { }

    /**
     * @param youAlreadyCover requested skills the requester is already strong in
     * @param stillMissing    requested skills nobody available can cover
     */
    public record TeamSuggestion(
            List<TeamMember> members,
            List<String> youAlreadyCover,
            List<String> stillMissing,
            double coveragePercent,
            int requestedSkillCount
    ) { }
}
