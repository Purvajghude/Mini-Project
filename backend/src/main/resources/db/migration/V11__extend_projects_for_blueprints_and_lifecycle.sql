ALTER TABLE project_group ADD COLUMN lifecycle VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE project_group ADD COLUMN target_team_size SMALLINT NOT NULL DEFAULT 4;
ALTER TABLE project_group ADD CONSTRAINT chk_project_lifecycle CHECK (lifecycle IN ('DRAFT', 'RECRUITING', 'ACTIVE', 'ARCHIVED'));
ALTER TABLE project_group ADD CONSTRAINT chk_project_target_size CHECK (target_team_size BETWEEN 1 AND 8);

CREATE TABLE project_skill_requirement (
    id BIGSERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES project_group(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skill(id),
    minimum_proficiency SMALLINT NOT NULL CHECK (minimum_proficiency BETWEEN 1 AND 5),
    importance VARCHAR(12) NOT NULL CHECK (importance IN ('REQUIRED', 'PREFERRED')),
    note VARCHAR(300),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_requirement_skill UNIQUE (project_id, skill_id)
);
CREATE INDEX idx_project_requirement_project ON project_skill_requirement (project_id, importance);
