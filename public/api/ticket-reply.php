<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_telegram.php';

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

$stmt = $pdo->prepare('SELECT COUNT(*) FROM ticket_messages m JOIN tickets t ON t.id = m.ticket_id WHERE t.user_id = ? AND m.author = \'user\' AND m.created_at > NOW() - INTERVAL 1 HOUR');
$stmt->execute([$user['id']]);
if ((int) $stmt->fetchColumn() >= 20) {
    fail(429, 'Слишком много сообщений. Попробуйте позже');
}

$pdo->prepare('INSERT INTO ticket_messages (ticket_id, author, body) VALUES (?, \'user\', ?)')->execute([$ticketId, $text]);
$messageId = (int) $pdo->lastInsertId();
$pdo->prepare('UPDATE tickets SET status = \'open\', updated_at = NOW() WHERE id = ?')->execute([$ticketId]);

// Post it into the ticket's topic as a reply to the latest message of the ticket, so the staff see the
// whole thread. The message is already saved, so a Telegram outage loses nothing.
if (telegram_configured() && $ticket['tg_sent']) {
    $stmt = $pdo->prepare('SELECT tg_message_id FROM ticket_messages WHERE ticket_id = ? AND id < ? AND tg_message_id IS NOT NULL ORDER BY id DESC LIMIT 1');
    $stmt->execute([$ticketId, $messageId]);
    $replyTo = $stmt->fetchColumn();

    $params = [
        'chat_id' => config()['tg_chat_id'],
        'text' => telegram_text(
            "Заявка #$ticketId: новое сообщение от {$user['name']} (ID {$user['id']})\n\n$text"
            . "\n\nОтветьте реплаем на это сообщение. /close реплаем — закрыть заявку."
        ),
    ];
    if ($ticket['tg_thread_id'] !== null) {
        $params['message_thread_id'] = (int) $ticket['tg_thread_id'];
    }
    if ($replyTo) {
        $params['reply_to_message_id'] = (int) $replyTo;
    }
    $sent = telegram_call('sendMessage', $params);
    if ($sent !== null) {
        $pdo->prepare('UPDATE ticket_messages SET tg_message_id = ? WHERE id = ?')->execute([$sent['message_id'] ?? null, $messageId]);
    }
}

respond(201, ['ok' => true]);
