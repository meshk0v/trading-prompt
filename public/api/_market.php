<?php
// Market data from biquote.io (free, no key): instrument names, candles for every timeframe
// of the prompt builder, and the minute candles we collect ourselves (biquote keeps only ~5 hours
// of them, the prompt needs up to 1440). Included by market.php, calendar.php and _cron-collect.php.

declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

const BIQUOTE_URL = 'https://biquote.io/api';
/** Minute candles kept per instrument: a day (1440) plus a margin for weekends and gaps. */
const MINUTE_BARS_KEPT = 2000;
const MAX_BARS = 2000;

/** Prompt builder instrument → biquote symbol. Instruments missing here have no market data. */
const MARKET_SYMBOLS = [
    'EUR/USD'      => 'EURUSD',
    'GBP/USD'      => 'GBPUSD',
    'USD/JPY'      => 'USDJPY',
    'USD/CHF'      => 'USDCHF',
    'AUD/USD'      => 'AUDUSD',
    'USD/CAD'      => 'USDCAD',
    'NZD/USD'      => 'NZDUSD',
    'EUR/JPY'      => 'EURJPY',
    'GBP/JPY'      => 'GBPJPY',
    'EUR/GBP'      => 'EURGBP',
    'EUR/CHF'      => 'EURCHF',
    'AUD/JPY'      => 'AUDJPY',
    'GBP/CHF'      => 'GBPCHF',
    'NZD/JPY'      => 'NZDJPY',
    'AUD/NZD'      => 'AUDNZD',
    'CHF/JPY'      => 'CHFJPY',
    'EUR/AUD'      => 'EURAUD',
    'GBP/AUD'      => 'GBPAUD',
    'EUR/CAD'      => 'EURCAD',
    'GBP/CAD'      => 'GBPCAD',
    'AUD/CAD'      => 'AUDCAD',
    'AUD/CHF'      => 'AUDCHF',
    'CAD/CHF'      => 'CADCHF',
    'CAD/JPY'      => 'CADJPY',
    'EUR/DKK'      => 'EURDKK',
    'EUR/NOK'      => 'EURNOK',
    'EUR/NZD'      => 'EURNZD',
    'EUR/PLN'      => 'EURPLN',
    'EUR/SEK'      => 'EURSEK',
    'GBP/NZD'      => 'GBPNZD',
    'NZD/CAD'      => 'NZDCAD',
    'NZD/CHF'      => 'NZDCHF',
    'AUD/SGD'      => 'AUDSGD',
    'EUR/CZK'      => 'EURCZK',
    'EUR/HUF'      => 'EURHUF',
    'GBP/DKK'      => 'GBPDKK',
    'GBP/NOK'      => 'GBPNOK',
    'GBP/PLN'      => 'GBPPLN',
    'GBP/SEK'      => 'GBPSEK',
    'GBP/SGD'      => 'GBPSGD',
    'NZD/SGD'      => 'NZDSGD',
    'SGD/JPY'      => 'SGDJPY',
    'USD/CNH'      => 'USDCNH',
    'USD/TRY'      => 'USDTRY',
    'USD/ZAR'      => 'USDZAR',
    'USD/MXN'      => 'USDMXN',
    'USD/SGD'      => 'USDSGD',
    'USD/HKD'      => 'USDHKD',
    'EUR/TRY'      => 'EURTRY',
    'USD/BRL'      => 'USDBRL',
    'USD/PLN'      => 'USDPLN',
    'USD/NOK'      => 'USDNOK',
    'USD/SEK'      => 'USDSEK',
    'USD/DKK'      => 'USDDKK',
    'USD/THB'      => 'USDTHB',
    'USD/IDR'      => 'USDIDR',
    'USD/INR'      => 'USDINR',
    'USD/KRW'      => 'USDKRW',
    'USD/CZK'      => 'USDCZK',
    'USD/HUF'      => 'USDHUF',
    'USD/RON'      => 'USDRON',
    'USD/AED'      => 'USDAED',
    'USD/SAR'      => 'USDSAR_HKN',
    'USD/QAR'      => 'USDQAR_HKN',
    'USD/EGP'      => 'USDEGP',
    'EUR/ZAR'      => 'EURZAR',
    'GBP/ZAR'      => 'GBPZAR',
    'EUR/MXN'      => 'EURMXN',
    'BTC/USD'      => 'BTCUSD',
    'ETH/USD'      => 'ETHUSD',
    'BNB/USD'      => 'BNBUSD',
    'XRP/USD'      => 'XRPUSD',
    'SOL/USD'      => 'SOLUSD',
    'ADA/USD'      => 'ADAUSDT',
    'AVAX/USD'     => 'AVAXUSDT',
    'DOT/USD'      => 'DOTUSDT',
    'MATIC/USD'    => 'POLUSDT',
    'LINK/USD'     => 'LINKUSDT',
    'LTC/USD'      => 'LTCUSD',
    'ATOM/USD'     => 'ATOMUSDT',
    'DOGE/USD'     => 'DOGEUSDT',
    'TRX/USD'      => 'TRXUSDT',
    'XAU/USD'      => 'XAUUSD',
    'XAG/USD'      => 'XAGUSD',
    'OIL/USD'      => 'USOIL',
    'BRENT/USD'    => 'UKOIL',
    'GAS/USD'      => 'XNGUSD',
    'COPPER/USD'   => 'COPPERUSDT',
    'PLATINUM/USD' => 'XPTUSD',
    'SPX500'       => 'US500',
    'NDX100'       => 'USTEC',
    'FTSE100'      => 'UK100',
    'NKY225'       => 'JP225',
    'HK50'         => 'HK50',
    'ASX200'       => 'AUS200',
    'DJ30'         => 'US30',
];

