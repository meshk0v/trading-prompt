-- Unread answers: the last staff message the user has seen in each ticket. A ticket is unread
-- while it has a staff message with a higher id.

ALTER TABLE tickets ADD COLUMN seen_message_id INT UNSIGNED NOT NULL DEFAULT 0;
