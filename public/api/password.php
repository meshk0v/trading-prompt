<?php
require __DIR__ . '/_bootstrap.php';

$body = read_json_body();
$user = require_user();
$currentPassword = (string) ($body['currentPassword'] ?? '');
$newPassword = (string) ($body['newPassword'] ?? '');

check_attempts();

$pdo = db();
$stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
$stmt->execute([$user['id']]);

if (!password_verify($currentPassword, (string) $stmt->fetchColumn())) {
    record_failed_attempt();
    fail(403, 'Текущий пароль указан неверно');
}

validate_password($newPassword);
if ($newPassword === $currentPassword) {
    fail(422, 'Новый пароль совпадает с текущим');
}

$pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    ->execute([password_hash($newPassword, PASSWORD_DEFAULT), $user['id']]);

// Sign out every other device; the current one stays logged in.
$pdo->prepare('DELETE FROM user_sessions WHERE user_id = ? AND id <> ?')
    ->execute([$user['id'], current_session()['id']]);

respond(200, ['ok' => true]);
