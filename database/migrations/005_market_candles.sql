-- Minute candles collected from biquote.io by api/_cron-collect.php: biquote keeps only
-- about 5 hours of them, the prompt needs up to 1440. Times are UTC.
-- Run once on databases created before this file existed.

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
