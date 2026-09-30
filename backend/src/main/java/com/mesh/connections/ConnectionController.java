package com.mesh.connections;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ConnectionController {
    private final ConnectionService connections;
    public ConnectionController(ConnectionService connections) { this.connections = connections; }

    @PutMapping("/discover/{targetUserId}/pass") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void pass(@AuthenticationPrincipal UUID userId, @PathVariable UUID targetUserId) { connections.pass(userId, targetUserId); }
    @PutMapping("/discover/{targetUserId}/save") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@AuthenticationPrincipal UUID userId, @PathVariable UUID targetUserId) { connections.save(userId, targetUserId); }
    @DeleteMapping("/discover/{targetUserId}/save") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsave(@AuthenticationPrincipal UUID userId, @PathVariable UUID targetUserId) { connections.unsave(userId, targetUserId); }
    @PutMapping("/blocks/{targetUserId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void block(@AuthenticationPrincipal UUID userId, @PathVariable UUID targetUserId) { connections.block(userId, targetUserId); }
    @DeleteMapping("/blocks/{targetUserId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unblock(@AuthenticationPrincipal UUID userId, @PathVariable UUID targetUserId) { connections.unblock(userId, targetUserId); }

    @PostMapping("/connection-requests") @ResponseStatus(HttpStatus.CREATED)
    public ConnectionService.ConnectionRequestResponse request(@AuthenticationPrincipal UUID userId, @Valid @RequestBody SendConnectionRequestBody body) { return connections.requestConnection(userId, body.recipientUserId()); }
    @GetMapping("/connection-requests/incoming")
    public List<ConnectionService.ConnectionRequestResponse> incoming(@AuthenticationPrincipal UUID userId) { return connections.incoming(userId); }
    @PatchMapping("/connection-requests/{requestId}/accept")
    public ConnectionService.ConnectionResponse accept(@AuthenticationPrincipal UUID userId, @PathVariable UUID requestId) { return connections.accept(userId, requestId); }
    @PatchMapping("/connection-requests/{requestId}/decline") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void decline(@AuthenticationPrincipal UUID userId, @PathVariable UUID requestId) { connections.decline(userId, requestId); }
    @DeleteMapping("/connection-requests/{requestId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@AuthenticationPrincipal UUID userId, @PathVariable UUID requestId) { connections.cancel(userId, requestId); }
    @GetMapping("/connections")
    public List<ConnectionService.ConnectionResponse> connections(@AuthenticationPrincipal UUID userId) { return connections.connections(userId); }
    public record SendConnectionRequestBody(@NotNull UUID recipientUserId) { }
}
