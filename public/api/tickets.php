<?php
require __DIR__ . '/_bootstrap.php';

$user = require_user();
$pdo = db();

$stmt = $pdo->prepare('SELECT id, subject, status, created_at FROM tickets WHERE user_id = ? ORDER BY id DESC LIMIT 100');
$stmt->execute([$user['id']]);
$tickets = $stmt->fetchAll();

$messages = [];
if ($tickets) {
    $ids = array_map('intval', array_column($tickets, 'id'));
    $stmt = $pdo->query(
        'SELECT ticket_id, author, body, created_at FROM ticket_messages WHERE ticket_id IN (' . implode(',', $ids) . ') ORDER BY id'
    );
    foreach ($stmt->fetchAll() as $row) {
        $messages[(int) $row['ticket_id']][] = ['author' => $row['author'], 'body' => $row['body'], 'date' => $row['created_at']];
    }
}

respond(200, [
    'ok' => true,
    'tickets' => array_map(static function (array $ticket) use ($messages): array {
        return [
            'id' => (int) $ticket['id'],
            'subject' => $ticket['subject'],
            'status' => $ticket['status'],
            'date' => $ticket['created_at'],
            'messages' => $messages[(int) $ticket['id']] ?? [],
        ];
    }, $tickets),
]);
