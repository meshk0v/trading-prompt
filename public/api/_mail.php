<?php
// Minimal SMTP sender (SSL on 465 or STARTTLS on 587) so the site needs no mail library.
// Compatible with PHP 7.4+.

declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

function mail_configured(): bool
{
    $smtp = config()['smtp'] ?? null;
    return is_array($smtp) && !empty($smtp['host']) && !empty($smtp['user']) && !empty($smtp['pass']);
}

/** Sends a plain-text UTF-8 email. Returns false (and logs) on any failure; callers must not depend on it. */
function send_mail(string $to, string $subject, string $body): bool
{
    if (!mail_configured()) {
        return false;
    }
    $smtp = config()['smtp'];
    $secure = (string) ($smtp['secure'] ?? 'ssl');
    $port = (int) ($smtp['port'] ?? ($secure === 'ssl' ? 465 : 587));
    $from = (string) ($smtp['from'] ?? $smtp['user']);
    $fromName = (string) ($smtp['from_name'] ?? 'Trading Prompt');

    $socket = null;
    try {
        // verify_peer => false only for testing against a local mail sink.
        $context = stream_context_create(
            ($smtp['verify_peer'] ?? true) ? [] : ['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]
        );
        $socket = @stream_socket_client(
            ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $smtp['host'] . ':' . $port,
            $errno,
            $errstr,
            10,
            STREAM_CLIENT_CONNECT,
            $context
        );
        if (!$socket) {
            throw new RuntimeException("connect: $errstr");
        }
        stream_set_timeout($socket, 15);

        $expect = function (array $codes) use ($socket): string {
            $reply = '';
            while (($line = fgets($socket, 1024)) !== false) {
                $reply .= $line;
                if (strlen($line) < 4 || $line[3] === ' ') {
                    break;
                }
            }
            if (!in_array((int) substr($reply, 0, 3), $codes, true)) {
                throw new RuntimeException('SMTP: ' . trim($reply));
            }
            return $reply;
        };
        $send = function (string $line, array $codes) use ($socket, $expect): string {
            fwrite($socket, $line . "\r\n");
            return $expect($codes);
        };

        $expect([220]);
        $send('EHLO tradingprompt', [250]);
        if ($secure === 'tls') {
            $send('STARTTLS', [220]);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('STARTTLS failed');
            }
            $send('EHLO tradingprompt', [250]);
        }
        $send('AUTH LOGIN', [334]);
        $send(base64_encode((string) $smtp['user']), [334]);
        $send(base64_encode((string) $smtp['pass']), [235]);
        $send("MAIL FROM:<$from>", [250]);
        $send("RCPT TO:<$to>", [250, 251]);
        $send('DATA', [354]);

        $encode = static function (string $text): string {
            return '=?UTF-8?B?' . base64_encode($text) . '?=';
        };
        $headers = [
            'Date: ' . date('r'),
            'From: ' . $encode($fromName) . " <$from>",
            "To: <$to>",
            'Subject: ' . $encode($subject),
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . (explode('@', $from)[1] ?? 'localhost') . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
        ];
        $message = implode("\r\n", $headers) . "\r\n\r\n" . chunk_split(base64_encode($body), 76, "\r\n");
        fwrite($socket, $message . "\r\n.\r\n");
        $expect([250]);
        $send('QUIT', [221]);
        fclose($socket);
        return true;
    } catch (Throwable $e) {
        error_log('Mail to user failed: ' . $e->getMessage());
        if (is_resource($socket)) {
            fclose($socket);
        }
        return false;
    }
}
