package com.mesh.projects;

import com.mesh.skills.Skill;
import com.mesh.skills.SkillRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/project-blueprints/suggestions")
public class BlueprintController {
    private final SkillRepository skills;
    public BlueprintController(SkillRepository skills) { this.skills = skills; }
    @PostMapping public BlueprintSuggestion suggest(@Valid @RequestBody Request body) {
        String idea = body.idea().trim();
        String words = (idea + " " + Objects.toString(body.domain(), "")).toLowerCase(Locale.ROOT);
        List<String> proposed = new ArrayList<>();
        if (words.matches(".*(mobile|android|ios|app).*")) proposed.addAll(List.of("React", "TypeScript", "Java"));
        else if (words.matches(".*(data|machine learning|ai|prediction).*")) proposed.addAll(List.of("Python", "Data Analysis", "PostgreSQL"));
        else if (words.matches(".*(design|ux|interface).*")) proposed.addAll(List.of("Figma", "Product Research", "React"));
        else proposed.addAll(List.of("React", "Spring Boot", "PostgreSQL"));
        proposed.add("Git");
        Map<Long, Skill> catalog = skills.findAllByOrderByNameAsc().stream().collect(Collectors.toMap(Skill::getId, s -> s));
        Map<String, Skill> byName = catalog.values().stream().collect(Collectors.toMap(Skill::getName, s -> s));
        if (body.skillIds() != null) for (Long id : body.skillIds()) {
            Skill skill = catalog.get(id);
            if (skill == null) throw new com.mesh.common.ApiException(org.springframework.http.HttpStatus.BAD_REQUEST, "One or more skills do not exist.");
            proposed.add(skill.getName());
        }
        List<ProjectRequirementsService.RequirementResponse> requirements = proposed.stream().distinct().filter(byName::containsKey).map(name -> {
            Skill skill = byName.get(name);
            return new ProjectRequirementsService.RequirementResponse(skill.getId(), skill.getName(), (short) 3, name.equals("Git") ? ProjectSkillRequirement.Importance.PREFERRED : ProjectSkillRequirement.Importance.REQUIRED, null);
        }).toList();
        return new BlueprintSuggestion("DETERMINISTIC_TEMPLATE", idea.length() > 120 ? idea.substring(0, 120) : idea, idea.length() > 1000 ? idea.substring(0, 1000) : idea, body.domain(), body.targetTeamSize() == null ? (short) 4 : body.targetTeamSize(), requirements, List.of("Suggested skills and proficiency are editable estimates based on the idea text."));
    }
    public record Request(@NotBlank @Size(max = 2000) String idea, @Size(max = 80) String domain, @Size(max = 30) List<@NotNull Long> skillIds, @Min(1) @Max(8) Short targetTeamSize) { }
    public record BlueprintSuggestion(String source, String title, String summary, String domain, short targetTeamSize, List<ProjectRequirementsService.RequirementResponse> requirements, List<String> assumptions) { }
}
