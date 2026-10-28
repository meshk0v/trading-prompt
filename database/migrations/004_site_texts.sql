-- Text editor for administrators: texts changed on the site are stored here,
-- every other text comes from the code. Also marks which users are administrators.
-- Run once on databases created before this file existed.
--
-- Make an account an administrator (phpMyAdmin → SQL):
--   UPDATE users SET is_admin = 1 WHERE email = 'name@example.com';

ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0 AFTER guide_completed_at;

CREATE TABLE IF NOT EXISTS site_texts (
  key_hash   CHAR(64)     NOT NULL,
  text_key   MEDIUMTEXT   NOT NULL,
  ru         MEDIUMTEXT   NULL,
  en         MEDIUMTEXT   NULL,
  updated_by INT UNSIGNED NULL,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (key_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
