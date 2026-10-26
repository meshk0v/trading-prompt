<?php
require __DIR__ . '/_bootstrap.php';

$body = read_json_body();
$user = require_user();
$sessionId = (int) ($body['id'] ?? 0);

if ($sessionId === current_session()['id']) {
    fail(422, 'Чтобы завершить текущую сессию, выйдите из аккаунта');
}

db()->prepare('DELETE FROM user_sessions WHERE id = ? AND user_id = ?')->execute([$sessionId, $user['id']]);

respond(200, ['ok' => true]);
