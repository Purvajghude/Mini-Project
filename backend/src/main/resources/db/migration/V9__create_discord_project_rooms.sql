CREATE TABLE discord_connection (
    mesh_user_id UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
    discord_user_id VARCHAR(32) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL,
    global_name VARCHAR(255),
    avatar_hash VARCHAR(255),
    connected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discord_oauth_state (
    state_hash VARCHAR(64) PRIMARY KEY,
    mesh_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    code_verifier VARCHAR(128) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_discord_oauth_state_expiry ON discord_oauth_state (expires_at);

CREATE TABLE project_discord_room (
    project_id UUID PRIMARY KEY REFERENCES project_group(id) ON DELETE CASCADE,
    discord_channel_id VARCHAR(32) NOT NULL UNIQUE,
    invite_url VARCHAR(512),
    created_by_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
