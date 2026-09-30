package com.mesh.discord;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "discord_oauth_state")
public class DiscordOAuthState {
    @Id @Column(name = "state_hash", length = 64) private String stateHash;
    @Column(name = "mesh_user_id", nullable = false) private UUID meshUserId;
    @Column(name = "code_verifier", nullable = false) private String codeVerifier;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected DiscordOAuthState() { }
    public DiscordOAuthState(String stateHash, UUID meshUserId, String codeVerifier, Instant expiresAt) { this.stateHash = stateHash; this.meshUserId = meshUserId; this.codeVerifier = codeVerifier; this.expiresAt = expiresAt; this.createdAt = Instant.now(); }
    public UUID getMeshUserId() { return meshUserId; }
    public String getCodeVerifier() { return codeVerifier; }
    public Instant getExpiresAt() { return expiresAt; }
}
