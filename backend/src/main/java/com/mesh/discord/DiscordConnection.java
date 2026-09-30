package com.mesh.discord;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "discord_connection")
public class DiscordConnection {
    @Id @Column(name = "mesh_user_id") private UUID meshUserId;
    @Column(name = "discord_user_id", nullable = false, unique = true) private String discordUserId;
    @Column(nullable = false) private String username;
    @Column(name = "global_name") private String globalName;
    @Column(name = "avatar_hash") private String avatarHash;
    @Column(name = "connected_at", nullable = false) private Instant connectedAt;

    protected DiscordConnection() { }
    public DiscordConnection(UUID meshUserId, String discordUserId, String username, String globalName, String avatarHash) {
        this.meshUserId = meshUserId; this.discordUserId = discordUserId; this.username = username;
        this.globalName = globalName; this.avatarHash = avatarHash; this.connectedAt = Instant.now();
    }
    public void refresh(String username, String globalName, String avatarHash) { this.username = username; this.globalName = globalName; this.avatarHash = avatarHash; this.connectedAt = Instant.now(); }
    public UUID getMeshUserId() { return meshUserId; }
    public String getDiscordUserId() { return discordUserId; }
    public String getUsername() { return username; }
    public String getGlobalName() { return globalName; }
    public Instant getConnectedAt() { return connectedAt; }
}
