-- ============================================================
-- DATABASE VERIFICATION QUERIES
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================

SELECT * FROM users_profile;

-- ============================================================
-- SKILLS
-- ============================================================

SELECT * FROM skills;

-- ============================================================
-- PROFILE SKILLS
-- ============================================================

SELECT * FROM profile_skill;

-- ============================================================
-- USER + SKILLS
-- ============================================================

SELECT u.user_id, u.first_name, u.last_name, s.skill_name
FROM
    users_profile u
    JOIN profile_skill ps ON u.user_id = ps.user_id
    JOIN skills s ON ps.skill_id = s.skill_id;

-- ============================================================
-- SWIPES
-- ============================================================

SELECT * FROM swipes;

-- ============================================================
-- MATCHES
-- ============================================================

SELECT m.match_id, u1.first_name AS user_one, u2.first_name AS user_two
FROM
    matches m
    JOIN users_profile u1 ON m.user_one_id = u1.user_id
    JOIN users_profile u2 ON m.user_two_id = u2.user_id;

-- ============================================================
-- COLLABORATIONS
-- ============================================================

SELECT * FROM collaborations;

-- ============================================================
-- COLLABORATION MEMBERS
-- ============================================================

SELECT * FROM collaboration_members;

-- ============================================================
-- COLLABORATION + MEMBERS
-- ============================================================

SELECT c.title, u.first_name, u.last_name, cm.role
FROM
    collaboration_members cm
    JOIN collaborations c ON cm.collab_id = c.collab_id
    JOIN users_profile u ON cm.user_id = u.user_id;