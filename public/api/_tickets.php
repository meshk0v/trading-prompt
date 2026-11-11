<?php
// Shared ticket logic: a message from the user (typed on the site or sent by email) goes to the
// ticket and into its Telegram topic. Compatible with PHP 7.4+.

declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

const TICKET_MESSAGES_PER_HOUR = 20;

/** Proof that a reply came from a message we sent: it is part of the subject of every email about the ticket. */
function ticket_mail_token(int $ticketId): string
{
    return substr(hash_hmac('sha256', "ticket-$ticketId", (string) (config()['db_pass'] ?? '')), 0, 8);
}

function ticket_mail_subject(int $ticketId, string $subject): string
{
    return '[#' . $ticketId . '-' . ticket_mail_token($ticketId) . '] ' . $subject;
}

function ticket_rate_limited(PDO $pdo, int $userId): bool
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM ticket_messages m JOIN tickets t ON t.id = m.ticket_id WHERE t.user_id = ? AND m.author = \'user\' AND m.created_at > NOW() - INTERVAL 1 HOUR');
    $stmt->execute([$userId]);
    return (int) $stmt->fetchColumn() >= TICKET_MESSAGES_PER_HOUR;
}

/**
 * Saves a message of the ticket owner, reopens the ticket and posts the message into its topic as a
 * reply to the latest message of the ticket, so the staff see the whole thread. The message is saved
 * first, so a Telegram outage loses nothing. $via names the channel when it is not the site.
 */
function ticket_add_user_message(PDO $pdo, array $ticket, array $user, string $text, string $via = ''): int
{
    $ticketId = (int) $ticket['id'];
    $pdo->prepare('INSERT INTO ticket_messages (ticket_id, author, body) VALUES (?, \'user\', ?)')->execute([$ticketId, $text]);
    $messageId = (int) $pdo->lastInsertId();
    $pdo->prepare('UPDATE tickets SET status = \'open\', updated_at = NOW() WHERE id = ?')->execute([$ticketId]);

    if (telegram_configured() && $ticket['tg_sent']) {
        $stmt = $pdo->prepare('SELECT tg_message_id FROM ticket_messages WHERE ticket_id = ? AND id < ? AND tg_message_id IS NOT NULL ORDER BY id DESC LIMIT 1');
        $stmt->execute([$ticketId, $messageId]);
        $replyTo = $stmt->fetchColumn();

        $params = [
            'chat_id' => config()['tg_chat_id'],
            'text' => telegram_text(
                "Заявка #$ticketId: новое сообщение от {$user['name']} (ID {$user['id']})" . ($via !== '' ? " $via" : '') . "\n\n$text"
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
    return $messageId;
}
