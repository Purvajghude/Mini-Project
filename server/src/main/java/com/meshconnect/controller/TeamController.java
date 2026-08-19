package com.meshconnect.controller;

import com.meshconnect.dto.TeamDto;
import com.meshconnect.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/teams")
@Tag(name = "Teams", description = "Assembling a team that covers what a project needs")
public class TeamController {
    private final TeamService teams;
    public TeamController(TeamService teams) { this.teams = teams; }

    @PostMapping("/suggest")
    @Operation(
            summary = "Suggest the smallest team that covers a project's skills",
            description = "Greedy set-cover over the cohort: repeatedly picks whoever closes the most of "
                    + "the remaining requirement, breaking ties on depth. Skills the caller already has at "
                    + "level 3 or above are excluded from the requirement before the search starts.")
    public TeamDto.TeamSuggestion suggest(@Valid @RequestBody TeamDto.SuggestTeamRequest request) {
        return teams.suggest(request);
    }
}