/** Currency of instruments that are not currency pairs, for the economic calendar. */
const INSTRUMENT_CURRENCIES = [
    'SPX500' => ['USD'],
    'NDX100' => ['USD'],
    'DJ30' => ['USD'],
    'FTSE100' => ['GBP'],
    'NKY225' => ['JPY'],
    'ASX200' => ['AUD'],
];

/** Economic calendar countries by currency (biquote /calendar/countries); the euro uses its largest economies. */
const CURRENCY_COUNTRIES = [
    'USD' => ['US'], 'EUR' => ['EU', 'DE', 'FR', 'IT', 'ES'], 'GBP' => ['GB'], 'JPY' => ['JP'],
    'CHF' => ['CH'], 'AUD' => ['AU'], 'NZD' => ['NZ'], 'CAD' => ['CA'], 'CNY' => ['CN'],
    'HKD' => ['HK'], 'SGD' => ['SG'], 'SEK' => ['SE'], 'NOK' => ['NO'], 'DKK' => ['DK'],
    'PLN' => ['PL'], 'CZK' => ['CZ'], 'HUF' => ['HU'], 'RON' => ['RO'], 'TRY' => ['TR'],
    'ZAR' => ['ZA'], 'MXN' => ['MX'], 'BRL' => ['BR'], 'INR' => ['IN'], 'KRW' => ['KR'],
    'RUB' => ['RU'], 'SAR' => ['SA'], 'AED' => ['AE'], 'ILS' => ['IL'], 'EGP' => ['EG'],
    'THB' => ['TH'], 'IDR' => ['ID'], 'MYR' => ['MY'], 'PHP' => ['PH'], 'TWD' => ['TW'],
    'KZT' => ['KZ'], 'UAH' => ['UA'],
];

/**
 * Where each timeframe of the prompt builder comes from: a biquote interval (or our minute
 * candles, "db"), and the size of its candles in seconds when several source candles are merged.
 */
const TIMEFRAMES = [
    'M1' => ['db', 60], 'M2' => ['db', 120], 'M3' => ['db', 180], 'M4' => ['db', 240], 'M12' => ['db', 720],
    'M5' => ['5m', 300], 'M10' => ['5m', 600], 'M20' => ['5m', 1200],
    'M15' => ['15m', 900], 'M30' => ['30m', 1800],
    'H1' => ['1h', 3600], 'H2' => ['1h', 7200], 'H3' => ['1h', 10800], 'H6' => ['1h', 21600],
    'H4' => ['4h', 14400], 'H8' => ['4h', 28800], 'H12' => ['4h', 43200],
    'D1' => ['1d', 86400], 'W1' => ['1d', 'week'], 'MN' => ['1d', 'month'],
];

const SOURCE_SECONDS = ['1m' => 60, '5m' => 300, '15m' => 900, '30m' => 1800, '1h' => 3600, '4h' => 14400, '1d' => 86400];

