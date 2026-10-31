<?php
require __DIR__ . '/_bootstrap.php';

// Texts and affiliate terms changed by administrators. Public: every visitor needs them to render the site.
$rows = db()->query('SELECT text_key, ru, en FROM site_texts ORDER BY updated_at')->fetchAll();

$texts = array_map(
    static function (array $row): array {
        return ['key' => $row['text_key'], 'ru' => $row['ru'], 'en' => $row['en']];
    },
    $rows
);

// The settings table appears with migration 006; before it is imported the site uses the defaults from the code.
try {
    $terms = db()->query('SELECT name, value FROM site_settings')->fetchAll(PDO::FETCH_KEY_PAIR);
} catch (PDOException $e) {
    $terms = [];
}

respond(200, ['ok' => true, 'texts' => $texts, 'terms' => (object) $terms]);
