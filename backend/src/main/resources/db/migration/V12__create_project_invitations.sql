CREATE TABLE project_invitation (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES project_group(id) ON DELETE CASCADE,
    inviter_user_id UUID NOT NULL REFERENCES student_profile(user_id),
    invitee_user_id UUID NOT NULL REFERENCES student_profile(user_id),
    status VARCHAR(12) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMPTZ,
    CONSTRAINT chk_project_invitation_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
    CONSTRAINT chk_project_invitation_distinct_users CHECK (inviter_user_id <> invitee_user_id)
);

CREATE UNIQUE INDEX uq_project_invitation_pending
    ON project_invitation (project_id, invitee_user_id) WHERE status = 'PENDING';
CREATE INDEX idx_project_invitation_incoming
    ON project_invitation (invitee_user_id, status, created_at DESC);
