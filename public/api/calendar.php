<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_market.php';

// Economic calendar for the currencies of an instrument: ?pair=EUR/USD.
// Two days back and three days ahead, medium and high importance.
$pair = (string) ($_GET['pair'] ?? '');
if (market_symbol($pair) === null) {
    fail(404, 'Для этого инструмента нет рыночных данных');
}

$currencies = instrument_currencies($pair);
$countries = [];
foreach ($currencies as $currency) {
    $countries = array_merge($countries, CURRENCY_COUNTRIES[$currency]);
}

try {
    $events = biquote_get('/calendar', [
        // Comma-separated: biquote reads only the first of repeated "countries" parameters.
        'countries' => implode(',', array_unique($countries)),
        'from' => gmdate('Y-m-d\TH:i:s\Z', time() - 2 * 86400),
        'to' => gmdate('Y-m-d\TH:i:s\Z', time() + 3 * 86400),
        'limit' => 500,
    ]);
} catch (RuntimeException $e) {
    error_log('calendar.php: ' . $e->getMessage());
    fail(502, 'Источник рыночных данных недоступен. Попробуйте позже');
}

$result = [];
foreach ($events as $event) {
    if (!in_array($event['importance'] ?? '', ['medium', 'high'], true) || !in_array($event['currency'] ?? '', $currencies, true)) {
        continue;
    }
    $result[] = [
        'time' => strtotime($event['time']),
        'currency' => $event['currency'],
        'name' => $event['name'],
        'importance' => $event['importance'],
        'actual' => $event['actual'],
        'forecast' => $event['forecast'],
        'previous' => $event['previous'],
        'unit' => $event['unit'] ?? 'none',
    ];
}
usort($result, static function (array $a, array $b): int {
    return $a['time'] <=> $b['time'];
});

respond(200, ['ok' => true, 'currencies' => $currencies, 'events' => $result]);
