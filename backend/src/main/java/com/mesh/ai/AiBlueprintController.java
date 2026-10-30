package com.mesh.ai;

import com.mesh.projects.BlueprintController;
import com.mesh.projects.ProjectRequirementsService.RequirementResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

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

    public AiBlueprintController(GeminiBlueprintProvider gemini, BlueprintController deterministic) {
        this.gemini = gemini;
        this.deterministic = deterministic;
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
            return new Response("GEMINI", g.title(), g.summary(), body.domain(), body.targetTeamSize() != null ? body.targetTeamSize() : g.targetTeamSize(),
                g.requirements(), g.assumptions(), g.objectives(), g.unmappedSkills(), null);
        } catch (GeminiBlueprintProvider.BlueprintGenerationException e) {
            log.warn("AI blueprint fell back to deterministic template: {}", e.getMessage());
            return new Response(template.source(), template.title(), template.summary(), template.domain(), template.targetTeamSize(),
                template.requirements(), template.assumptions(), List.of(), List.of(), e.getMessage());
        }
    }
}
