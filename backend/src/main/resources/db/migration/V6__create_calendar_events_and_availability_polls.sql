CREATE TABLE calendar_event (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES project_group(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(2000),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    created_by_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_calendar_event_range CHECK (ends_at > starts_at)
);
CREATE INDEX idx_calendar_event_project_starts ON calendar_event (project_id, starts_at);

CREATE TABLE availability_poll (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES project_group(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    created_by_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL,
    selected_option_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    CONSTRAINT chk_availability_poll_status CHECK (status IN ('OPEN', 'CLOSED', 'SCHEDULED'))
);
CREATE INDEX idx_availability_poll_project_status ON availability_poll (project_id, status, created_at DESC);

CREATE TABLE availability_poll_option (
    id UUID PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES availability_poll(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_availability_poll_option_range CHECK (ends_at > starts_at),
    CONSTRAINT uq_availability_poll_option_time UNIQUE (poll_id, starts_at, ends_at)
);

ALTER TABLE availability_poll ADD CONSTRAINT fk_availability_poll_selected_option FOREIGN KEY (selected_option_id) REFERENCES availability_poll_option(id) ON DELETE RESTRICT;

CREATE TABLE availability_poll_vote (
    poll_option_id UUID NOT NULL REFERENCES availability_poll_option(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (poll_option_id, user_id)
);
