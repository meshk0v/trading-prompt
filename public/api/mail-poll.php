<?php
// Reads new emails from the support mailbox and turns replies to ticket emails into ticket messages.
// Run from the command line every minute (Plesk → Scheduled Tasks); the web server refuses it.

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_telegram.php';
require __DIR__ . '/_mail.php';
require __DIR__ . '/_tickets.php';
require __DIR__ . '/_imap.php';

const MAIL_POLL_BATCH = 30;

$c = config();
$smtp = is_array($c['smtp'] ?? null) ? $c['smtp'] : [];
$imap = (is_array($c['imap'] ?? null) ? $c['imap'] : []) + [
    'host' => $smtp['host'] ?? '',
    'port' => 993,
    'secure' => 'ssl',
    'user' => $smtp['user'] ?? '',
    'pass' => $smtp['pass'] ?? '',
];
if ($imap['host'] === '' || $imap['user'] === '' || $imap['pass'] === '') {
    exit(0); // email replies are not configured
}

// One run at a time: a slow run must not be overtaken by the next minute's run.
$lock = fopen(sys_get_temp_dir() . '/tp-mail-poll-' . md5(__DIR__) . '.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
    exit(0);
}

$pdo = db();
$state = static function (string $name) use ($pdo): ?string {
    $stmt = $pdo->prepare('SELECT value FROM mail_state WHERE name = ?');
    $stmt->execute([$name]);
    $value = $stmt->fetchColumn();
    return $value === false ? null : (string) $value;
};
$remember = static function (string $name, string $value) use ($pdo): void {
    $pdo->prepare('INSERT INTO mail_state (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)')->execute([$name, $value]);
};

$client = null;
try {
    $client = new ImapClient($imap);
    $client->login((string) $imap['user'], (string) $imap['pass']);
    $box = $client->select('INBOX');

    // The first run starts after the mail that is already there; so does a mailbox that was rebuilt.
    $last = $state('last_uid');
    if ($last === null || (int) $state('uidvalidity') !== $box['uidvalidity']) {
        $remember('uidvalidity', (string) $box['uidvalidity']);
        $remember('last_uid', (string) ($box['uidnext'] - 1));
        $client->close();
        exit(0);
    }

    $own = mb_strtolower((string) ($smtp['from'] ?? $smtp['user'] ?? ''));
    $link = rtrim((string) ($c['site_url'] ?? 'https://tradingprompt.space'), '/') . '/?support=history';

    foreach (array_slice($client->uidsAfter((int) $last), 0, MAIL_POLL_BATCH) as $uid) {
        $remember('last_uid', (string) $uid); // before processing: a message that breaks us is not retried forever

        [$headers, $body] = mail_split($client->fetch($uid));
        $subject = mail_decode_header($headers['subject'] ?? '');
        if (!preg_match('/\[#(\d{1,9})-([0-9a-f]{8})\]/', $subject, $m) || !hash_equals(ticket_mail_token((int) $m[1]), $m[2])) {
            continue; // not an answer to a ticket email
        }
        $auto = strtolower($headers['auto-submitted'] ?? 'no');
        if (($auto !== 'no' && $auto !== '') || preg_match('/bulk|junk|auto_reply/i', $headers['precedence'] ?? '') || ($own !== '' && strpos(mb_strtolower($headers['from'] ?? ''), $own) !== false)) {
            continue; // out-of-office replies, bounces and our own mail
        }

        $stmt = $pdo->prepare('SELECT t.*, u.name AS user_name, u.email AS user_email FROM tickets t JOIN users u ON u.id = t.user_id WHERE t.id = ?');
        $stmt->execute([(int) $m[1]]);
        $ticket = $stmt->fetch();
        if (!$ticket) {
            continue;
        }

        $text = mb_substr(mail_reply_text(mail_text($headers, $body)), 0, 5000);
        if ($text === '') {
            continue;
        }

        if ($ticket['status'] === 'closed') {
            send_mail(
                (string) $ticket['user_email'],
                'Обращение #' . $ticket['id'] . ' закрыто',
                "Здравствуйте!\n\nОбращение «{$ticket['subject']}» уже закрыто, и ваше письмо к нему не добавлено. Если вопрос остался, создайте новое обращение на сайте: $link\n",
                null,
                ['Auto-Submitted: auto-replied']
            );
            echo "ticket #{$ticket['id']}: closed, reply not added\n";
            continue;
        }
        if (ticket_rate_limited($pdo, (int) $ticket['user_id'])) {
            continue;
        }

        ticket_add_user_message($pdo, $ticket, ['id' => $ticket['user_id'], 'name' => $ticket['user_name']], $text, '(по почте)');
        echo "ticket #{$ticket['id']}: reply by email added\n";
    }
    $client->close();
} catch (Throwable $e) {
    error_log('Mail poll failed: ' . $e->getMessage());
    if ($client) {
        $client->close();
    }
    exit(1);
}
