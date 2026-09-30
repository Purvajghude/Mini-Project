package com.mesh.discord;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import java.util.UUID;

@RestController
@RequestMapping("/discord")
public class DiscordController {
    private final DiscordOAuthService oauth;
    public DiscordController(DiscordOAuthService oauth) { this.oauth = oauth; }
    @PostMapping("/authorization-url") public DiscordOAuthService.AuthorizationUrlResponse authorizationUrl(@AuthenticationPrincipal UUID userId) { return oauth.begin(userId); }
    @GetMapping("/connection") public DiscordOAuthService.ConnectionResponse connection(@AuthenticationPrincipal UUID userId) { return oauth.connection(userId); }
    @DeleteMapping("/connection") @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.NO_CONTENT)
    public void disconnect(@AuthenticationPrincipal UUID userId) { oauth.disconnect(userId); }
}

@RestController
@RequestMapping("/projects/{projectId}/discord-room")
class ProjectDiscordRoomController {
    private final DiscordRoomService rooms;
    ProjectDiscordRoomController(DiscordRoomService rooms) { this.rooms = rooms; }
    @GetMapping public DiscordRoomService.RoomResponse room(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) { return rooms.room(userId, projectId); }
    @PostMapping public DiscordRoomService.RoomResponse createOrSync(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) { return rooms.createOrSync(userId, projectId); }
}

@Controller
class DiscordCallbackController {
    private final DiscordOAuthService oauth;
    private final DiscordProperties properties;
    DiscordCallbackController(DiscordOAuthService oauth, DiscordProperties properties) { this.oauth = oauth; this.properties = properties; }
    @GetMapping("/discord/callback")
    RedirectView callback(@org.springframework.web.bind.annotation.RequestParam(required = false) String code,
                          @org.springframework.web.bind.annotation.RequestParam(required = false) String state,
                          @org.springframework.web.bind.annotation.RequestParam(required = false, name = "error") String oauthError) {
        try { return new RedirectView(oauth.complete(code, state, oauthError) ? properties.successRedirectUri() : properties.errorRedirectUri()); }
        catch (RuntimeException ignored) { return new RedirectView(properties.errorRedirectUri()); }
    }
}
