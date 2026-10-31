package com.mesh.ai;

import com.mesh.projects.BlueprintController;
import com.mesh.projects.ProjectRequirementsService.RequirementResponse;
import com.mesh.skills.Skill;
import com.mesh.skills.SkillController;
import com.mesh.skills.SkillRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Gemini-backed blueprint suggestions. Same request as POST /project-blueprints/suggestions and a
 * superset of its response. Falls back to the deterministic template on any Gemini failure and says so
 * in {@code source} and {@code fallbackReason}; it never labels template output as AI output. Nothing is persisted.
 */
@RestController
@RequestMapping("/project-blueprints/ai-suggestions")
public class AiBlueprintController {
    private static final Logger log = LoggerFactory.getLogger(AiBlueprintController.class);
    private final GeminiBlueprintProvider gemini;
    private final BlueprintController deterministic;
    private final SkillRepository skills;

    public AiBlueprintController(GeminiBlueprintProvider gemini, BlueprintController deterministic, SkillRepository skills) {
        this.gemini = gemini;
        this.deterministic = deterministic;
        this.skills = skills;
    }

    public record Response(String source, String title, String summary, String domain, short targetTeamSize,
                           List<RequirementResponse> requirements, List<String> assumptions, List<String> objectives,
                           List<GeminiBlueprintProvider.Unmapped> unmappedSkills, String fallbackReason) { }

    @PostMapping
    public Response suggest(@Valid @RequestBody BlueprintController.Request body) {
        // Validation errors on the request itself (e.g. unknown skillIds) surface as 400 from the template path.
        BlueprintController.BlueprintSuggestion template = deterministic.suggest(body);
        try {
            GeminiBlueprintProvider.Generated g = gemini.generate(body.idea().trim(), body.domain(), body.targetTeamSize());
            // The catalogue is open: skills Gemini names that MESH lacks are added, so people can claim and match on them.
            List<RequirementResponse> requirements = new ArrayList<>(g.requirements());
            List<GeminiBlueprintProvider.Unmapped> unmapped = new ArrayList<>();
            for (GeminiBlueprintProvider.Unmapped u : g.unmappedSkills()) {
                String name = SkillController.clean(u.name());
                if (!SkillController.NAME.matcher(name).matches()) { unmapped.add(u); continue; }
                Skill skill = skills.findOrCreate(name, u.category() == null || u.category().isBlank() ? "Other" : u.category());
                if (requirements.stream().noneMatch(r -> r.skillId().equals(skill.getId())))
                    requirements.add(new RequirementResponse(skill.getId(), skill.getName(), u.minimumProficiency(), u.importance(), u.reason()));
            }
            return new Response("GEMINI", g.title(), g.summary(), body.domain(), body.targetTeamSize() != null ? body.targetTeamSize() : g.targetTeamSize(),
                requirements, g.assumptions(), g.objectives(), unmapped, null);
        } catch (GeminiBlueprintProvider.BlueprintGenerationException e) {
            log.warn("AI blueprint fell back to deterministic template: {}", e.getMessage());
            return new Response(template.source(), template.title(), template.summary(), template.domain(), template.targetTeamSize(),
                template.requirements(), template.assumptions(), List.of(), List.of(), e.getMessage());
        }
    }
}
