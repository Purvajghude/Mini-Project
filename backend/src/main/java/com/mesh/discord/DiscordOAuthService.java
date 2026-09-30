package com.mesh.discord;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mesh.common.ApiException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

/** Links a MESH account to a Discord identity. Access tokens are used once and never persisted. */
@Service
public class DiscordOAuthService {
    private static final String AUTHORIZE_URI = "https://discord.com/oauth2/authorize";
    private static final String TOKEN_URI = "https://discord.com/api/oauth2/token";
    private static final String IDENTITY_URI = "https://discord.com/api/users/@me";
    private static final Duration STATE_TTL = Duration.ofMinutes(10);
    private final DiscordProperties properties;
    private final DiscordOAuthStateRepository states;
    private final DiscordConnectionRepository connections;
    private final RestClient client;
    private final SecureRandom random = new SecureRandom();

    public DiscordOAuthService(DiscordProperties properties, DiscordOAuthStateRepository states, DiscordConnectionRepository connections, RestClient.Builder restClientBuilder) {
        this.properties = properties; this.states = states; this.connections = connections; this.client = restClientBuilder.build();
    }

    @Transactional
    public AuthorizationUrlResponse begin(UUID meshUserId) {
        requireOAuthConfigured();
        states.deleteByExpiresAtBefore(Instant.now());
        String state = randomUrlSafe(32);
        String verifier = randomUrlSafe(64);
        Instant expiresAt = Instant.now().plus(STATE_TTL);
        states.save(new DiscordOAuthState(sha256Hex(state), meshUserId, verifier, expiresAt));
        String authorizationUrl = UriComponentsBuilder.fromUriString(AUTHORIZE_URI)
                .queryParam("client_id", properties.clientId())
                .queryParam("response_type", "code")
                .queryParam("redirect_uri", properties.redirectUri())
                .queryParam("scope", "identify")
                .queryParam("state", state)
                .queryParam("code_challenge", codeChallenge(verifier))
                .queryParam("code_challenge_method", "S256")
                .build().encode().toUriString();
        return new AuthorizationUrlResponse(authorizationUrl, expiresAt);
    }

    @Transactional
    public boolean complete(String code, String rawState, String oauthError) {
        if (!properties.oauthConfigured() || oauthError != null || code == null || code.isBlank() || rawState == null || rawState.isBlank()) return false;
        Optional<DiscordOAuthState> pending = states.findById(sha256Hex(rawState));
        if (pending.isEmpty()) return false;
        DiscordOAuthState state = pending.get();
        states.delete(state);
        if (state.getExpiresAt().isBefore(Instant.now())) return false;
        TokenResponse token = exchangeCode(code, state.getCodeVerifier());
        if (token == null || token.accessToken() == null || token.accessToken().isBlank()) return false;
        IdentityResponse identity = identity(token.accessToken());
        if (identity == null || identity.id() == null || identity.id().isBlank()) return false;
        connections.findByDiscordUserId(identity.id()).filter(existing -> !existing.getMeshUserId().equals(state.getMeshUserId()))
                .ifPresent(existing -> { throw new ApiException(HttpStatus.CONFLICT, "That Discord account is already linked to another MESH account."); });
        DiscordConnection connection = connections.findById(state.getMeshUserId()).orElseGet(() -> new DiscordConnection(state.getMeshUserId(), identity.id(), identity.username(), identity.globalName(), identity.avatar()));
        connection.refresh(identity.username(), identity.globalName(), identity.avatar());
        connections.save(connection);
        return true;
    }

    @Transactional(readOnly = true)
    public ConnectionResponse connection(UUID meshUserId) {
        return connections.findById(meshUserId).map(item -> new ConnectionResponse(true, item.getDiscordUserId(), item.getUsername(), item.getGlobalName(), item.getConnectedAt()))
                .orElseGet(() -> new ConnectionResponse(false, null, null, null, null));
    }

    @Transactional
    public void disconnect(UUID meshUserId) { connections.deleteById(meshUserId); }

    private TokenResponse exchangeCode(String code, String verifier) {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", properties.clientId()); form.add("client_secret", properties.clientSecret()); form.add("grant_type", "authorization_code");
        form.add("code", code); form.add("redirect_uri", properties.redirectUri()); form.add("code_verifier", verifier);
        return client.post().uri(TOKEN_URI).contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE).body(form).retrieve().body(TokenResponse.class);
    }

    private IdentityResponse identity(String accessToken) {
        return client.get().uri(IDENTITY_URI).headers(headers -> headers.setBearerAuth(accessToken)).retrieve().body(IdentityResponse.class);
    }

    private void requireOAuthConfigured() {
        if (!properties.oauthConfigured()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Discord integration is not configured. Add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET first.");
    }
    private String randomUrlSafe(int bytes) { byte[] value = new byte[bytes]; random.nextBytes(value); return Base64.getUrlEncoder().withoutPadding().encodeToString(value); }
    private static String codeChallenge(String verifier) { return Base64.getUrlEncoder().withoutPadding().encodeToString(sha256(verifier)); }
    private static String sha256Hex(String input) { byte[] hash = sha256(input); StringBuilder value = new StringBuilder(64); for (byte item : hash) value.append(String.format("%02x", item)); return value.toString(); }
    private static byte[] sha256(String input) { try { return MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.US_ASCII)); } catch (Exception exception) { throw new IllegalStateException("SHA-256 is unavailable", exception); } }

    public record AuthorizationUrlResponse(String authorizationUrl, Instant expiresAt) { }
    public record ConnectionResponse(boolean connected, String discordUserId, String username, String globalName, Instant connectedAt) { }
    private record TokenResponse(@JsonProperty("access_token") String accessToken) { }
    private record IdentityResponse(String id, String username, @JsonProperty("global_name") String globalName, String avatar) { }
}
