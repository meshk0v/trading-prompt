<?php
require __DIR__ . '/_bootstrap.php';

$body = read_json_body();
$user = require_admin();

/** Editable affiliate terms: kind and limits. Keep in step with TERMS in src/data/affiliate.ts. */
const TERMS = [
    'rewardPercent' => ['number', 1, 100],
    'payoutFeePercent' => ['number', 0, 100],
    'payoutCurrency' => ['word'],
    'payoutNetwork' => ['word'],
    'maxClients' => ['integer', 2, 100000],
    'maxDeposit' => ['integer', 2, 1000000],
];

$name = $body['name'] ?? null;
if (!is_string($name) || !isset(TERMS[$name])) {
    fail(422, 'Неизвестная настройка');
}

$raw = $body['value'] ?? null;
if ($raw !== null && !is_string($raw) && !is_int($raw) && !is_float($raw)) {
    fail(422, 'Некорректное значение');
}
$value = $raw === null ? '' : trim(str_replace(',', '.', (string) $raw));

// An empty value brings back the default from the code.
if ($value === '') {
    db()->prepare('DELETE FROM site_settings WHERE name = ?')->execute([$name]);
    respond(200, ['ok' => true, 'name' => $name, 'value' => null]);
}

$rule = TERMS[$name];
if ($rule[0] === 'word') {
    if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9 .\-]{0,15}$/', $value)) {
        fail(422, 'Допустимы латинские буквы, цифры, пробел, точка и дефис, до 16 знаков');
    }
} else {
    $pattern = $rule[0] === 'integer' ? '/^\d{1,7}$/' : '/^\d{1,3}(\.\d{1,2})?$/';
    if (!preg_match($pattern, $value) || (float) $value < $rule[1] || (float) $value > $rule[2]) {
        fail(422, 'Число должно быть от ' . $rule[1] . ' до ' . $rule[2]);
    }
    // 50.0 and 50 are the same value.
    $value = (string) ($rule[0] === 'integer' ? (int) $value : (float) $value);
}

db()->prepare(
    'INSERT INTO site_settings (name, value, updated_by) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)'
)->execute([$name, $value, $user['id']]);

respond(200, ['ok' => true, 'name' => $name, 'value' => $value]);
