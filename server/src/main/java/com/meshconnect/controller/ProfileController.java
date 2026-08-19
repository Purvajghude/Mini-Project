package com.meshconnect.controller;

import com.meshconnect.dto.ProfileDto;
import com.meshconnect.service.ProfileService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ProfileController {
    private final ProfileService profiles;
    public ProfileController(ProfileService profiles) { this.profiles = profiles; }

    @GetMapping("/profile/me")
    public ProfileDto.ProfileResponse me() { return profiles.getMine(); }

    @PutMapping("/profile/me")
    public ProfileDto.ProfileResponse updateMe(@Valid @RequestBody ProfileDto.UpdateProfileRequest request) { return profiles.updateMine(request); }

    @PutMapping("/profile/me/skills")
    public ProfileDto.ProfileResponse updateSkills(@Valid @RequestBody ProfileDto.UpdateSkillsRequest request) { return profiles.replaceMySkills(request); }

    @GetMapping("/profiles/{userId}")
    public ProfileDto.PublicProfileResponse publicProfile(@PathVariable Long userId) { return profiles.publicProfile(userId); }

    @GetMapping("/skills")
    public List<ProfileDto.SkillCatalogItem> skills() { return profiles.skillCatalog(); }
}
