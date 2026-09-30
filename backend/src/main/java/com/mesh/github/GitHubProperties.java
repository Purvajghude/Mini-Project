package com.mesh.github;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("mesh.github")
public record GitHubProperties(
        String clientId,
        String clientSecret,
        String redirectUri,
        String successRedirectUri,
        String errorRedirectUri,
        int maxRepositories
) {
    public boolean configured() {
        return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
    }

    public int safeMaxRepositories() {
        return Math.max(1, Math.min(100, maxRepositories));
    }
}
