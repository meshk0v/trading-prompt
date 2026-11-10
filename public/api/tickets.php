<?php
require __DIR__ . '/_bootstrap.php';

$user = require_user();
$pdo = db();

$stmt = $pdo->prepare('SELECT id, subject, status, created_at, seen_message_id FROM tickets WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 100');
$stmt->execute([$user['id']]);
$tickets = $stmt->fetchAll();

$messages = [];
$lastStaffId = [];
if ($tickets) {
    $ids = array_map('intval', array_column($tickets, 'id'));
    $stmt = $pdo->query(
        'SELECT id, ticket_id, author, body, created_at FROM ticket_messages WHERE ticket_id IN (' . implode(',', $ids) . ') ORDER BY id'
    );
    foreach ($stmt->fetchAll() as $row) {
        $messages[(int) $row['ticket_id']][] = ['author' => $row['author'], 'body' => $row['body'], 'date' => $row['created_at']];
        if ($row['author'] === 'staff') {
            $lastStaffId[(int) $row['ticket_id']] = (int) $row['id'];
        }
    }
}

$out = [];
$unread = 0;
foreach ($tickets as $ticket) {
    $id = (int) $ticket['id'];
    $isUnread = ($lastStaffId[$id] ?? 0) > (int) $ticket['seen_message_id'];
    $unread += $isUnread ? 1 : 0;
    $out[] = [
        'id' => $id,
        'subject' => $ticket['subject'],
        'status' => $ticket['status'],
        'date' => $ticket['created_at'],
        'unread' => $isUnread,
        'messages' => $messages[$id] ?? [],
    ];
}

respond(200, ['ok' => true, 'unread' => $unread, 'tickets' => $out]);
