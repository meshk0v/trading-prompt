<?php
require __DIR__ . '/_bootstrap.php';

const AVATAR_SIZE = 256;
const AVATAR_MAX_BYTES = 300 * 1024;

$body = read_json_body();
$user = require_user();

$image = (string) ($body['image'] ?? '');
if (!preg_match('#^data:image/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$#', $image, $match)) {
    fail(422, 'Выберите файл изображения');
}
$raw = base64_decode($match[1], true);
if ($raw === false || $raw === '' || strlen($raw) > AVATAR_MAX_BYTES) {
    fail(422, 'Изображение слишком большое');
}

// Trust the content, not the declared type.
$info = @getimagesizefromstring($raw);
if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
    fail(422, 'Выберите файл JPG, PNG или WEBP');
}
if ($info[0] < 1 || $info[1] < 1 || $info[0] > 2048 || $info[1] > 2048) {
    fail(422, 'Недопустимый размер изображения');
}

if (function_exists('imagecreatefromstring') && function_exists('imagejpeg')) {
    // Redraw the picture as a square JPEG: nothing from the uploaded file survives except pixels.
    $source = @imagecreatefromstring($raw);
    if (!$source) {
        fail(422, 'Не удалось прочитать изображение');
    }
    $side = min($info[0], $info[1]);
    $canvas = imagecreatetruecolor(AVATAR_SIZE, AVATAR_SIZE);
    imagefill($canvas, 0, 0, imagecolorallocate($canvas, 255, 255, 255));
    imagecopyresampled($canvas, $source, 0, 0, intdiv($info[0] - $side, 2), intdiv($info[1] - $side, 2), AVATAR_SIZE, AVATAR_SIZE, $side, $side);
    ob_start();
    imagejpeg($canvas, null, 88);
    $jpeg = (string) ob_get_clean();
} elseif ($info[2] === IMAGETYPE_JPEG) {
    // Without GD only a JPEG that the site has already shrunk is accepted as is.
    if ($info[0] > 512 || $info[1] > 512) {
        fail(422, 'Недопустимый размер изображения');
    }
    $jpeg = $raw;
} else {
    fail(422, 'Выберите файл JPG');
}

$dir = dirname(__DIR__) . '/uploads/avatars';
if (!is_dir($dir)) {
    if (!@mkdir($dir, 0755, true) && !is_dir($dir)) {
        error_log('Avatar directory cannot be created: ' . $dir);
        fail(500, 'Не удалось сохранить фото');
    }
    // Only the pictures written here are ever served from this folder.
    @file_put_contents($dir . '/.htaccess', "<FilesMatch \"^(?!\\d+\\.jpg$)\">\n  Require all denied\n</FilesMatch>\n");
}

$target = "{$dir}/{$user['id']}.jpg";
$temp = $target . '.tmp';
if (@file_put_contents($temp, $jpeg) === false || !@rename($temp, $target)) {
    @unlink($temp);
    error_log('Avatar cannot be written: ' . $target);
    fail(500, 'Не удалось сохранить фото');
}

db()->prepare('UPDATE users SET avatar_version = avatar_version + 1 WHERE id = ?')->execute([$user['id']]);
$stmt = db()->prepare('SELECT avatar_version FROM users WHERE id = ?');
$stmt->execute([$user['id']]);

$user['avatarUrl'] = avatar_url((int) $user['id'], (int) $stmt->fetchColumn());
respond(200, ['ok' => true, 'user' => $user]);
