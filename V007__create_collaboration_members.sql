-- ============================================================
-- TABLE: collaboration_members
-- PURPOSE: Maps users to collaborations/projects
-- RELATIONSHIP: users_profile ↔ collaborations
-- ============================================================

CREATE TABLE collaboration_members (
    collab_member_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    collab_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50),
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_date TIMESTAMP,
    updated_by INT,
    deleted_date TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT unique_collab_user UNIQUE (collab_id, user_id)
);

Select * from collaboration_members;