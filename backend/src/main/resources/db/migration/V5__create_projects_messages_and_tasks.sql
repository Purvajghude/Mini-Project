CREATE TABLE project_group (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    summary VARCHAR(1000),
    domain VARCHAR(80),
    owner_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_member (
    project_id UUID NOT NULL REFERENCES project_group(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id),
    CONSTRAINT chk_project_member_role CHECK (role IN ('OWNER', 'MEMBER'))
);

CREATE INDEX idx_project_member_user ON project_member (user_id, joined_at DESC);

CREATE TABLE group_message (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES project_group(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    content VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_group_message_project_created ON group_message (project_id, created_at DESC);

CREATE TABLE project_task (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES project_group(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(2000),
    status VARCHAR(20) NOT NULL,
    assignee_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    due_date DATE,
    created_by_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_project_task_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE'))
);

CREATE INDEX idx_project_task_project_status ON project_task (project_id, status, due_date);
