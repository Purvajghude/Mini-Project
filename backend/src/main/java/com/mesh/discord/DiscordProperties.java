package com.mesh.discord;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("mesh.discord")
public record DiscordProperties(
        String clientId,
        String clientSecret,
        String redirectUri,
        String successRedirectUri,
        String errorRedirectUri,
        String botToken,
        String guildId,
        String categoryId
) {
    public boolean oauthConfigured() {
        return present(clientId) && present(clientSecret);
    }

    public boolean botConfigured() {
        return present(botToken) && present(guildId);
    }

    private static boolean present(String value) {
        return value != null && !value.isBlank();
    }
}
