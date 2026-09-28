-- ============================================================
-- TABLE: users_profile
-- PURPOSE: Stores user profile and basic account information
-- ============================================================

CREATE TABLE users_profile (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile_no VARCHAR(15) NOT NULL UNIQUE,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_date TIMESTAMP,
    updated_by INT,
    deleted_date TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

Select * from users_profile;