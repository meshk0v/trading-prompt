<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_market.php';

// Candles for the prompt: ?pair=EUR/USD&timeframe=M1&limit=1440. Public, like the prompt builder.
$pair = (string) ($_GET['pair'] ?? '');
$timeframe = (string) ($_GET['timeframe'] ?? '');
$limit = (int) ($_GET['limit'] ?? 100);

$symbol = market_symbol($pair);
if ($symbol === null) {
    fail(404, 'Для этого инструмента нет рыночных данных');
}
if (!isset(TIMEFRAMES[$timeframe])) {
    fail(422, 'Неизвестный таймфрейм');
}
$limit = max(1, min(MAX_BARS, $limit));

try {
    $bars = timeframe_bars($symbol, $timeframe, $limit);
    $tick = biquote_get('/' . rawurlencode($symbol));
} catch (RuntimeException $e) {
    error_log('market.php: ' . $e->getMessage());
    fail(502, 'Источник рыночных данных недоступен. Попробуйте позже');
} catch (Throwable $e) {
    error_log('market.php: ' . $e->getMessage());
    fail(500, 'Ошибка сервера');
}

respond(200, [
    'ok' => true,
    'pair' => $pair,
    'symbol' => $symbol,
    'timeframe' => $timeframe,
    'price' => [
        'value' => isset($tick['mid']) ? (float) $tick['mid'] : null,
        'time' => isset($tick['timestamp']) ? strtotime($tick['timestamp']) : null,
        'marketOpen' => ($tick['marketState'] ?? '') === 'open',
    ],
    // [time (unix seconds, candle open, UTC), open, high, low, close, tick volume], oldest first
    'bars' => $bars,
]);
