-- Demo-only student records make the live discovery feed useful before classmates join.
-- These accounts have deterministic IDs and cannot be used to access the application.
WITH demo AS (
    SELECT n, md5('mesh-demo-user-' || n)::uuid AS user_id
    FROM generate_series(1, 100) AS n
)
INSERT INTO app_user (id, email, password_hash, role, account_status)
SELECT user_id,
       'demo-' || lpad(n::text, 3, '0') || '@mesh.local',
       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
       'STUDENT',
       'ACTIVE'
FROM demo
ON CONFLICT (email) DO NOTHING;

WITH demo AS (
    SELECT n, md5('mesh-demo-user-' || n)::uuid AS user_id
    FROM generate_series(1, 100) AS n
), names AS (
    SELECT ARRAY['Aarav','Ananya','Arjun','Diya','Ishaan','Kavya','Meera','Rohan','Saanvi','Vihaan'] AS first_names,
           ARRAY['Mehta','Sharma','Iyer','Kapoor','Reddy','Nair','Singh','Bose','Gupta','Rao'] AS last_names
)
INSERT INTO student_profile (user_id, username, display_name, department, year_of_study, bio, availability, availability_timezone, primary_domain, onboarding_complete)
SELECT demo.user_id,
       'mesh-student-' || lpad(demo.n::text, 3, '0'),
       names.first_names[1 + ((demo.n - 1) % 10)] || ' ' || names.last_names[1 + ((demo.n * 3 - 1) % 10)],
       (ARRAY['Computer Science','Information Technology','Electronics','Design'])[1 + ((demo.n - 1) % 4)],
       (1 + ((demo.n - 1) % 4))::smallint,
       (ARRAY['Building practical products with thoughtful collaborators.','Looking for a project team that ships every week.','Interested in learning by making useful student tools.','Open to hackathons, portfolio work, and peer feedback.'])[1 + ((demo.n - 1) % 4)],
       'Weekday evenings',
       'Asia/Kolkata',
       (ARRAY['WEB_DEVELOPMENT','DATA_AI','UI_UX','MOBILE'])[1 + ((demo.n - 1) % 4)],
       TRUE
FROM demo CROSS JOIN names
ON CONFLICT (user_id) DO NOTHING;

WITH demo AS (
    SELECT n, md5('mesh-demo-user-' || n)::uuid AS user_id
    FROM generate_series(1, 100) AS n
)
INSERT INTO profile_skill (profile_user_id, skill_id, self_assessed_proficiency)
SELECT demo.user_id,
       (1 + (((demo.n + slot.position_index * 5 - 2) % 15 + 15) % 15))::bigint,
       (3 + ((demo.n + slot.position_index) % 3))::smallint
FROM demo CROSS JOIN generate_series(0, 2) AS slot(position_index)
ON CONFLICT (profile_user_id, skill_id) DO NOTHING;

WITH demo AS (
    SELECT n, md5('mesh-demo-user-' || n)::uuid AS user_id
    FROM generate_series(1, 100) AS n
)
INSERT INTO profile_goal (profile_user_id, goal_code)
SELECT demo.user_id,
       (ARRAY['HACKATHON','COURSE_PROJECT','OPEN_SOURCE','PORTFOLIO','STARTUP','RESEARCH','LEARNING'])[1 + ((demo.n - 1) % 7)]
FROM demo
ON CONFLICT (profile_user_id, goal_code) DO NOTHING;

WITH demo AS (
    SELECT n, md5('mesh-demo-user-' || n)::uuid AS user_id
    FROM generate_series(1, 100) AS n
)
INSERT INTO profile_interest (profile_user_id, interest_id)
SELECT demo.user_id, (1 + (((demo.n + slot.position_index - 2) % 12 + 12) % 12))::bigint
FROM demo CROSS JOIN generate_series(0, 1) AS slot(position_index)
ON CONFLICT (profile_user_id, interest_id) DO NOTHING;

WITH demo AS (
    SELECT n, md5('mesh-demo-user-' || n)::uuid AS user_id
    FROM generate_series(1, 100) AS n
)
INSERT INTO profile_desired_skill (profile_user_id, skill_id)
SELECT demo.user_id, (1 + ((demo.n + slot.position_index * 4 - 1) % 15))::bigint
FROM demo CROSS JOIN generate_series(0, 1) AS slot(position_index)
ON CONFLICT (profile_user_id, skill_id) DO NOTHING;

WITH demo AS (
    SELECT n, md5('mesh-demo-user-' || n)::uuid AS user_id
    FROM generate_series(1, 100) AS n
)
INSERT INTO availability_window (profile_user_id, day_of_week, start_minute, end_minute)
SELECT demo.user_id,
       (1 + ((demo.n - 1) % 5))::smallint,
       1080::smallint,
       1260::smallint
FROM demo
ON CONFLICT (profile_user_id, day_of_week, start_minute, end_minute) DO NOTHING;
