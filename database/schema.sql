-- Trading Prompt: users, sessions, login throttling, referral links, payments, rewards, payout requests and support tickets.
-- Import once via Plesk → Databases → phpMyAdmin → Import.

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  telegram      VARCHAR(64)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  guide_completed_at DATETIME NULL DEFAULT NULL, -- onboarding guide finished on any device
  is_admin      TINYINT(1)   NOT NULL DEFAULT 0, -- reserved for staff features
  referred_by_link_id INT UNSIGNED NULL DEFAULT NULL, -- referral link the user signed up with
  payout_wallet VARCHAR(128) NULL DEFAULT NULL,
  payout_network VARCHAR(16) NULL DEFAULT NULL,
  balance_cents BIGINT       NOT NULL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS referral_links (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  code       VARCHAR(16)  NOT NULL,
  name       VARCHAR(60)  NOT NULL,
  is_default TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME     NULL DEFAULT NULL, -- deleted links keep working for clients already attached
  PRIMARY KEY (id),
  UNIQUE KEY referral_links_code (code),
  KEY referral_links_user (user_id),
  CONSTRAINT referral_links_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL,
  amount_cents BIGINT       NOT NULL,
  provider     VARCHAR(16)  NOT NULL, -- 'demo' until a payment system is connected
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY payments_user (user_id),
  CONSTRAINT payments_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One reward per payment (payment_id is unique, so a repeated webhook cannot pay twice).
CREATE TABLE IF NOT EXISTS referral_earnings (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id   INT UNSIGNED NOT NULL,
  referral_id  INT UNSIGNED NOT NULL,
  link_id      INT UNSIGNED NOT NULL,
  payment_id   INT UNSIGNED NOT NULL,
  amount_cents BIGINT       NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY referral_earnings_payment (payment_id),
  KEY referral_earnings_partner (partner_id),
  KEY referral_earnings_referral (referral_id),
  CONSTRAINT referral_earnings_partner_fk FOREIGN KEY (partner_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT referral_earnings_referral_fk FOREIGN KEY (referral_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT referral_earnings_payment_fk FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- fee_cents is the partner's share of the network fee; the partner receives amount_cents - fee_cents.
CREATE TABLE IF NOT EXISTS payout_requests (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL,
  amount_cents BIGINT       NOT NULL,
  fee_cents    BIGINT       NOT NULL,
  wallet       VARCHAR(128) NOT NULL,
  network      VARCHAR(16)  NOT NULL,
  status       VARCHAR(16)  NOT NULL DEFAULT 'processing', -- processing | completed | rejected
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY payout_requests_user (user_id),
  CONSTRAINT payout_requests_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tickets (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED NOT NULL,
  subject      VARCHAR(200) NOT NULL,
  status       VARCHAR(16)  NOT NULL DEFAULT 'open', -- open | answered | closed
  tg_thread_id BIGINT       NULL DEFAULT NULL,       -- Telegram topic of the ticket
  tg_sent      TINYINT(1)   NOT NULL DEFAULT 0,      -- the ticket reached Telegram
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY tickets_user (user_id),
  KEY tickets_thread (tg_thread_id),
  CONSTRAINT tickets_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_messages (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id    INT UNSIGNED NOT NULL,
  author       VARCHAR(8)   NOT NULL, -- user | staff
  body         TEXT         NOT NULL,
  tg_message_id BIGINT      NULL DEFAULT NULL, -- Telegram message of this entry
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ticket_messages_ticket (ticket_id),
  KEY ticket_messages_tg (tg_message_id),
  CONSTRAINT ticket_messages_ticket_fk FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
