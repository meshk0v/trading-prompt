<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_telegram.php';
require __DIR__ . '/_tickets.php';

$body = read_json_body();
$user = require_user();
$pdo = db();

$ticketId = (int) ($body['id'] ?? 0);
$text = trim((string) ($body['body'] ?? ''));
if ($text === '' || mb_strlen($text) > 5000) {
    fail(422, 'Сообщение — от 1 до 5000 символов');
}

$stmt = $pdo->prepare('SELECT * FROM tickets WHERE id = ? AND user_id = ?');
$stmt->execute([$ticketId, $user['id']]);
$ticket = $stmt->fetch();
if (!$ticket) {
    fail(404, 'Обращение не найдено');
}
if ($ticket['status'] === 'closed') {
    fail(409, 'Обращение закрыто. Создайте новое');
}

if (ticket_rate_limited($pdo, (int) $user['id'])) {
    fail(429, 'Слишком много сообщений. Попробуйте позже');
}

ticket_add_user_message($pdo, $ticket, $user, $text);

respond(201, ['ok' => true]);
