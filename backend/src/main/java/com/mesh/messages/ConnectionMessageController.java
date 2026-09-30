package com.mesh.messages;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@Validated
@RequestMapping("/connections/{connectionId}/messages")
public class ConnectionMessageController {
    private final ConnectionMessageService messages;
    public ConnectionMessageController(ConnectionMessageService messages) { this.messages = messages; }
    @GetMapping public List<ConnectionMessageService.MessageResponse> list(@AuthenticationPrincipal UUID userId, @PathVariable UUID connectionId, @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit) { return messages.list(userId, connectionId, limit); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ConnectionMessageService.MessageResponse send(@AuthenticationPrincipal UUID userId, @PathVariable UUID connectionId, @Valid @RequestBody SendMessageBody body) { return messages.send(userId, connectionId, body.content()); }
    public record SendMessageBody(@NotBlank @Size(max = 2000) String content) { }
}
