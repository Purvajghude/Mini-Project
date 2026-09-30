package com.mesh.projects;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/projects")
public class ProjectController {
    private final ProjectService projects;
    public ProjectController(ProjectService projects) { this.projects = projects; }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ProjectService.ProjectResponse create(@AuthenticationPrincipal UUID userId, @Valid @RequestBody ProjectBody body) { return projects.create(userId, new ProjectService.CreateProjectRequest(body.name(), body.summary(), body.domain())); }
    @GetMapping public List<ProjectService.ProjectResponse> list(@AuthenticationPrincipal UUID userId) { return projects.list(userId); }
    @GetMapping("/{projectId}") public ProjectService.ProjectResponse get(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) { return projects.get(userId, projectId); }
    @PutMapping("/{projectId}") public ProjectService.ProjectResponse update(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @Valid @RequestBody ProjectBody body) { return projects.update(userId, projectId, new ProjectService.UpdateProjectRequest(body.name(), body.summary(), body.domain())); }
    @DeleteMapping("/{projectId}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) { projects.delete(userId, projectId); }
    @PostMapping("/{projectId}/members") public ProjectService.ProjectResponse addMember(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @Valid @RequestBody AddMemberBody body) { return projects.addMember(userId, projectId, body.userId()); }
    @DeleteMapping("/{projectId}/members/{userId}") @ResponseStatus(HttpStatus.NO_CONTENT) public void removeMember(@AuthenticationPrincipal UUID ownerId, @PathVariable UUID projectId, @PathVariable UUID userId) { projects.removeMember(ownerId, projectId, userId); }
    @PatchMapping("/{projectId}/ownership") public ProjectService.ProjectResponse transferOwnership(@AuthenticationPrincipal UUID ownerId, @PathVariable UUID projectId, @Valid @RequestBody TransferOwnershipBody body) { return projects.transferOwnership(ownerId, projectId, body.newOwnerUserId()); }

    public record ProjectBody(@NotBlank @Size(max = 120) String name, @Size(max = 1000) String summary, @Size(max = 80) String domain) { }
    public record AddMemberBody(@NotNull UUID userId) { }
    public record TransferOwnershipBody(@NotNull UUID newOwnerUserId) { }
}
