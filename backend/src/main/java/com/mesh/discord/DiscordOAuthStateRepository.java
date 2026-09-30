package com.mesh.discord;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;

public interface DiscordOAuthStateRepository extends JpaRepository<DiscordOAuthState, String> {
    long deleteByExpiresAtBefore(Instant instant);
}
