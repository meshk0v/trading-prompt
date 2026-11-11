<?php
// Minimal IMAP reader and email parser, so the site needs no mail library or the PHP imap extension.
// Compatible with PHP 7.4+.

declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

final class ImapClient
{
    /** @var resource */
    private $socket;
    private int $tag = 0;

    /** @param array{host:string,port:int,secure:string,verify_peer?:bool} $c */
    public function __construct(array $c)
    {
        $context = stream_context_create(
            ($c['verify_peer'] ?? true) ? [] : ['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]
        );
        $socket = @stream_socket_client(
            ($c['secure'] === 'ssl' ? 'ssl://' : 'tcp://') . $c['host'] . ':' . $c['port'],
            $errno,
            $errstr,
            10,
            STREAM_CLIENT_CONNECT,
            $context
        );
        if (!$socket) {
            throw new RuntimeException("IMAP connect: $errstr");
        }
        stream_set_timeout($socket, 30);
        $this->socket = $socket;
        $greeting = (string) fgets($socket, 2048);
        if (strpos($greeting, '* OK') !== 0) {
            throw new RuntimeException('IMAP greeting: ' . trim($greeting));
        }
    }

    /** Sends a command and returns the untagged data that came before the tagged status. */
    public function command(string $command): string
    {
        $tag = 'a' . ++$this->tag;
        fwrite($this->socket, "$tag $command\r\n");
        $data = '';
        while (true) {
            $line = fgets($this->socket, 8192);
            if ($line === false) {
                throw new RuntimeException('IMAP connection lost');
            }
            if (strpos($line, "$tag ") === 0) {
                if (stripos($line, "$tag OK") !== 0) {
                    throw new RuntimeException('IMAP: ' . trim(preg_replace('/^a\d+ (\S+ )?/', '', $line) ?? $line));
                }
                return $data;
            }
            $data .= $line;
            // A literal ({123} at the end of the line) is followed by exactly that many raw bytes.
            if (preg_match('/\{(\d+)\}\r?\n$/', $line, $m)) {
                $left = (int) $m[1];
                while ($left > 0) {
                    $chunk = fread($this->socket, min($left, 65536));
                    if ($chunk === false || $chunk === '') {
                        throw new RuntimeException('IMAP connection lost');
                    }
                    $data .= $chunk;
                    $left -= strlen($chunk);
                }
            }
        }
    }

    private static function quote(string $value): string
    {
        return '"' . addcslashes($value, "\\\"") . '"';
    }

    public function login(string $user, string $pass): void
    {
        $this->command('LOGIN ' . self::quote($user) . ' ' . self::quote($pass));
    }

    /** @return array{uidvalidity:int,uidnext:int} */
    public function select(string $mailbox): array
    {
        $data = $this->command('SELECT ' . self::quote($mailbox));
        preg_match('/\[UIDVALIDITY (\d+)\]/i', $data, $validity);
        preg_match('/\[UIDNEXT (\d+)\]/i', $data, $next);
        return ['uidvalidity' => (int) ($validity[1] ?? 0), 'uidnext' => (int) ($next[1] ?? 1)];
    }

    /** UIDs of the messages after $lastUid, ascending. */
    public function uidsAfter(int $lastUid): array
    {
        $data = $this->command('UID SEARCH UID ' . ($lastUid + 1) . ':*');
        preg_match_all('/\d+/', (string) preg_replace('/^\* SEARCH/m', '', $data), $m);
        $uids = array_values(array_filter(array_map('intval', $m[0]), static function (int $uid) use ($lastUid): bool {
            return $uid > $lastUid; // "n:*" always includes the last message even when it is older than n
        }));
        sort($uids);
        return $uids;
    }

    /** The beginning of a message, without marking it as read. */
    public function fetch(int $uid, int $maxBytes = 400000): string
    {
        $data = $this->command("UID FETCH $uid (BODY.PEEK[]<0.$maxBytes>)");
        if (!preg_match('/\{(\d+)\}\r?\n/', $data, $m, PREG_OFFSET_CAPTURE)) {
            return '';
        }
        return substr($data, $m[0][1] + strlen($m[0][0]), (int) $m[1][0]);
    }

    public function close(): void
    {
        try {
            $this->command('LOGOUT');
        } catch (Throwable $e) {
            // The server may drop the connection right after BYE.
        }
        if (is_resource($this->socket)) {
            fclose($this->socket);
        }
    }
}

// ── Parsing ─────────────────────────────────────────────────────────────

function mail_decode_header(string $value): string
{
    $value = trim($value);
    if (strpos($value, '=?') === false) {
        return $value;
    }
    $decoded = function_exists('iconv_mime_decode') ? @iconv_mime_decode($value, 2, 'UTF-8') : false;
    return $decoded !== false ? $decoded : (string) mb_decode_mimeheader($value);
}

/** @return array{0: array<string,string>, 1: string} lower-case header map (unfolded) and the raw body */
function mail_split(string $raw): array
{
    $parts = preg_split('/\r?\n\r?\n/', $raw, 2);
    $head = (string) preg_replace('/\r?\n[ \t]+/', ' ', (string) $parts[0]);
    $headers = [];
    foreach (preg_split('/\r?\n/', $head) ?: [] as $line) {
        if (strpos($line, ':') > 0) {
            [$name, $value] = explode(':', $line, 2);
            $name = strtolower(trim($name));
            $headers[$name] = $headers[$name] ?? trim($value);
        }
    }
    return [$headers, $parts[1] ?? ''];
}

function mail_header_param(string $header, string $param): string
{
    if (preg_match('/(?:^|;)\s*' . $param . '\s*=\s*(?:"([^"]*)"|([^\s;]+))/i', $header, $m)) {
        return $m[1] !== '' ? $m[1] : ($m[2] ?? '');
    }
    return '';
}

function mail_decode_body(array $headers, string $body): string
{
    $encoding = strtolower(trim($headers['content-transfer-encoding'] ?? ''));
    if ($encoding === 'base64') {
        $body = (string) base64_decode($body);
    } elseif ($encoding === 'quoted-printable') {
        $body = quoted_printable_decode($body);
    }
    $charset = strtolower(mail_header_param($headers['content-type'] ?? '', 'charset'));
    if ($charset !== '' && $charset !== 'utf-8' && $charset !== 'us-ascii') {
        $converted = @mb_convert_encoding($body, 'UTF-8', $charset);
        if (is_string($converted)) {
            $body = $converted;
        }
    }
    return $body;
}

/** The readable text of a message: text/plain when there is one, otherwise the html without tags. */
function mail_text(array $headers, string $body, int $depth = 0): string
{
    $type = strtolower($headers['content-type'] ?? 'text/plain');
    if (strpos($type, 'multipart/') === 0 && $depth < 5) {
        $boundary = mail_header_param($headers['content-type'] ?? '', 'boundary');
        if ($boundary === '') {
            return '';
        }
        $plain = '';
        $html = '';
        foreach (explode('--' . $boundary, $body) as $i => $part) {
            if ($i === 0 || strpos($part, '--') === 0) {
                continue; // preamble and the closing delimiter
            }
            [$partHeaders, $partBody] = mail_split(ltrim($part, "\r\n"));
            $partType = strtolower($partHeaders['content-type'] ?? 'text/plain');
            if (stripos($partHeaders['content-disposition'] ?? '', 'attachment') === 0) {
                continue;
            }
            $text = mail_text($partHeaders, $partBody, $depth + 1);
            if ($text === '') {
                continue;
            }
            if (strpos($partType, 'text/html') === 0 || strpos($partType, 'multipart/') === 0) {
                $html = $html !== '' ? $html : $text;
            } else {
                $plain = $plain !== '' ? $plain : $text;
            }
        }
        return $plain !== '' ? $plain : $html;
    }
    if (strpos($type, 'text/') !== 0) {
        return '';
    }
    $text = mail_decode_body($headers, $body);
    if (strpos($type, 'text/html') === 0) {
        $text = (string) preg_replace('~<(style|script)\b.*?</\1>~is', '', $text);
        $text = (string) preg_replace('~<br\s*/?>|</(p|div|tr|li|h\d)>~i', "\n", $text);
        $text = html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    return $text;
}

/** Only what the person wrote this time: no quoted history, signature or our own text. */
function mail_reply_text(string $text): string
{
    $lines = explode("\n", str_replace(["\r\n", "\r"], "\n", $text));
    $kept = [];
    foreach ($lines as $i => $line) {
        $plain = trim(ltrim($line, "> \t"));
        if ($plain !== '' && (strpos($plain, MAIL_REPLY_MARKER) !== false || strpos($plain, 'Чтобы ответить, напишите выше') !== false)) {
            break;
        }
        if ($line !== '' && $line[0] === '>') {
            continue;
        }
        $lookahead = $line . ' ' . ($lines[$i + 1] ?? '') . ' ' . ($lines[$i + 2] ?? '');
        if (
            preg_match('/^(-{2,}\s*(Original Message|Исходное сообщение|Пересылаемое сообщение|Forwarded message)|_{5,}\s*$|-- ?$)/iu', trim($line))
            || preg_match('/^(On|Le|Am)\s.{5,200}(wrote|écrit|schrieb):\s*$/isu', trim($lookahead))
            || preg_match('/^(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}|\S+,\s*\d{1,2}\s+\S+\s+\d{4}).{0,200}(пишет|написал(а)?|wrote):\s*$/iu', trim($line))
            || preg_match('/(пишет|написал(а)?):\s*$/iu', trim($line)) && mb_strlen(trim($line)) < 160 && strpos($line, '@') !== false
        ) {
            break;
        }
        $kept[] = rtrim($line);
    }
    return trim(preg_replace("/\n{3,}/", "\n\n", implode("\n", $kept)) ?? '');
}
