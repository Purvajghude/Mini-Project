package com.mesh.github;

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
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class GitHubOAuthService {
    private static final String AUTHORIZE_URI = "https://github.com/login/oauth/authorize";
    private static final String TOKEN_URI = "https://github.com/login/oauth/access_token";
    private static final Duration STATE_TTL = Duration.ofMinutes(10);
    private final GitHubProperties properties;
    private final GitHubOAuthStateRepository states;
    private final GitHubConnectionRepository connections;
    private final GitHubRepositoryEvidenceRepository evidence;
    private final RestClient githubApi;
    private final RestClient githubOauth;
    private final SecureRandom random = new SecureRandom();

    public GitHubOAuthService(GitHubProperties properties, GitHubOAuthStateRepository states, GitHubConnectionRepository connections,
                              GitHubRepositoryEvidenceRepository evidence, RestClient.Builder restClientBuilder) {
        this.properties = properties; this.states = states; this.connections = connections; this.evidence = evidence;
        this.githubApi = restClientBuilder.baseUrl("https://api.github.com")
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .defaultHeader(HttpHeaders.USER_AGENT, "mesh-student-collaboration-api")
                .build();
        this.githubOauth = restClientBuilder.baseUrl("https://github.com").build();
    }

    @Transactional
    public AuthorizationUrlResponse begin(UUID meshUserId) {
        requireConfigured();
        states.deleteByExpiresAtBefore(Instant.now());
        String state = randomUrlSafe(32);
        String verifier = randomUrlSafe(64);
        Instant expiresAt = Instant.now().plus(STATE_TTL);
        states.save(new GitHubOAuthState(sha256Hex(state), meshUserId, verifier, expiresAt));
        String url = UriComponentsBuilder.fromUriString(AUTHORIZE_URI)
                .queryParam("client_id", properties.clientId())
                .queryParam("redirect_uri", properties.redirectUri())
                .queryParam("state", state)
                .queryParam("code_challenge", codeChallenge(verifier))
                .queryParam("code_challenge_method", "S256")
                .build().encode().toUriString();
        return new AuthorizationUrlResponse(url, expiresAt);
    }

    @Transactional
    public CallbackOutcome complete(String code, String rawState, String githubError) {
        if (!properties.configured() || githubError != null || code == null || code.isBlank() || rawState == null || rawState.isBlank()) return CallbackOutcome.failure();
        Optional<GitHubOAuthState> pending = states.findById(sha256Hex(rawState));
        if (pending.isEmpty()) return CallbackOutcome.failure();
        GitHubOAuthState state = pending.get();
        states.delete(state);
        if (state.getExpiresAt().isBefore(Instant.now())) return CallbackOutcome.failure();
        TokenPayload token = exchangeCode(code, state.getCodeVerifier());
        if (token == null || token.accessToken() == null || token.accessToken().isBlank()) return CallbackOutcome.failure();
        synchronizePublicEvidence(state.getMeshUserId(), token.accessToken());
        return CallbackOutcome.success();
    }

    @Transactional(readOnly = true)
    public ConnectionResponse connection(UUID meshUserId) {
        return connections.findById(meshUserId).map(item -> new ConnectionResponse(true, item.getGithubLogin(), item.getAvatarUrl(), item.getPublicRepositoryCount(), item.getAuthorizedAt(), item.getLastSyncedAt()))
                .orElseGet(() -> new ConnectionResponse(false, null, null, 0, null, null));
    }

    @Transactional
    public void disconnect(UUID meshUserId) {
        evidence.deleteByMeshUserId(meshUserId);
        connections.deleteById(meshUserId);
    }

    private void synchronizePublicEvidence(UUID meshUserId, String accessToken) {
        GithubUserPayload identity = authenticatedUser(accessToken);
        connections.findByGithubUserId(identity.id()).filter(existing -> !existing.getMeshUserId().equals(meshUserId))
                .ifPresent(existing -> { throw new ApiException(HttpStatus.CONFLICT, "That GitHub account is already connected to another MESH account."); });
        List<GithubRepositoryPayload> repositories = publicOwnedRepositories(accessToken);
        evidence.deleteByMeshUserId(meshUserId);
        for (GithubRepositoryPayload repository : repositories) {
            GitHubRepositoryEvidence item = new GitHubRepositoryEvidence(meshUserId, repository.id(), repository.fullName(), repository.htmlUrl(), repository.description(), repository.language(), repository.stargazersCount(), repository.forksCount(), repository.pushedAt());
            repositoryLanguages(accessToken, repository.fullName()).forEach(item::addLanguage);
            evidence.save(item);
        }
        GitHubConnection connection = connections.findById(meshUserId).orElseGet(() -> new GitHubConnection(meshUserId, identity.id(), identity.login(), identity.avatarUrl(), repositories.size()));
        connection.refresh(identity.id(), identity.login(), identity.avatarUrl(), repositories.size());
        connections.save(connection);
    }

    private TokenPayload exchangeCode(String code, String verifier) {
        LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", properties.clientId()); form.add("client_secret", properties.clientSecret()); form.add("code", code);
        form.add("redirect_uri", properties.redirectUri()); form.add("code_verifier", verifier);
        return githubOauth.post().uri(TOKEN_URI).contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE).body(form).retrieve().body(TokenPayload.class);
    }

    private GithubUserPayload authenticatedUser(String accessToken) {
        return githubApi.get().uri("/user").headers(headers -> headers.setBearerAuth(accessToken)).retrieve().body(GithubUserPayload.class);
    }

    private List<GithubRepositoryPayload> publicOwnedRepositories(String accessToken) {
        GithubRepositoryPayload[] result = githubApi.get().uri(builder -> builder.path("/user/repos")
                .queryParam("visibility", "public").queryParam("affiliation", "owner").queryParam("sort", "updated")
                .queryParam("per_page", properties.safeMaxRepositories()).build())
                .headers(headers -> headers.setBearerAuth(accessToken)).retrieve().body(GithubRepositoryPayload[].class);
        return Arrays.stream(result == null ? new GithubRepositoryPayload[0] : result).filter(repository -> !repository.privateRepository()).toList();
    }

    private Map<String, Long> repositoryLanguages(String accessToken, String fullName) {
        @SuppressWarnings("unchecked")
        Map<String, Integer> result = githubApi.get().uri("/repos/{fullName}/languages", fullName)
                .headers(headers -> headers.setBearerAuth(accessToken)).retrieve().body(Map.class);
        if (result == null) return Map.of();
        Map<String, Long> values = new LinkedHashMap<>();
        result.forEach((language, bytes) -> values.put(language, bytes == null ? 0L : bytes.longValue()));
        return values;
    }

    private void requireConfigured() {
        if (!properties.configured()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "GitHub integration is not configured. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET first.");
    }
    private String randomUrlSafe(int bytes) { byte[] value = new byte[bytes]; random.nextBytes(value); return Base64.getUrlEncoder().withoutPadding().encodeToString(value); }
    static String codeChallenge(String verifier) { return Base64.getUrlEncoder().withoutPadding().encodeToString(sha256(verifier)); }
    private static String sha256Hex(String input) { byte[] hash = sha256(input); StringBuilder value = new StringBuilder(64); for (byte item : hash) value.append(String.format("%02x", item)); return value.toString(); }
    private static byte[] sha256(String input) { try { return MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.US_ASCII)); } catch (NoSuchAlgorithmException exception) { throw new IllegalStateException("SHA-256 is unavailable", exception); } }

    public record AuthorizationUrlResponse(String authorizationUrl, Instant expiresAt) { }
    public record ConnectionResponse(boolean connected, String login, String avatarUrl, int publicRepositoryCount, Instant authorizedAt, Instant lastSyncedAt) { }
    public record CallbackOutcome(boolean successful) { static CallbackOutcome success() { return new CallbackOutcome(true); } static CallbackOutcome failure() { return new CallbackOutcome(false); } }
    private record TokenPayload(@JsonProperty("access_token") String accessToken) { }
    private record GithubUserPayload(long id, String login, @JsonProperty("avatar_url") String avatarUrl) { }
    private record GithubRepositoryPayload(long id, @JsonProperty("full_name") String fullName, @JsonProperty("html_url") String htmlUrl,
                                           String description, String language, @JsonProperty("stargazers_count") int stargazersCount,
                                           @JsonProperty("forks_count") int forksCount, @JsonProperty("pushed_at") Instant pushedAt,
                                           @JsonProperty("private") boolean privateRepository) { }
}
