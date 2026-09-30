package com.mesh.discord;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_discord_room")
public class ProjectDiscordRoom {
    @Id @Column(name = "project_id") private UUID projectId;
    @Column(name = "discord_channel_id", nullable = false, unique = true) private String discordChannelId;
    @Column(name = "invite_url") private String inviteUrl;
    @Column(name = "created_by_user_id", nullable = false) private UUID createdByUserId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "last_synced_at", nullable = false) private Instant lastSyncedAt;
    protected ProjectDiscordRoom() { }
    public ProjectDiscordRoom(UUID projectId, String discordChannelId, String inviteUrl, UUID createdByUserId) { this.projectId = projectId; this.discordChannelId = discordChannelId; this.inviteUrl = inviteUrl; this.createdByUserId = createdByUserId; this.createdAt = Instant.now(); this.lastSyncedAt = createdAt; }
    public void refresh(String inviteUrl) { this.inviteUrl = inviteUrl; this.lastSyncedAt = Instant.now(); }
    public UUID getProjectId() { return projectId; }
    public String getDiscordChannelId() { return discordChannelId; }
    public String getInviteUrl() { return inviteUrl; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastSyncedAt() { return lastSyncedAt; }
}
