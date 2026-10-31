package com.mesh.projects;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ProjectInvitationController {
    private final ProjectInvitationService service;
    public ProjectInvitationController(ProjectInvitationService service) { this.service = service; }

    @PostMapping("/projects/{projectId}/invitations") @ResponseStatus(HttpStatus.CREATED)
    public ProjectInvitationService.InvitationResponse send(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId,
                                                            @Valid @RequestBody SendBody body) {
        return service.send(userId, projectId, body.inviteeUserId());
    }
    @GetMapping("/projects/{projectId}/invitations")
    public List<ProjectInvitationService.InvitationResponse> projectInvitations(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) {
        return service.projectInvitations(userId, projectId);
    }
    @GetMapping("/project-invitations/incoming")
    public List<ProjectInvitationService.InvitationResponse> incoming(@AuthenticationPrincipal UUID userId) { return service.incoming(userId); }
    @PatchMapping("/project-invitations/{invitationId}/accept")
    public ProjectInvitationService.InvitationResponse accept(@AuthenticationPrincipal UUID userId, @PathVariable UUID invitationId) {
        return service.accept(userId, invitationId);
    }
    @PatchMapping("/project-invitations/{invitationId}/decline")
    public ProjectInvitationService.InvitationResponse decline(@AuthenticationPrincipal UUID userId, @PathVariable UUID invitationId) {
        return service.decline(userId, invitationId);
    }
    @DeleteMapping("/projects/{projectId}/invitations/{invitationId}")
    public ProjectInvitationService.InvitationResponse cancel(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId,
                                                              @PathVariable UUID invitationId) { return service.cancel(userId, projectId, invitationId); }
    public record SendBody(@NotNull UUID inviteeUserId) { }
}
