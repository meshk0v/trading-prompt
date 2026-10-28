<?php
require __DIR__ . '/_bootstrap.php';

// Texts changed by administrators. Public: every visitor needs them to render the site.
$rows = db()->query('SELECT text_key, ru, en FROM site_texts ORDER BY updated_at')->fetchAll();

$texts = array_map(
    static function (array $row): array {
        return ['key' => $row['text_key'], 'ru' => $row['ru'], 'en' => $row['en']];
    },
    $rows
);

respond(200, ['ok' => true, 'texts' => $texts]);
