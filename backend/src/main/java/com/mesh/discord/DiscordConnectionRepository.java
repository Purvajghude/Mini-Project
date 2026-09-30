package com.mesh.discord;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface DiscordConnectionRepository extends JpaRepository<DiscordConnection, UUID> {
    Optional<DiscordConnection> findByDiscordUserId(String discordUserId);
}
