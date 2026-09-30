CREATE TABLE app_user (
    id UUID PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL,
    account_status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_profile (
    user_id UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
    username VARCHAR(40) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    department VARCHAR(120),
    year_of_study SMALLINT,
    bio VARCHAR(500),
    avatar_key VARCHAR(60),
    availability VARCHAR(120),
    primary_domain VARCHAR(80),
    onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_profile_year CHECK (year_of_study IS NULL OR year_of_study BETWEEN 1 AND 8)
);

CREATE TABLE skill (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    category VARCHAR(80) NOT NULL
);

CREATE TABLE profile_skill (
    profile_user_id UUID NOT NULL REFERENCES student_profile(user_id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skill(id),
    self_assessed_proficiency SMALLINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (profile_user_id, skill_id),
    CONSTRAINT chk_self_assessed_proficiency CHECK (self_assessed_proficiency BETWEEN 1 AND 5)
);
