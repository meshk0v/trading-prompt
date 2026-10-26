<?php
require __DIR__ . '/_bootstrap.php';

$user = require_user();
$currentId = current_session()['id'];

function describe_device(string $ua): string
{
    $browsers = [
        'YaBrowser' => 'Яндекс Браузер',
        'Edg' => 'Edge',
        'OPR' => 'Opera',
        'Firefox' => 'Firefox',
        'Chrome' => 'Chrome',
        'Safari' => 'Safari',
    ];
    $systems = [
        'iPhone' => 'iPhone',
        'iPad' => 'iPad',
        'Android' => 'Android',
        'Windows' => 'Windows',
        'Mac OS X' => 'macOS',
        'Linux' => 'Linux',
    ];

    $browser = 'Браузер';
    foreach ($browsers as $needle => $label) {
        if (strpos($ua, $needle) !== false) {
            $browser = $label;
            break;
        }
    }
    $system = 'неизвестное устройство';
    foreach ($systems as $needle => $label) {
        if (strpos($ua, $needle) !== false) {
            $system = $label;
            break;
        }
    }
    return "$browser · $system";
}

$stmt = db()->prepare(
    'SELECT id, user_agent, ip, TIMESTAMPDIFF(SECOND, last_seen_at, NOW()) AS idle
     FROM user_sessions
     WHERE user_id = ? AND last_seen_at > NOW() - INTERVAL ' . SESSION_LIFETIME_DAYS . ' DAY
     ORDER BY last_seen_at DESC'
);
$stmt->execute([$user['id']]);

$sessions = [];
foreach ($stmt->fetchAll() as $row) {
    $isCurrent = (int) $row['id'] === $currentId;
    $sessions[] = [
        'id' => (int) $row['id'],
        'device' => describe_device($row['user_agent']),
        'ip' => $row['ip'],
        'secondsAgo' => $isCurrent ? 0 : max(0, (int) $row['idle']),
        'current' => $isCurrent,
    ];
}

// Current session first.
usort($sessions, function (array $a, array $b): int {
    return (int) $b['current'] - (int) $a['current'];
});

respond(200, ['ok' => true, 'sessions' => $sessions]);
