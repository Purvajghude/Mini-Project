package com.mesh.github;

import jakarta.persistence.*;

@Entity
@Table(name = "github_repository_language")
public class GitHubRepositoryLanguage {
    @EmbeddedId private GitHubRepositoryLanguageKey id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @MapsId("repositoryEvidenceId")
    @JoinColumn(name = "repository_evidence_id") private GitHubRepositoryEvidence repositoryEvidence;
    @Column(name = "byte_count", nullable = false) private long byteCount;

    protected GitHubRepositoryLanguage() { }
    GitHubRepositoryLanguage(GitHubRepositoryEvidence repositoryEvidence, String language, long byteCount) {
        this.repositoryEvidence = repositoryEvidence; this.id = new GitHubRepositoryLanguageKey(language); this.byteCount = byteCount;
    }
    public String getLanguage() { return id.getLanguage(); }
    public long getByteCount() { return byteCount; }
}
