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
@RequestMapping("/projects/{projectId}/messages")
public class GroupMessageController {
    private final GroupMessageService messages;
    public GroupMessageController(GroupMessageService messages) { this.messages = messages; }
    @GetMapping public List<GroupMessageService.MessageResponse> list(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit) { return messages.list(userId, projectId, limit); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public GroupMessageService.MessageResponse send(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @Valid @RequestBody SendMessageBody body) { return messages.send(userId, projectId, body.content()); }
    public record SendMessageBody(@NotBlank @Size(max = 2000) String content) { }
}
