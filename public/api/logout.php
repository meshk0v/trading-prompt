<?php
require __DIR__ . '/_bootstrap.php';

read_json_body();

$_SESSION = [];
$params = session_get_cookie_params();
setcookie(session_name(), '', [
    'expires' => time() - 3600,
    'path' => $params['path'],
    'secure' => $params['secure'],
    'httponly' => $params['httponly'],
    'samesite' => $params['samesite'],
]);
session_destroy();

respond(200, ['ok' => true]);
