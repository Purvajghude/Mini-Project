package com.mesh.github;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.UUID;

@RestController
@RequestMapping("/github")
public class GitHubController {
    private final GitHubOAuthService github;
    public GitHubController(GitHubOAuthService github) { this.github = github; }

    @PostMapping("/authorization-url")
    public GitHubOAuthService.AuthorizationUrlResponse authorizationUrl(@AuthenticationPrincipal UUID userId) { return github.begin(userId); }
    @GetMapping("/connection")
    public GitHubOAuthService.ConnectionResponse connection(@AuthenticationPrincipal UUID userId) { return github.connection(userId); }
    @DeleteMapping("/connection") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disconnect(@AuthenticationPrincipal UUID userId) { github.disconnect(userId); }
}

@Controller
class GitHubCallbackController {
    private final GitHubOAuthService github;
    private final GitHubProperties properties;
    GitHubCallbackController(GitHubOAuthService github, GitHubProperties properties) { this.github = github; this.properties = properties; }

    @GetMapping("/github/callback")
    RedirectView callback(@RequestParam(required = false) String code, @RequestParam(required = false) String state,
                          @RequestParam(required = false, name = "error") String githubError) {
        try {
            return new RedirectView(github.complete(code, state, githubError).successful() ? properties.successRedirectUri() : properties.errorRedirectUri());
        } catch (RuntimeException exception) {
            return new RedirectView(properties.errorRedirectUri());
        }
    }
}
