-- Remembers that a signed-in user finished (or skipped) the onboarding guide,
-- so it is not shown again on other devices.
-- Run once on databases created before this file existed.

ALTER TABLE users ADD COLUMN guide_completed_at DATETIME NULL DEFAULT NULL AFTER password_hash;
