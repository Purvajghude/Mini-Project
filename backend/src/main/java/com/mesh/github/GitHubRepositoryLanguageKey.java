package com.mesh.github;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class GitHubRepositoryLanguageKey implements Serializable {
    @Column(name = "repository_evidence_id") private Long repositoryEvidenceId;
    @Column(nullable = false) private String language;
    protected GitHubRepositoryLanguageKey() { }
    GitHubRepositoryLanguageKey(String language) { this.language = language; }
    public String getLanguage() { return language; }
    @Override public boolean equals(Object other) { return this == other || other instanceof GitHubRepositoryLanguageKey key && Objects.equals(repositoryEvidenceId, key.repositoryEvidenceId) && Objects.equals(language, key.language); }
    @Override public int hashCode() { return Objects.hash(repositoryEvidenceId, language); }
}
