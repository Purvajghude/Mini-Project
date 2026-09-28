-- ============================================================
-- TABLE: profile_skill
-- PURPOSE: Maps users with their selected skills
-- RELATIONSHIP: users_profile ↔ skills
-- ============================================================

CREATE TABLE profile_skill (
    profile_skill_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_date TIMESTAMP,
    updated_by INT,
    deleted_date TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT unique_user_skill UNIQUE (user_id, skill_id)
);

Select * from profile_skill;