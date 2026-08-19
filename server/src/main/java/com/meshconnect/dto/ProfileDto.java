package com.meshconnect.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class ProfileDto {
    private ProfileDto() { }

    public record SkillItem(Long id, String name, String category, int proficiency) { }

    public record ProfileResponse(
            Long id,
            String username,
            String email,
            String displayName,
            String department,
            Integer yearOfStudy,
            String bio,
            String availability,
            String avatarKey,
            boolean onboardingComplete,
            List<SkillItem> skills
    ) { }

    public record PublicProfileResponse(
            Long id,
            String username,
            String displayName,
            String department,
            Integer yearOfStudy,
            String bio,
            String availability,
            String avatarKey,
            List<SkillItem> skills
    ) { }

    public record UpdateProfileRequest(
            @NotBlank @Size(max = 80) String displayName,
            @Size(max = 100) String department,
            @Min(1) @Max(6) Integer yearOfStudy,
            @Size(max = 500) String bio,
            @Size(max = 80) String availability,
            @Size(max = 40) String avatarKey,
            boolean onboardingComplete
    ) { }

    public record SkillInput(@NotNull Long skillId, @Min(1) @Max(5) int proficiency) { }
    // @Valid alone skips null elements, so {"skills":[null]} reached the service and
    // threw. @NotNull on the element rejects it as a field error like everything else.
    public record UpdateSkillsRequest(
            @NotEmpty @Size(max = 30) List<@NotNull @Valid SkillInput> skills) { }
    public record SkillCatalogItem(Long id, String name, String category) { }
}
