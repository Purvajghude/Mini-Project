-- ============================================================
-- TABLE: swipes
-- PURPOSE: Stores swipe actions between users
-- RELATIONSHIP: users_profile → swipes
-- ============================================================
Create TABLE swipes (
    swipe_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    swipe_type VARCHAR(20) NOT NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_date TIMESTAMP,
    updated_by INT,
    deleted_date TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_swipe_users CHECK (sender_id <> receiver_id)
);

Select * from swipes;