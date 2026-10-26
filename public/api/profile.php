<?php
require __DIR__ . '/_bootstrap.php';

$body = read_json_body();
$user = require_user();

$name = trim((string) ($body['name'] ?? ''));
if ($name === '') {
    fail(422, 'Имя не может быть пустым');
}
if (mb_strlen($name) > 100) {
    fail(422, 'Имя должно быть не длиннее 100 символов');
}

db()->prepare('UPDATE users SET name = ? WHERE id = ?')->execute([$name, $user['id']]);

$user['name'] = $name;
respond(200, ['ok' => true, 'user' => $user]);
