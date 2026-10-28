<?php
// Collects minute candles of every instrument into market_candles: biquote keeps only about
// 5 hours of them, the prompt needs 1440. Run by the scheduler every 10 minutes:
// Plesk → Планировщик задач → Запустить PHP-скрипт → httpdocs/api/_cron-collect.php
// Not reachable from the web (api/.htaccess denies files starting with "_").

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_market.php';

// A run that takes longer than the interval must not overlap with the next one.
if ((int) db()->query("SELECT GET_LOCK('tp_market_collect', 0)")->fetchColumn() !== 1) {
    echo "Another run is still in progress\n";
    exit;
}

$started = microtime(true);
$stored = 0;
$failed = [];
foreach (array_unique(array_values(MARKET_SYMBOLS)) as $symbol) {
    try {
        $stored += collect_minute_bars($symbol);
        prune_minute_bars($symbol);
    } catch (Throwable $e) {
        $failed[] = $symbol;
        error_log("_cron-collect.php $symbol: " . $e->getMessage());
    }
}

printf(
    "%s: %d candles stored, %d instruments failed%s, %.1f s\n",
    gmdate('Y-m-d H:i:s'),
    $stored,
    count($failed),
    $failed ? ' (' . implode(', ', $failed) . ')' : '',
    microtime(true) - $started
);
