<?php
require __DIR__ . '/_bootstrap.php';

$body = read_json_body();
$user = require_user();
$pdo = db();

// The user opened the ticket: everything answered so far counts as seen.
$pdo->prepare(
    'UPDATE tickets SET seen_message_id = COALESCE((SELECT MAX(id) FROM ticket_messages WHERE ticket_id = tickets.id), 0), updated_at = updated_at
     WHERE id = ? AND user_id = ?'
)->execute([(int) ($body['id'] ?? 0), $user['id']]);

respond(200, ['ok' => true]);
