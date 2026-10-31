package com.mesh.projects;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/projects/{projectId}/requirements")
public class ProjectRequirementsController {
    private final ProjectRequirementsService service;
    public ProjectRequirementsController(ProjectRequirementsService service) { this.service = service; }
    @GetMapping public ProjectRequirementsService.Response get(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) { return service.get(userId, projectId); }
    @PutMapping public ProjectRequirementsService.Response replace(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @Valid @RequestBody Body body) {
        return service.replace(userId, projectId, new ProjectRequirementsService.ReplaceRequest(body.targetTeamSize(), body.lifecycle(), body.requirements().stream().map(r -> new ProjectRequirementsService.RequirementInput(r.skillId(), r.minimumProficiency(), r.importance(), r.note())).toList()));
    }
    public record Body(@Min(1) @Max(8) short targetTeamSize, @NotBlank String lifecycle, @NotNull @Size(max = 30) List<@Valid RequirementBody> requirements) { }
    public record RequirementBody(@NotNull Long skillId, @Min(1) @Max(5) short minimumProficiency, @NotNull ProjectSkillRequirement.Importance importance, @Size(max = 300) String note) { }
}
