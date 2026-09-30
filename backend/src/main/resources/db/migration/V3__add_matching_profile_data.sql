ALTER TABLE student_profile ADD COLUMN availability_timezone VARCHAR(64);

CREATE TABLE collaboration_goal (
    code VARCHAR(40) PRIMARY KEY,
    name VARCHAR(80) NOT NULL
);

CREATE TABLE interest (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE profile_goal (
    profile_user_id UUID NOT NULL REFERENCES student_profile(user_id) ON DELETE CASCADE,
    goal_code VARCHAR(40) NOT NULL REFERENCES collaboration_goal(code),
    PRIMARY KEY (profile_user_id, goal_code)
);

CREATE TABLE profile_interest (
    profile_user_id UUID NOT NULL REFERENCES student_profile(user_id) ON DELETE CASCADE,
    interest_id BIGINT NOT NULL REFERENCES interest(id),
    PRIMARY KEY (profile_user_id, interest_id)
);

CREATE TABLE profile_desired_skill (
    profile_user_id UUID NOT NULL REFERENCES student_profile(user_id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skill(id),
    PRIMARY KEY (profile_user_id, skill_id)
);

CREATE TABLE availability_window (
    id BIGSERIAL PRIMARY KEY,
    profile_user_id UUID NOT NULL REFERENCES student_profile(user_id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL,
    start_minute SMALLINT NOT NULL,
    end_minute SMALLINT NOT NULL,
    CONSTRAINT chk_availability_day CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT chk_availability_start CHECK (start_minute BETWEEN 0 AND 1439),
    CONSTRAINT chk_availability_end CHECK (end_minute BETWEEN 1 AND 1440),
    CONSTRAINT chk_availability_range CHECK (start_minute < end_minute),
    CONSTRAINT uq_availability_window UNIQUE (profile_user_id, day_of_week, start_minute, end_minute)
);

INSERT INTO collaboration_goal (code, name) VALUES
    ('HACKATHON', 'Hackathon project'),
    ('COURSE_PROJECT', 'Course project'),
    ('OPEN_SOURCE', 'Open source'),
    ('PORTFOLIO', 'Portfolio project'),
    ('STARTUP', 'Startup idea'),
    ('RESEARCH', 'Research project'),
    ('LEARNING', 'Learn together')
ON CONFLICT (code) DO NOTHING;

INSERT INTO interest (name) VALUES
    ('Accessibility'), ('Climate'), ('Design systems'), ('Developer tools'),
    ('Education'), ('Fintech'), ('Gaming'), ('Health'), ('Open source'),
    ('Social impact'), ('Sports'), ('Student life')
ON CONFLICT (name) DO NOTHING;
