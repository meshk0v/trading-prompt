<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_referral.php';

$body = read_json_body();
$user = require_user();
$address = trim((string) ($body['address'] ?? ''));
$network = (string) ($body['network'] ?? '');

if (!isset(PAYOUT_NETWORKS[$network])) {
    fail(422, 'Выберите сеть');
}
if (!preg_match(PAYOUT_NETWORKS[$network]['pattern'], $address)) {
    fail(422, 'Адрес кошелька не подходит для выбранной сети');
}

$pdo = db();
$pdo->prepare('UPDATE users SET payout_wallet = ?, payout_network = ? WHERE id = ?')->execute([$address, $network, $user['id']]);

// Rewards earned before the wallet was saved are paid out now.
$payout = create_payout($pdo, $user['id']);
respond(200, ['ok' => true, 'paidOutCents' => $payout['status'] === 'ok' ? $payout['netCents'] : 0]);
