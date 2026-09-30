package com.mesh.discord;

import com.mesh.common.ApiException;
import com.mesh.projects.ProjectAccessService;
import com.mesh.projects.ProjectGroup;
import com.mesh.projects.ProjectMemberRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Creates Discord text rooms through the Discord HTTP API. No gateway process is required. */
@Service
public class DiscordRoomService {
    private static final String API = "https://discord.com/api/v10";
    private static final String MEMBER_ALLOW = "68608"; // VIEW_CHANNEL + SEND_MESSAGES + READ_MESSAGE_HISTORY
    private final DiscordProperties properties;
    private final ProjectAccessService projectAccess;
    private final ProjectMemberRepository members;
    private final DiscordConnectionRepository identities;
    private final ProjectDiscordRoomRepository rooms;
    private final RestClient discord;

    public DiscordRoomService(DiscordProperties properties, ProjectAccessService projectAccess, ProjectMemberRepository members, DiscordConnectionRepository identities, ProjectDiscordRoomRepository rooms, RestClient.Builder restClientBuilder) {
        this.properties = properties; this.projectAccess = projectAccess; this.members = members; this.identities = identities; this.rooms = rooms;
        this.discord = restClientBuilder.baseUrl(API).defaultHeader(HttpHeaders.AUTHORIZATION, "Bot " + (properties.botToken() == null ? "" : properties.botToken())).build();
    }

    @Transactional(readOnly = true)
    public RoomResponse room(UUID userId, UUID projectId) {
        projectAccess.requireMember(projectId, userId);
        return rooms.findById(projectId).map(this::response).orElseGet(() -> RoomResponse.unavailable());
    }

    @Transactional
    public RoomResponse createOrSync(UUID ownerId, UUID projectId) {
        requireBotConfigured();
        projectAccess.requireOwner(projectId, ownerId);
        ProjectGroup project = projectAccess.requireProject(projectId);
        List<String> discordIds = memberDiscordIds(projectId);
        ProjectDiscordRoom room = rooms.findById(projectId).orElseGet(() -> createRoom(project, ownerId, discordIds));
        synchronizePermissions(room.getDiscordChannelId(), discordIds);
        String invite = createInvite(room.getDiscordChannelId());
        room.refresh(invite);
        rooms.save(room);
        return response(room);
    }

    private ProjectDiscordRoom createRoom(ProjectGroup project, UUID ownerId, List<String> discordIds) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("name", channelName(project.getName()));
        payload.put("type", 0);
        if (properties.categoryId() != null && !properties.categoryId().isBlank()) payload.put("parent_id", properties.categoryId());
        payload.put("topic", "MESH project room · " + project.getName());
        payload.put("permission_overwrites", permissionOverwrites(discordIds));
        @SuppressWarnings("unchecked") Map<String, Object> result = discord.post().uri("/guilds/{guildId}/channels", properties.guildId()).body(payload).retrieve().body(Map.class);
        String channelId = stringValue(result, "id");
        if (channelId == null) throw new ApiException(HttpStatus.BAD_GATEWAY, "Discord did not return a project channel.");
        String invite = createInvite(channelId);
        sendWelcome(channelId, project.getName());
        return new ProjectDiscordRoom(project.getId(), channelId, invite, ownerId);
    }

    private void synchronizePermissions(String channelId, List<String> discordIds) {
        for (String discordId : discordIds) {
            Map<String, Object> overwrite = Map.of("id", discordId, "type", 1, "allow", MEMBER_ALLOW, "deny", "0");
            discord.put().uri("/channels/{channelId}/permissions/{discordId}", channelId, discordId).body(overwrite).retrieve().toBodilessEntity();
        }
    }

    private String createInvite(String channelId) {
        Map<String, Object> payload = Map.of("max_age", 604800, "max_uses", 0, "temporary", false, "unique", false);
        @SuppressWarnings("unchecked") Map<String, Object> result = discord.post().uri("/channels/{channelId}/invites", channelId).body(payload).retrieve().body(Map.class);
        String code = stringValue(result, "code");
        return code == null ? null : "https://discord.gg/" + code;
    }

    private void sendWelcome(String channelId, String projectName) {
        discord.post().uri("/channels/{channelId}/messages", channelId).body(Map.of("content", "Welcome to **" + projectName + "**. This room was created by MESH; keep project decisions and useful links here.")).retrieve().toBodilessEntity();
    }

    private List<String> memberDiscordIds(UUID projectId) {
        List<String> missing = new ArrayList<>();
        List<String> identitiesForMembers = new ArrayList<>();
        members.findByProjectId(projectId).forEach(member -> identities.findById(member.getUserId()).ifPresentOrElse(connection -> identitiesForMembers.add(connection.getDiscordUserId()), () -> missing.add(member.getUserId().toString())));
        if (!missing.isEmpty()) throw new ApiException(HttpStatus.CONFLICT, "Every project member must link Discord before a private room can be created.");
        return identitiesForMembers;
    }

    private List<Map<String, Object>> permissionOverwrites(List<String> discordIds) {
        List<Map<String, Object>> values = new ArrayList<>();
        values.add(Map.of("id", properties.guildId(), "type", 0, "allow", "0", "deny", MEMBER_ALLOW));
        discordIds.forEach(discordId -> values.add(Map.of("id", discordId, "type", 1, "allow", MEMBER_ALLOW, "deny", "0")));
        return values;
    }

    private RoomResponse response(ProjectDiscordRoom room) { return new RoomResponse(true, room.getDiscordChannelId(), room.getInviteUrl(), room.getLastSyncedAt()); }
    private void requireBotConfigured() { if (!properties.botConfigured()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Discord rooms are not configured. Add DISCORD_BOT_TOKEN and DISCORD_GUILD_ID first."); }
    private static String channelName(String name) { String value = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", ""); return ("mesh-" + (value.isBlank() ? "project" : value)).substring(0, Math.min(100, 5 + (value.isBlank() ? 7 : value.length()))); }
    private static String stringValue(Map<String, Object> source, String key) { Object value = source == null ? null : source.get(key); return value == null ? null : String.valueOf(value); }
    public record RoomResponse(boolean available, String channelId, String inviteUrl, Instant lastSyncedAt) { static RoomResponse unavailable() { return new RoomResponse(false, null, null, null); } }
}
