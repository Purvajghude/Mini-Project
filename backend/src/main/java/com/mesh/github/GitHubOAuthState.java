package com.mesh.github;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "github_oauth_state")
public class GitHubOAuthState {
    @Id @Column(name = "state_hash", length = 64) private String stateHash;
    @Column(name = "mesh_user_id", nullable = false) private UUID meshUserId;
    @Column(name = "code_verifier", nullable = false) private String codeVerifier;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    protected GitHubOAuthState() { }
    public GitHubOAuthState(String stateHash, UUID meshUserId, String codeVerifier, Instant expiresAt) {
        this.stateHash = stateHash; this.meshUserId = meshUserId; this.codeVerifier = codeVerifier;
        this.expiresAt = expiresAt; this.createdAt = Instant.now();
    }
    public String getStateHash() { return stateHash; }
    public UUID getMeshUserId() { return meshUserId; }
    public String getCodeVerifier() { return codeVerifier; }
    public Instant getExpiresAt() { return expiresAt; }
}
