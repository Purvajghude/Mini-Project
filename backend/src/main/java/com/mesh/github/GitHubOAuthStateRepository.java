package com.mesh.github;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;

public interface GitHubOAuthStateRepository extends JpaRepository<GitHubOAuthState, String> {
    long deleteByExpiresAtBefore(Instant instant);
}
