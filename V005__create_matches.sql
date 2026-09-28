-- ============================================================
-- TABLE: matches
-- PURPOSE: Stores successful matches between two users
-- RELATIONSHIP: users_profile → matches
-- ============================================================
CREATE TABLE matches (
    match_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_one_id INT NOT NULL,
    user_two_id INT NOT NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_date TIMESTAMP,
    updated_by INT,
    deleted_date TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_match_users CHECK (user_one_id <> user_two_id)
);

Select * from matches;