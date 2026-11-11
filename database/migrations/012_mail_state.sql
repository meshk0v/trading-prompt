-- Replies by email: where the mailbox reader stopped (UID of the last message it has looked at).

CREATE TABLE IF NOT EXISTS mail_state (
  name  VARCHAR(32) NOT NULL,
  value VARCHAR(64) NOT NULL,
  PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
