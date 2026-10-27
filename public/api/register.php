<?php
require __DIR__ . '/_bootstrap.php';

$body = read_json_body();
$name = trim((string) ($body['name'] ?? ''));
$email = mb_strtolower(trim((string) ($body['email'] ?? '')));
$telegram = trim((string) ($body['telegram'] ?? ''));
$password = (string) ($body['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255) {
    fail(422, 'Укажите корректный email');
}
validate_password($password);
if (!preg_match('/^@[a-zA-Z0-9_]{3,32}$/', $telegram)) {
    fail(422, 'Telegram должен быть в формате @username (минимум 3 символа)');
}
if (empty($body['termsAccepted'])) {
    fail(422, 'Необходимо принять условия платформы');
}
if ($name === '') {
    $name = explode('@', $email)[0];
}
$name = mb_substr($name, 0, 100);

try {
    $stmt = db()->prepare('INSERT INTO users (name, email, telegram, password_hash) VALUES (?, ?, ?, ?)');
    $stmt->execute([$name, $email, $telegram, password_hash($password, PASSWORD_DEFAULT)]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        fail(409, 'Пользователь с таким email уже зарегистрирован');
    }
    throw $e;
}

$id = (int) db()->lastInsertId();
log_in($id);
respond(201, ['ok' => true, 'user' => ['id' => $id, 'name' => $name, 'email' => $email, 'telegram' => $telegram, 'guideCompleted' => false]]);
