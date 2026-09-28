-- ============================================================
-- FOREIGN KEYS
-- PURPOSE: Defines relationships between Mesh tables
-- ============================================================

-- ============================================================
-- profile_skill → users_profile
-- ============================================================

ALTER TABLE profile_skill
ADD CONSTRAINT fk_profile_skill_user FOREIGN KEY (user_id) REFERENCES users_profile (user_id);

-- ============================================================
-- profile_skill → skills
-- ============================================================

ALTER TABLE profile_skill
ADD CONSTRAINT fk_profile_skill_skill FOREIGN KEY (skill_id) REFERENCES skills (skill_id);

-- ============================================================
-- swipes → users_profile
-- Sender
-- ============================================================

ALTER TABLE swipes
ADD CONSTRAINT fk_swipes_sender FOREIGN KEY (sender_id) REFERENCES users_profile (user_id);

-- ============================================================
-- swipes → users_profile
-- Receiver
-- ============================================================

ALTER TABLE swipes
ADD CONSTRAINT fk_swipes_receiver FOREIGN KEY (receiver_id) REFERENCES users_profile (user_id);

-- ============================================================
-- matches → users_profile
-- User One
-- ============================================================

ALTER TABLE matches
ADD CONSTRAINT fk_matches_user_one FOREIGN KEY (user_one_id) REFERENCES users_profile (user_id);

-- ============================================================
-- matches → users_profile
-- User Two
-- ============================================================

ALTER TABLE matches
ADD CONSTRAINT fk_matches_user_two FOREIGN KEY (user_two_id) REFERENCES users_profile (user_id);

-- ============================================================
-- collaboration_members → collaborations
-- ============================================================

ALTER TABLE collaboration_members
ADD CONSTRAINT fk_collaboration_members_collab FOREIGN KEY (collab_id) REFERENCES collaborations (collab_id);

-- ============================================================
-- collaboration_members → users_profile
-- ============================================================

ALTER TABLE collaboration_members
ADD CONSTRAINT fk_collaboration_members_user FOREIGN KEY (user_id) REFERENCES users_profile (user_id);