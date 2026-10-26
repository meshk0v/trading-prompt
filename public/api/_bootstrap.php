<?php
// Shared setup for every API endpoint: config, database, sessions, JSON helpers.
// Compatible with PHP 7.4+.

declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const SESSION_COOKIE = 'tp_session';
const SESSION_LIFETIME_DAYS = 30;
const SESSION_TOUCH_INTERVAL = 300;
const MAX_FAILED_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MINUTES = 15;

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(int $status, string $error): void
{
    respond($status, ['ok' => false, 'error' => $error]);
}

function config(): array
{
    static $config = null;
    if ($config === null) {
        // Lives outside the web root: <domain>/tp-config.php next to httpdocs.
        $path = dirname(__DIR__, 2) . '/tp-config.php';
        if (!is_file($path)) {
            fail(500, 'Сервер не настроен');
        }
        $config = require $path;
    }
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = config();
        try {
            $pdo = new PDO(
                "mysql:host={$c['db_host']};dbname={$c['db_name']};charset=utf8mb4",
                $c['db_user'],
                $c['db_pass'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            error_log('DB connection failed: ' . $e->getMessage());
            fail(500, 'База данных недоступна');
        }
    }
    return $pdo;
}

/** Only JSON POST bodies are accepted, which also blocks cross-site form posts. */
function read_json_body(): array
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fail(405, 'Метод не поддерживается');
    }
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
        fail(415, 'Ожидается JSON');
    }
    $data = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($data)) {
        fail(400, 'Некорректный запрос');
    }
    return $data;
}

function client_ip(): string
{
    return substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 45);
}

function validate_password(string $password): void
{
    if (strlen($password) < 6 || strlen($password) > 72) {
        fail(422, 'Пароль должен быть от 6 до 72 символов');
    }
}

// ── Brute-force protection ──────────────────────────────────────────────

function check_attempts(): void
{
    $pdo = db();
    $pdo->exec('DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL ' . ATTEMPT_WINDOW_MINUTES . ' MINUTE');
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ?');
    $stmt->execute([client_ip()]);
    if ((int) $stmt->fetchColumn() >= MAX_FAILED_ATTEMPTS) {
        fail(429, 'Слишком много неудачных попыток. Попробуйте через 15 минут');
    }
}

function record_failed_attempt(): void
{
    db()->prepare('INSERT INTO login_attempts (ip) VALUES (?)')->execute([client_ip()]);
}

// ── Sessions ────────────────────────────────────────────────────────────
// The cookie holds a random token; the database stores only its SHA-256 hash.

function set_session_cookie(string $value, int $expires): void
{
    $https = ($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off';
    setcookie(SESSION_COOKIE, $value, [
        'expires' => $expires,
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function user_agent(): string
{
    return mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);
}

function current_session(): ?array
{
    static $session = false;
    if ($session !== false) {
        return $session;
    }
    $session = null;

    $token = $_COOKIE[SESSION_COOKIE] ?? '';
    if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/', $token)) {
        return null;
    }

    $stmt = db()->prepare(
        'SELECT id, user_id, TIMESTAMPDIFF(SECOND, last_seen_at, NOW()) AS idle
         FROM user_sessions
         WHERE token_hash = ? AND last_seen_at > NOW() - INTERVAL ' . SESSION_LIFETIME_DAYS . ' DAY'
    );
    $stmt->execute([hash('sha256', $token)]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }

    // Sliding expiration, refreshed at most every few minutes.
    if ((int) $row['idle'] > SESSION_TOUCH_INTERVAL) {
        db()->prepare('UPDATE user_sessions SET last_seen_at = NOW(), ip = ?, user_agent = ? WHERE id = ?')
            ->execute([client_ip(), user_agent(), $row['id']]);
        set_session_cookie($token, time() + SESSION_LIFETIME_DAYS * 86400);
    }

    $session = ['id' => (int) $row['id'], 'user_id' => (int) $row['user_id']];
    return $session;
}

function log_in(int $userId): void
{
    $token = bin2hex(random_bytes(32));
    db()->prepare('INSERT INTO user_sessions (user_id, token_hash, user_agent, ip) VALUES (?, ?, ?, ?)')
        ->execute([$userId, hash('sha256', $token), user_agent(), client_ip()]);
    set_session_cookie($token, time() + SESSION_LIFETIME_DAYS * 86400);
}

function log_out(): void
{
    $session = current_session();
    if ($session) {
        db()->prepare('DELETE FROM user_sessions WHERE id = ?')->execute([$session['id']]);
    }
    set_session_cookie('', time() - 3600);
}

// ── Users ───────────────────────────────────────────────────────────────

function public_user(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'telegram' => $row['telegram'],
    ];
}

function current_user(): ?array
{
    $session = current_session();
    if (!$session) {
        return null;
    }
    $stmt = db()->prepare('SELECT id, name, email, telegram FROM users WHERE id = ?');
    $stmt->execute([$session['user_id']]);
    $row = $stmt->fetch();
    return $row ? public_user($row) : null;
}

function require_user(): array
{
    $user = current_user();
    if (!$user) {
        fail(401, 'Войдите в аккаунт');
    }
    return $user;
}
