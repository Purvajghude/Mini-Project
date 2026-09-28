-- ============================================================
-- TABLE: collaborations
-- PURPOSE: Stores collaboration/project information
-- ============================================================

CREATE TABLE collaborations (
    collab_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_date TIMESTAMP,
    updated_by INT,
    deleted_date TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

Select * from collaborations;