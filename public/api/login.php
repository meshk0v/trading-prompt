<?php
require __DIR__ . '/_bootstrap.php';

const MAX_FAILED_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MINUTES = 15;

$body = read_json_body();
$email = mb_strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');
$ip = $_SERVER['REMOTE_ADDR'] ?? '';

$pdo = db();
$pdo->prepare('DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL ' . ATTEMPT_WINDOW_MINUTES . ' MINUTE')->execute();

$stmt = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ?');
$stmt->execute([$ip]);
if ((int) $stmt->fetchColumn() >= MAX_FAILED_ATTEMPTS) {
    fail(429, 'Слишком много попыток входа. Попробуйте через 15 минут');
}

$stmt = $pdo->prepare('SELECT id, name, email, telegram, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    $pdo->prepare('INSERT INTO login_attempts (ip) VALUES (?)')->execute([$ip]);
    fail(401, 'Неверный email или пароль');
}

if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
}

log_in((int) $user['id']);
respond(200, ['ok' => true, 'user' => public_user($user)]);
