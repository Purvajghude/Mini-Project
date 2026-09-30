CREATE TABLE user_block (
    blocker_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blocker_user_id, blocked_user_id),
    CONSTRAINT chk_block_distinct_users CHECK (blocker_user_id <> blocked_user_id)
);

CREATE TABLE discovery_decision (
    actor_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    decision VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (actor_user_id, target_user_id),
    CONSTRAINT chk_discovery_distinct_users CHECK (actor_user_id <> target_user_id),
    CONSTRAINT chk_discovery_decision CHECK (decision IN ('PASSED', 'SAVED'))
);

CREATE TABLE connection_request (
    id UUID PRIMARY KEY,
    sender_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    recipient_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMPTZ,
    CONSTRAINT chk_connection_request_distinct_users CHECK (sender_user_id <> recipient_user_id),
    CONSTRAINT chk_connection_request_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
    CONSTRAINT uq_connection_request_direction UNIQUE (sender_user_id, recipient_user_id)
);

CREATE INDEX idx_connection_request_recipient_status ON connection_request (recipient_user_id, status, created_at DESC);

CREATE TABLE collaboration_connection (
    id UUID PRIMARY KEY,
    user_one_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    user_two_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_connection_order CHECK (user_one_id < user_two_id),
    CONSTRAINT uq_connection_pair UNIQUE (user_one_id, user_two_id)
);
