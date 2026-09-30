package com.mesh.profiles;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/profile/me")
public class ProfileController {
    private final ProfileService profiles;
    public ProfileController(ProfileService profiles) { this.profiles = profiles; }
    @GetMapping public ProfileService.ProfileResponse get(@AuthenticationPrincipal UUID userId) { return profiles.get(userId); }
    @PutMapping public ProfileService.ProfileResponse update(@AuthenticationPrincipal UUID userId, @Valid @RequestBody UpdateBody body) {
        return profiles.update(userId, new ProfileService.UpdateProfileRequest(body.displayName(), body.department(), body.yearOfStudy(), body.bio(), body.avatarKey(), body.availability(), body.primaryDomain(), body.onboardingComplete()));
    }
    @PutMapping("/skills") public ProfileService.ProfileResponse replaceSkills(@AuthenticationPrincipal UUID userId, @Valid @RequestBody ReplaceSkillsBody body) {
        return profiles.replaceSkills(userId, new ProfileService.ReplaceSkillsRequest(body.skills().stream().map(item -> new ProfileService.SkillSelection(item.skillId(), item.proficiency())).toList()));
    }
    @PutMapping("/goals") public ProfileService.ProfileResponse replaceGoals(@AuthenticationPrincipal UUID userId, @Valid @RequestBody ReplaceGoalsBody body) {
        return profiles.replaceGoals(userId, new ProfileService.ReplaceGoalsRequest(body.goalCodes()));
    }
    @PutMapping("/interests") public ProfileService.ProfileResponse replaceInterests(@AuthenticationPrincipal UUID userId, @Valid @RequestBody ReplaceInterestsBody body) {
        return profiles.replaceInterests(userId, new ProfileService.ReplaceInterestsRequest(body.interestIds()));
    }
    @PutMapping("/desired-skills") public ProfileService.ProfileResponse replaceDesiredSkills(@AuthenticationPrincipal UUID userId, @Valid @RequestBody ReplaceDesiredSkillsBody body) {
        return profiles.replaceDesiredSkills(userId, new ProfileService.ReplaceDesiredSkillsRequest(body.skillIds()));
    }
    @PutMapping("/availability") public ProfileService.ProfileResponse replaceAvailability(@AuthenticationPrincipal UUID userId, @Valid @RequestBody ReplaceAvailabilityBody body) {
        return profiles.replaceAvailability(userId, new ProfileService.ReplaceAvailabilityRequest(body.timezone(), body.windows().stream().map(window -> new ProfileService.AvailabilityWindowRequest(window.dayOfWeek(), window.startMinute(), window.endMinute())).toList()));
    }
    public record UpdateBody(@NotBlank @Size(max = 100) String displayName, @Size(max = 120) String department, @Min(1) @Max(8) Short yearOfStudy, @Size(max = 500) String bio, @Size(max = 60) String avatarKey, @Size(max = 120) String availability, @Size(max = 80) String primaryDomain, boolean onboardingComplete) { }
    public record ReplaceSkillsBody(@NotNull @Size(max = 50) List<@Valid SkillBody> skills) { }
    public record SkillBody(@NotNull Long skillId, @Min(1) @Max(5) short proficiency) { }
    public record ReplaceGoalsBody(@NotNull @Size(max = 7) List<@NotBlank @Pattern(regexp = "[A-Z_]+") String> goalCodes) { }
    public record ReplaceInterestsBody(@NotNull @Size(max = 12) List<@NotNull Long> interestIds) { }
    public record ReplaceDesiredSkillsBody(@NotNull @Size(max = 12) List<@NotNull Long> skillIds) { }
    public record ReplaceAvailabilityBody(@NotBlank @Size(max = 64) String timezone, @NotNull @Size(max = 28) List<@Valid AvailabilityWindowBody> windows) { }
    public record AvailabilityWindowBody(@Min(1) @Max(7) short dayOfWeek, @Min(0) @Max(1439) short startMinute, @Min(1) @Max(1440) short endMinute) { }
}
