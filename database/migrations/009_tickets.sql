-- Support tickets: the user writes on the site, staff answer in a Telegram topic, the answer
-- appears in the ticket on the site and is emailed to the user.

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
