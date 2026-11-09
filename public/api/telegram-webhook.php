<?php
// Receives Telegram updates (set with setWebhook and a secret_token, see DEPLOY.md). A staff message
// in a ticket's topic (or a reply to the ticket's message) is saved as the answer and emailed to the user.
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_telegram.php';
require __DIR__ . '/_mail.php';

$c = config();
$secret = (string) ($c['tg_webhook_secret'] ?? '');
$given = (string) ($_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN'] ?? '');
if ($secret === '' || !hash_equals($secret, $given)) {
    fail(403, 'Forbidden');
}

$update = json_decode((string) file_get_contents('php://input'), true);
$message = is_array($update) ? ($update['message'] ?? null) : null;
if (!is_array($message) || (string) ($message['chat']['id'] ?? '') !== (string) $c['tg_chat_id'] || !empty($message['from']['is_bot'])) {
    respond(200, ['ok' => true]); // not for us; answer 200 so Telegram does not resend
}
$text = trim((string) ($message['text'] ?? ''));
if ($text === '') {
    respond(200, ['ok' => true]);
}

$pdo = db();
$ticket = null;
if (!empty($message['message_thread_id'])) {
    $stmt = $pdo->prepare('SELECT * FROM tickets WHERE tg_thread_id = ?');
    $stmt->execute([$message['message_thread_id']]);
    $ticket = $stmt->fetch() ?: null;
}
if (!$ticket && !empty($message['reply_to_message']['message_id'])) {
    $stmt = $pdo->prepare('SELECT t.* FROM tickets t JOIN ticket_messages m ON m.ticket_id = t.id WHERE m.tg_message_id = ? LIMIT 1');
    $stmt->execute([$message['reply_to_message']['message_id']]);
    $ticket = $stmt->fetch() ?: null;
}
if (!$ticket) {
    respond(200, ['ok' => true]);
}

$ticketId = (int) $ticket['id'];
$params = ['chat_id' => $c['tg_chat_id']];
if (!empty($message['message_thread_id'])) {
    $params['message_thread_id'] = $message['message_thread_id'];
}

if (preg_match('/^\/close(@\w+)?$/', $text)) {
    $pdo->prepare('UPDATE tickets SET status = \'closed\' WHERE id = ?')->execute([$ticketId]);
    telegram_call('sendMessage', $params + ['text' => "Заявка #$ticketId закрыта."]);
    respond(200, ['ok' => true]);
}
if ($text[0] === '/') {
    respond(200, ['ok' => true]); // other commands are not answers
}

$pdo->prepare('INSERT INTO ticket_messages (ticket_id, author, body, tg_message_id) VALUES (?, \'staff\', ?, ?)')
    ->execute([$ticketId, mb_substr($text, 0, 5000), $message['message_id'] ?? null]);
$pdo->prepare('UPDATE tickets SET status = \'answered\' WHERE id = ?')->execute([$ticketId]);

$stmt = $pdo->prepare('SELECT email FROM users WHERE id = ?');
$stmt->execute([$ticket['user_id']]);
$email = (string) $stmt->fetchColumn();
$mailed = $email !== '' && send_mail(
    $email,
    "Ответ на заявку #$ticketId: " . $ticket['subject'],
    "Здравствуйте!\n\nОтвет службы поддержки Trading Prompt на вашу заявку «{$ticket['subject']}»:\n\n$text\n\n"
    . "Заявка и переписка доступны на сайте: Поддержка и контакты → История запросов.\n"
);
telegram_call('sendMessage', $params + ['text' => $mailed ? "Ответ отправлен: на сайт и на почту." : "Ответ сохранён на сайте (письмо не отправлено)."]);

respond(200, ['ok' => true]);