function market_symbol(string $pair): ?string
{
    return MARKET_SYMBOLS[$pair] ?? null;
}

/** GET request to biquote, retried once; throws when the service is unreachable or answers with an error. */
function biquote_get(string $path, array $query = [])
{
    try {
        return biquote_request($path, $query);
    } catch (RuntimeException $e) {
        usleep(500000);
        return biquote_request($path, $query);
    }
}

function biquote_request(string $path, array $query)
{
    $url = BIQUOTE_URL . $path . ($query ? '?' . http_build_query($query) : '');
    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_USERAGENT => 'TradingPrompt/1.0',
        ]);
        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
    } else {
        $context = stream_context_create(['http' => ['timeout' => 15, 'ignore_errors' => true, 'user_agent' => 'TradingPrompt/1.0']]);
        $body = @file_get_contents($url, false, $context);
        $status = isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m) ? (int) $m[1] : 0;
    }
    if ($body === false || $status !== 200) {
        throw new RuntimeException("biquote $path: HTTP $status");
    }
    $data = json_decode((string) $body, true);
    if (!is_array($data)) {
        throw new RuntimeException("biquote $path: invalid JSON");
    }
    return $data;
}

/**
 * Candles from biquote as [time (unix seconds), open, high, low, close, tick volume]:
 * 'closed' oldest first, and 'current' — the candle that is still forming (null when the market is closed).
 */
function fetch_bars(string $symbol, string $interval, int $limit = 1000): array
{
    $data = biquote_get('/' . rawurlencode($symbol) . '/ohlc', ['interval' => $interval, 'limit' => $limit]);
    $bars = [];
    $current = null;
    foreach ($data['bars'] ?? [] as $bar) {
        $candle = [
            strtotime($bar['openTime']),
            (float) $bar['open'],
            (float) $bar['high'],
            (float) $bar['low'],
            (float) $bar['close'],
            (int) ($bar['tickVolume'] ?? 0),
        ];
        if (!empty($bar['isOpen'])) {
            $current = $candle;
        } else {
            $bars[] = $candle;
        }
    }
    usort($bars, static function (array $a, array $b): int {
        return $a[0] <=> $b[0];
    });
    return ['closed' => $bars, 'current' => $current];
}

// ── Our minute candles ──────────────────────────────────────────────────

function store_minute_bars(string $symbol, array $bars): int
{
    if (!$bars) {
        return 0;
    }
    $rows = [];
    $values = [];
    foreach ($bars as $bar) {
        $rows[] = '(?, ?, ?, ?, ?, ?, ?)';
        array_push($values, $symbol, gmdate('Y-m-d H:i:s', $bar[0]), $bar[1], $bar[2], $bar[3], $bar[4], $bar[5]);
    }
    db()->prepare(
        'INSERT INTO market_candles (symbol, open_time, open, high, low, close, tick_volume) VALUES '
        . implode(', ', $rows)
        . ' ON DUPLICATE KEY UPDATE open = VALUES(open), high = VALUES(high), low = VALUES(low),
            close = VALUES(close), tick_volume = VALUES(tick_volume)'
    )->execute($values);
    return count($bars);
}

/** Drops minute candles beyond the newest MINUTE_BARS_KEPT of an instrument. */
function prune_minute_bars(string $symbol): void
{
    $stmt = db()->prepare(
        'SELECT open_time FROM market_candles WHERE symbol = ? ORDER BY open_time DESC LIMIT 1 OFFSET ' . MINUTE_BARS_KEPT
    );
    $stmt->execute([$symbol]);
    $cutoff = $stmt->fetchColumn();
    if ($cutoff !== false) {
        db()->prepare('DELETE FROM market_candles WHERE symbol = ? AND open_time <= ?')->execute([$symbol, $cutoff]);
    }
}

/** Fetches the minutes biquote has and we do not have yet (it keeps about 5 hours). */
function collect_minute_bars(string $symbol): int
{
    return store_minute_bars($symbol, fetch_bars($symbol, '1m', 1000)['closed']);
}

