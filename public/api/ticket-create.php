<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_telegram.php';

$body = read_json_body();
$user = require_user();
$pdo = db();

$subject = trim((string) ($body['subject'] ?? ''));
$text = trim((string) ($body['body'] ?? ''));
if ($subject === '' || mb_strlen($subject) > 200) {
    fail(422, 'Тема — от 1 до 200 символов');
}
if ($text === '' || mb_strlen($text) > 5000) {
    fail(422, 'Сообщение — от 1 до 5000 символов');
}

$stmt = $pdo->prepare('SELECT COUNT(*) FROM tickets WHERE user_id = ? AND created_at > NOW() - INTERVAL 1 HOUR');
$stmt->execute([$user['id']]);
if ((int) $stmt->fetchColumn() >= 5) {
    fail(429, 'Слишком много обращений. Попробуйте позже');
}

$pdo->beginTransaction();
$pdo->prepare('INSERT INTO tickets (user_id, subject) VALUES (?, ?)')->execute([$user['id'], $subject]);
$ticketId = (int) $pdo->lastInsertId();
$pdo->prepare('INSERT INTO ticket_messages (ticket_id, author, body) VALUES (?, \'user\', ?)')->execute([$ticketId, $text]);
$messageId = (int) $pdo->lastInsertId();
$pdo->commit();

// Pass the ticket to the support chat: one topic per client, one message per ticket. Staff answer by
// replying to that message. The ticket is already saved, so a Telegram outage loses nothing.
if (telegram_configured()) {
    $c = config();
    $chatId = $c['tg_chat_id'];
    $threadId = null;
    if (!empty($c['tg_forum'])) {
        $stmt = $pdo->prepare('SELECT tg_thread_id FROM tickets WHERE user_id = ? AND tg_thread_id IS NOT NULL ORDER BY id DESC LIMIT 1');
        $stmt->execute([$user['id']]);
        $threadId = $stmt->fetchColumn() ?: null;
        if ($threadId === null) {
            $topic = telegram_call('createForumTopic', [
                'chat_id' => $chatId,
                'name' => mb_substr("{$user['name']} (ID {$user['id']})", 0, 128),
            ]);
            $threadId = $topic['message_thread_id'] ?? null;
        }
    }

    $params = [
        'chat_id' => $chatId,
        'text' => telegram_text(
            "Заявка #$ticketId\n"
            . "От: {$user['name']} (ID {$user['id']}), {$user['email']}, {$user['telegram']}\n"
            . "Тема: $subject\n\n$text"
            . "\n\nОтветьте реплаем на это сообщение: ответ уйдёт пользователю на сайт и на почту. /close реплаем — закрыть заявку."
        ),
    ];
    if ($threadId !== null) {
        $params['message_thread_id'] = $threadId;
    }
    $sent = telegram_call('sendMessage', $params);
    if ($sent !== null) {
        $pdo->prepare('UPDATE tickets SET tg_thread_id = ?, tg_sent = 1 WHERE id = ?')->execute([$threadId, $ticketId]);
        $pdo->prepare('UPDATE ticket_messages SET tg_message_id = ? WHERE id = ?')->execute([$sent['message_id'] ?? null, $messageId]);
    }
}

respond(201, ['ok' => true, 'id' => $ticketId]);
