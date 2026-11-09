<?php
// Telegram Bot API client for the support chat. Compatible with PHP 7.4+.

declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

function telegram_configured(): bool
{
    $c = config();
    return !empty($c['tg_bot_token']) && !empty($c['tg_chat_id']);
}

/** Calls a Bot API method. Returns the `result` or null on any failure (logged, never thrown). */
function telegram_call(string $method, array $params): ?array
{
    $c = config();
    $base = rtrim((string) ($c['tg_api'] ?? 'https://api.telegram.org'), '/');
    $curl = curl_init("$base/bot{$c['tg_bot_token']}/$method");
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($params, JSON_UNESCAPED_UNICODE),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
    ]);
    $response = curl_exec($curl);
    $error = curl_error($curl);
    curl_close($curl);

    $data = is_string($response) ? json_decode($response, true) : null;
    if (!is_array($data) || empty($data['ok'])) {
        error_log("Telegram $method failed: " . ($error !== '' ? $error : (is_string($response) ? $response : 'no response')));
        return null;
    }
    return is_array($data['result']) ? $data['result'] : [];
}

/** Telegram refuses long messages; keep a margin below its 4096 characters. */
function telegram_text(string $text): string
{
    return mb_strlen($text) > 3900 ? mb_substr($text, 0, 3900) . '…' : $text;
}
