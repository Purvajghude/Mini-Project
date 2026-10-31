package com.mesh.projects;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/projects/{projectId}/team-suggestions")
public class TeamSuggestionController {
    private final TeamSuggestionService service;
    public TeamSuggestionController(TeamSuggestionService service) { this.service = service; }

    @PostMapping
    public TeamSuggestionService.SuggestionSet suggest(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId,
                                                       @Valid @RequestBody Body body) {
        return service.suggest(userId, projectId, new TeamSuggestionService.Request(
            body.alternativeCount() == null ? 3 : body.alternativeCount(),
            body.excludeCandidateIds() == null ? Set.of() : body.excludeCandidateIds(),
            body.availabilityPolicy() == null ? TeamSuggestionService.AvailabilityPolicy.ALLOW_UNKNOWN : body.availabilityPolicy()));
    }
    public record Body(@Min(1) @Max(3) Integer alternativeCount, @Size(max = 80) Set<UUID> excludeCandidateIds,
                       TeamSuggestionService.AvailabilityPolicy availabilityPolicy) { }
}
