package com.mesh.skills;

import com.mesh.profiles.ProfileService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/skills")
public class SkillController {
    private final ProfileService profiles;
    public SkillController(ProfileService profiles) { this.profiles = profiles; }
    @GetMapping public List<ProfileService.SkillResponse> catalog() { return profiles.catalog(); }
}
