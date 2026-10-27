<?php
require __DIR__ . '/_bootstrap.php';

read_json_body();
$user = require_user();

// COALESCE keeps the date of the first completion.
db()->prepare('UPDATE users SET guide_completed_at = COALESCE(guide_completed_at, NOW()) WHERE id = ?')
    ->execute([$user['id']]);

$user['guideCompleted'] = true;
respond(200, ['ok' => true, 'user' => $user]);
