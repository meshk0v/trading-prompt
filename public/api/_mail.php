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
function send_mail(string $to, string $subject, string $body, ?string $html = null): bool
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
        $boundary = '=_tp_' . bin2hex(random_bytes(8));
        $headers = [
            'Date: ' . date('r'),
            'From: ' . $encode($fromName) . " <$from>",
            "To: <$to>",
            'Subject: ' . $encode($subject),
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . (explode('@', $from)[1] ?? 'localhost') . '>',
            'MIME-Version: 1.0',
            $html === null ? 'Content-Type: text/plain; charset=UTF-8' : "Content-Type: multipart/alternative; boundary=\"$boundary\"",
        ];
        $part = static function (string $type, string $content): string {
            return "Content-Type: $type; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($content), 76, "\r\n");
        };
        if ($html === null) {
            $headers[] = 'Content-Transfer-Encoding: base64';
            $message = implode("\r\n", $headers) . "\r\n\r\n" . chunk_split(base64_encode($body), 76, "\r\n");
        } else {
            $message = implode("\r\n", $headers) . "\r\n\r\n"
                . "--$boundary\r\n" . $part('text/plain', $body)
                . "--$boundary\r\n" . $part('text/html', $html)
                . "--$boundary--\r\n";
        }
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

/** Branded HTML email: a heading, the message as a quote, one button. All values are escaped here. */
function mail_html(string $heading, string $intro, string $quote, string $buttonText, string $url): string
{
    $e = static function (string $v): string {
        return htmlspecialchars($v, ENT_QUOTES, 'UTF-8');
    };
    return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
        . '<body style="margin:0;padding:0;background:#F3F2FA;">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F2FA;padding:28px 12px;"><tr><td align="center">'
        . '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">'
        . '<tr><td style="background:#14121F;padding:20px 28px;color:#FFFFFF;font-size:18px;font-weight:bold;letter-spacing:0.3px;">'
        . 'Trading <span style="color:#A99BFF;">Prompt</span></td></tr>'
        . '<tr><td style="padding:28px 28px 8px;color:#1B1930;">'
        . '<h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#1B1930;">' . $e($heading) . '</h1>'
        . '<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#55536B;">' . $e($intro) . '</p>'
        . '<div style="margin:0 0 24px;padding:14px 16px;background:#F6F5FD;border-left:4px solid #8B7CFF;border-radius:6px;font-size:15px;line-height:1.65;color:#1B1930;white-space:pre-wrap;">' . $e($quote) . '</div>'
        . '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#6D5BF0;border-radius:8px;">'
        . '<a href="' . $e($url) . '" style="display:inline-block;padding:12px 24px;color:#FFFFFF;font-size:14px;font-weight:bold;text-decoration:none;">' . $e($buttonText) . '</a>'
        . '</td></tr></table>'
        . '</td></tr>'
        . '<tr><td style="padding:22px 28px 26px;color:#8A889F;font-size:12px;line-height:1.6;">'
        . 'Вы получили это письмо, потому что создали обращение в поддержку Trading Prompt. Ответить можно на сайте: Поддержка и контакты → История запросов.'
        . '</td></tr></table></td></tr></table></body></html>';
}
