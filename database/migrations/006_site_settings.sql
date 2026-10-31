-- Affiliate program terms (reward percent, payout fee, payout currency and network, calculator limits)
-- changed by administrators in the editor. A setting that is not stored here uses the default from the code
-- (data/affiliate.ts). Run once on databases created before this file existed.

CREATE TABLE IF NOT EXISTS site_settings (
  name       VARCHAR(64)  NOT NULL,
  value      VARCHAR(64)  NOT NULL,
  updated_by INT UNSIGNED NULL,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
