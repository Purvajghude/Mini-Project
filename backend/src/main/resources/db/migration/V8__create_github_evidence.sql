CREATE TABLE github_connection (
    mesh_user_id UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
    github_user_id BIGINT NOT NULL UNIQUE,
    github_login VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(2048),
    status VARCHAR(20) NOT NULL,
    authorized_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    public_repository_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_github_connection_status CHECK (status IN ('CONNECTED', 'REVOKED'))
);

CREATE TABLE github_oauth_state (
    state_hash VARCHAR(64) PRIMARY KEY,
    mesh_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    code_verifier VARCHAR(128) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_github_oauth_state_expiry ON github_oauth_state (expires_at);

CREATE TABLE github_repository_evidence (
    id BIGSERIAL PRIMARY KEY,
    mesh_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    github_repository_id BIGINT NOT NULL,
    full_name VARCHAR(512) NOT NULL,
    html_url VARCHAR(2048) NOT NULL,
    description VARCHAR(1000),
    primary_language VARCHAR(100),
    stargazer_count INTEGER NOT NULL DEFAULT 0,
    fork_count INTEGER NOT NULL DEFAULT 0,
    pushed_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_github_evidence_repository UNIQUE (mesh_user_id, github_repository_id)
);
CREATE INDEX idx_github_evidence_user ON github_repository_evidence (mesh_user_id);

CREATE TABLE github_repository_language (
    repository_evidence_id BIGINT NOT NULL REFERENCES github_repository_evidence(id) ON DELETE CASCADE,
    language VARCHAR(100) NOT NULL,
    byte_count BIGINT NOT NULL,
    PRIMARY KEY (repository_evidence_id, language)
);
