-- ============================================================
-- TABLE: skills
-- PURPOSE: Stores available skills in the Mesh application
-- ============================================================

CREATE TABLE skills (
    skill_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_date TIMESTAMP,
    updated_by INT,
    deleted_date TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

Select * from skills;