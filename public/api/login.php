<?php
require __DIR__ . '/_bootstrap.php';

$body = read_json_body();
$email = mb_strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');

check_attempts();

$pdo = db();
$stmt = $pdo->prepare('SELECT id, name, email, telegram, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    record_failed_attempt();
    fail(401, 'Неверный email или пароль');
}

if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
}

log_in((int) $user['id']);
respond(200, ['ok' => true, 'user' => public_user($user)]);
