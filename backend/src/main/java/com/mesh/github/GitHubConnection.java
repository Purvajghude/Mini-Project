package com.mesh.github;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "github_connection")
public class GitHubConnection {
    @Id @Column(name = "mesh_user_id") private UUID meshUserId;
    @Column(name = "github_user_id", nullable = false, unique = true) private long githubUserId;
    @Column(name = "github_login", nullable = false) private String githubLogin;
    @Column(name = "avatar_url") private String avatarUrl;
    @Column(nullable = false) private String status;
    @Column(name = "authorized_at", nullable = false) private Instant authorizedAt;
    @Column(name = "last_synced_at", nullable = false) private Instant lastSyncedAt;
    @Column(name = "public_repository_count", nullable = false) private int publicRepositoryCount;

    protected GitHubConnection() { }
    public GitHubConnection(UUID meshUserId, long githubUserId, String githubLogin, String avatarUrl, int publicRepositoryCount) {
        this.meshUserId = meshUserId; this.githubUserId = githubUserId; this.githubLogin = githubLogin;
        this.avatarUrl = avatarUrl; this.publicRepositoryCount = publicRepositoryCount; this.status = "CONNECTED";
        this.authorizedAt = Instant.now(); this.lastSyncedAt = this.authorizedAt;
    }
    public void refresh(long githubUserId, String githubLogin, String avatarUrl, int publicRepositoryCount) {
        this.githubUserId = githubUserId; this.githubLogin = githubLogin; this.avatarUrl = avatarUrl;
        this.publicRepositoryCount = publicRepositoryCount; this.status = "CONNECTED"; this.lastSyncedAt = Instant.now();
    }
    public UUID getMeshUserId() { return meshUserId; }
    public long getGithubUserId() { return githubUserId; }
    public String getGithubLogin() { return githubLogin; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getStatus() { return status; }
    public Instant getAuthorizedAt() { return authorizedAt; }
    public Instant getLastSyncedAt() { return lastSyncedAt; }
    public int getPublicRepositoryCount() { return publicRepositoryCount; }
}