function load_minute_bars(string $symbol, int $limit): array
{
    // open_time is stored in UTC; read it as text so the database time zone does not matter.
    $stmt = db()->prepare(
        'SELECT open_time, open, high, low, close, tick_volume
         FROM market_candles WHERE symbol = ? ORDER BY open_time DESC LIMIT ' . $limit
    );
    $stmt->execute([$symbol]);
    $bars = array_map(static function (array $row): array {
        return [strtotime($row['open_time'] . ' UTC'), (float) $row['open'], (float) $row['high'], (float) $row['low'], (float) $row['close'], (int) $row['tick_volume']];
    }, $stmt->fetchAll());
    return array_reverse($bars);
}

// ── Timeframes ──────────────────────────────────────────────────────────

/** Start of the candle that contains $time: fixed-size candles are aligned to UTC midnight. */
function bucket_start(int $time, $size): int
{
    if ($size === 'week') {
        // Weeks start on Monday; 1970-01-01 was a Thursday.
        return intdiv($time - 345600, 604800) * 604800 + 345600;
    }
    if ($size === 'month') {
        return gmmktime(0, 0, 0, (int) gmdate('n', $time), 1, (int) gmdate('Y', $time));
    }
    return intdiv($time, $size) * $size;
}

function bucket_end(int $start, $size): int
{
    if ($size === 'week') {
        return $start + 604800;
    }
    if ($size === 'month') {
        return gmmktime(0, 0, 0, (int) gmdate('n', $start) + 1, 1, (int) gmdate('Y', $start));
    }
    return $start + $size;
}

/**
 * Merges source candles into larger ones. Returns the candles, the last one possibly still forming,
 * and whether it is forming (it holds the current source candle, or its period has not ended yet).
 */
function aggregate_bars(array $closed, ?array $current, $size, int $sourceSeconds): array
{
    $source = $current ? array_merge($closed, [$current]) : $closed;
    if (!$source) {
        return ['bars' => [], 'current' => false];
    }
    $result = [];
    foreach ($source as $bar) {
        $start = bucket_start($bar[0], $size);
        $last = count($result) - 1;
        if ($last >= 0 && $result[$last][0] === $start) {
            $result[$last][2] = max($result[$last][2], $bar[2]);
            $result[$last][3] = min($result[$last][3], $bar[3]);
            $result[$last][4] = $bar[4];
            $result[$last][5] += $bar[5];
        } else {
            $result[] = [$start, $bar[1], $bar[2], $bar[3], $bar[4], $bar[5]];
        }
    }
    $lastClosedEnd = $closed ? $closed[count($closed) - 1][0] + $sourceSeconds : 0;
    $forming = $current !== null || bucket_end($result[count($result) - 1][0], $size) > $lastClosedEnd;
    return ['bars' => $result, 'current' => $forming];
}

/**
 * Candles of a prompt builder timeframe, oldest first, at most $limit of them, including the one
 * that is still forming: 'current' tells whether the last candle is it.
 */
function timeframe_bars(string $symbol, string $timeframe, int $limit): array
{
    [$source, $size] = TIMEFRAMES[$timeframe];
    if ($source === 'db') {
        // The latest minutes come straight from biquote, so the candles are fresh between collector runs.
        $fresh = fetch_bars($symbol, '1m', 1000);
        store_minute_bars($symbol, $fresh['closed']);
        $factor = intdiv($size, 60);
        $closed = load_minute_bars($symbol, min(MINUTE_BARS_KEPT, $limit * $factor + $factor));
        $current = $fresh['current'];
        $sourceSeconds = 60;
    } else {
        $fresh = fetch_bars($symbol, $source, 1000);
        $closed = $fresh['closed'];
        $current = $fresh['current'];
        $sourceSeconds = SOURCE_SECONDS[$source];
    }
    if ($size !== $sourceSeconds) {
        $result = aggregate_bars($closed, $current, $size, $sourceSeconds);
    } else {
        $result = ['bars' => $current ? array_merge($closed, [$current]) : $closed, 'current' => $current !== null];
    }
    $result['bars'] = array_slice($result['bars'], -$limit);
    return $result;
}

/** Currencies whose economic news move an instrument. */
function instrument_currencies(string $pair): array
{
    if (isset(INSTRUMENT_CURRENCIES[$pair])) {
        return INSTRUMENT_CURRENCIES[$pair];
    }
    $parts = explode('/', $pair);
    $currencies = array_values(array_filter($parts, static function (string $code): bool {
        return isset(CURRENCY_COUNTRIES[$code]);
    }));
    // Crypto, metals and commodities are quoted in dollars.
    return $currencies ?: ['USD'];
}
