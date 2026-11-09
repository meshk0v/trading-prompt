<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_referral.php';

$body = read_json_body();
$user = require_user();
$pdo = db();
$action = (string) ($body['action'] ?? '');

if ($action === 'create') {
    $name = trim((string) ($body['name'] ?? ''));
    if ($name === '' || mb_strlen($name) > 60) {
        fail(422, 'Название ссылки — от 1 до 60 символов');
    }
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM referral_links WHERE user_id = ? AND deleted_at IS NULL');
    $stmt->execute([$user['id']]);
    if ((int) $stmt->fetchColumn() >= MAX_LINKS_PER_USER) {
        fail(422, 'Достигнут предел числа ссылок');
    }
    create_referral_link($pdo, $user['id'], $name, false);
    respond(201, ['ok' => true]);
}

if ($action === 'delete') {
    $stmt = $pdo->prepare('UPDATE referral_links SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND is_default = 0 AND deleted_at IS NULL');
    $stmt->execute([(int) ($body['id'] ?? 0), $user['id']]);
    if ($stmt->rowCount() === 0) {
        fail(404, 'Ссылка не найдена или её нельзя удалить');
    }
    respond(200, ['ok' => true]);
}

fail(422, 'Неизвестное действие');
