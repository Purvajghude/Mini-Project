CREATE TABLE connection_message (
    id UUID PRIMARY KEY,
    connection_id UUID NOT NULL REFERENCES collaboration_connection(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    content VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_connection_message_connection_created ON connection_message (connection_id, created_at DESC);
