package com.mesh.github;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "github_repository_evidence")
public class GitHubRepositoryEvidence {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "mesh_user_id", nullable = false) private UUID meshUserId;
    @Column(name = "github_repository_id", nullable = false) private long githubRepositoryId;
    @Column(name = "full_name", nullable = false) private String fullName;
    @Column(name = "html_url", nullable = false) private String htmlUrl;
    private String description;
    @Column(name = "primary_language") private String primaryLanguage;
    @Column(name = "stargazer_count", nullable = false) private int stargazerCount;
    @Column(name = "fork_count", nullable = false) private int forkCount;
    @Column(name = "pushed_at") private Instant pushedAt;
    @Column(name = "last_synced_at", nullable = false) private Instant lastSyncedAt;
    @OneToMany(mappedBy = "repositoryEvidence", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GitHubRepositoryLanguage> languages = new ArrayList<>();

    protected GitHubRepositoryEvidence() { }
    public GitHubRepositoryEvidence(UUID meshUserId, long githubRepositoryId, String fullName, String htmlUrl, String description,
                                    String primaryLanguage, int stargazerCount, int forkCount, Instant pushedAt) {
        this.meshUserId = meshUserId; this.githubRepositoryId = githubRepositoryId; this.fullName = fullName; this.htmlUrl = htmlUrl;
        this.description = description; this.primaryLanguage = primaryLanguage; this.stargazerCount = stargazerCount;
        this.forkCount = forkCount; this.pushedAt = pushedAt; this.lastSyncedAt = Instant.now();
    }
    public void addLanguage(String language, long byteCount) { languages.add(new GitHubRepositoryLanguage(this, language, byteCount)); }
    public UUID getMeshUserId() { return meshUserId; }
    public String getPrimaryLanguage() { return primaryLanguage; }
    public List<GitHubRepositoryLanguage> getLanguages() { return List.copyOf(languages); }
}
