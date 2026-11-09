-- The text editor, affiliate terms editor and server-side candle collector were removed.
-- Run once on a database created before this change; new installs never have these tables.
-- Also delete the Plesk scheduler task for api/_cron-collect.php.
DROP TABLE IF EXISTS site_texts;
DROP TABLE IF EXISTS market_candles;
DROP TABLE IF EXISTS site_settings;
