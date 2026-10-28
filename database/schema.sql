-- Trading Prompt: users, sessions, login throttling, texts edited on the site and collected market data.
-- Import once via Plesk → Databases → phpMyAdmin → Import.

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  telegram      VARCHAR(64)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  guide_completed_at DATETIME NULL DEFAULT NULL, -- onboarding guide finished on any device
  is_admin      TINYINT(1)   NOT NULL DEFAULT 0, -- may edit site texts
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ip         VARCHAR(45)  NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY login_attempts_ip_time (ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL,
  token_hash   CHAR(64)     NOT NULL,
  user_agent   VARCHAR(255) NOT NULL DEFAULT '',
  ip           VARCHAR(45)  NOT NULL DEFAULT '',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY user_sessions_token (token_hash),
  KEY user_sessions_user (user_id),
  CONSTRAINT user_sessions_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Texts changed by administrators; key_hash = SHA-256 of text_key (the Russian text in the code).
-- Empty ru/en means "use the text from the code".
CREATE TABLE IF NOT EXISTS site_texts (
  key_hash   CHAR(64)     NOT NULL,
  text_key   MEDIUMTEXT   NOT NULL,
  ru         MEDIUMTEXT   NULL,
  en         MEDIUMTEXT   NULL,
  updated_by INT UNSIGNED NULL,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (key_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Minute candles collected from biquote.io by api/_cron-collect.php (UTC); the newest 2000 per symbol are kept.
CREATE TABLE IF NOT EXISTS market_candles (
  symbol      VARCHAR(32)  NOT NULL,
  open_time   DATETIME     NOT NULL,
  open        DOUBLE       NOT NULL,
  high        DOUBLE       NOT NULL,
  low         DOUBLE       NOT NULL,
  close       DOUBLE       NOT NULL,
  tick_volume INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (symbol, open_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
