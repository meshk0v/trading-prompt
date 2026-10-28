<?php
require __DIR__ . '/_bootstrap.php';

const MAX_TEXT_LENGTH = 50000;

$body = read_json_body();
$user = require_admin();

$key = $body['key'] ?? null;
if (!is_string($key) || $key === '' || mb_strlen($key) > MAX_TEXT_LENGTH) {
    fail(422, 'Некорректный текст');
}

/** An empty value means "use the text from the code". */
function text_value($value): ?string
{
    if ($value === null) {
        return null;
    }
    if (!is_string($value)) {
        fail(422, 'Некорректный текст');
    }
    if (mb_strlen($value) > MAX_TEXT_LENGTH) {
        fail(422, 'Текст слишком длинный');
    }
    return trim($value) === '' ? null : $value;
}

$ru = text_value($body['ru'] ?? null);
$en = text_value($body['en'] ?? null);
$hash = hash('sha256', $key);

if ($ru === null && $en === null) {
    db()->prepare('DELETE FROM site_texts WHERE key_hash = ?')->execute([$hash]);
} else {
    db()->prepare(
        'INSERT INTO site_texts (key_hash, text_key, ru, en, updated_by) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE ru = VALUES(ru), en = VALUES(en), updated_by = VALUES(updated_by)'
    )->execute([$hash, $key, $ru, $en, $user['id']]);
}

respond(200, ['ok' => true, 'text' => ['key' => $key, 'ru' => $ru, 'en' => $en]]);
