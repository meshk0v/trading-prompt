<?php
// Shared setup for every API endpoint: config, database, session, JSON helpers.
// Compatible with PHP 7.4+.

declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const SESSION_LIFETIME = 60 * 60 * 24 * 30;

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

function start_session(): void
{
    $https = ($_SERVER['HTTPS'] ?? '') !== '' && $_SERVER['HTTPS'] !== 'off';
    ini_set('session.gc_maxlifetime', (string) SESSION_LIFETIME);
    ini_set('session.use_strict_mode', '1');
    session_name('tp_session');
    session_set_cookie_params([
        'lifetime' => SESSION_LIFETIME,
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
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
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    $stmt = db()->prepare('SELECT id, name, email, telegram FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $row = $stmt->fetch();
    return $row ? public_user($row) : null;
}

function log_in(int $userId): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
}

start_session();
