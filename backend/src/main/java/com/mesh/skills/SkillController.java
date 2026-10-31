package com.mesh.skills;

import com.mesh.common.ApiException;
import com.mesh.profiles.ProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/skills")
public class SkillController {
    public static final Pattern NAME = Pattern.compile("[\\p{L}\\p{N}][\\p{L}\\p{N} +#&./()'-]{0,59}");
    private final ProfileService profiles;
    private final SkillRepository skills;
    public SkillController(ProfileService profiles, SkillRepository skills) { this.profiles = profiles; this.skills = skills; }

    @GetMapping public List<ProfileService.SkillResponse> catalog() { return profiles.catalog(); }

    public record CreateRequest(String name, String category) { }

    /** Adds a skill the catalogue doesn't have yet, or returns the existing one with that name. */
    @PostMapping public ProfileService.SkillResponse create(@RequestBody CreateRequest body) {
        String name = clean(body.name());
        if (!NAME.matcher(name).matches()) throw new ApiException(HttpStatus.BAD_REQUEST, "Use 1-60 letters, numbers or spaces for the skill name.");
        String category = clean(body.category());
        Skill skill = skills.findOrCreate(name, category.isEmpty() || category.length() > 40 ? "Other" : category);
        return new ProfileService.SkillResponse(skill.getId(), skill.getName(), skill.getCategory());
    }

    public static String clean(String s) { return s == null ? "" : s.trim().replaceAll("\\s+", " "); }
}
