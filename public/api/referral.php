<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_referral.php';

$user = require_user();
$pdo = db();
$userId = $user['id'];

$stmt = $pdo->prepare('SELECT COUNT(*) FROM referral_links WHERE user_id = ? AND deleted_at IS NULL');
$stmt->execute([$userId]);
if ((int) $stmt->fetchColumn() === 0) {
    create_referral_link($pdo, $userId, 'Стандартная ссылка', true);
}

// One row per link (deleted ones too, so earnings stay visible): clients, paying clients and rewards.
$stmt = $pdo->prepare(
    'SELECT l.id, l.code, l.name, l.is_default, l.deleted_at,
            (SELECT COUNT(*) FROM users u WHERE u.referred_by_link_id = l.id) AS clients,
            (SELECT COUNT(DISTINCT e.referral_id) FROM referral_earnings e WHERE e.link_id = l.id) AS paying,
            (SELECT COALESCE(SUM(e.amount_cents), 0) FROM referral_earnings e WHERE e.link_id = l.id) AS earned
     FROM referral_links l WHERE l.user_id = ? ORDER BY l.id'
);
$stmt->execute([$userId]);
$links = [];
foreach ($stmt->fetchAll() as $row) {
    if ($row['deleted_at'] !== null && (int) $row['clients'] === 0) {
        continue;
    }
    $links[] = [
        'id' => (int) $row['id'],
        'code' => $row['code'],
        'name' => $row['name'],
        'isDefault' => (bool) $row['is_default'],
        'deleted' => $row['deleted_at'] !== null,
        'clients' => (int) $row['clients'],
        'payingClients' => (int) $row['paying'],
        'earnedCents' => (int) $row['earned'],
    ];
}

$stmt = $pdo->prepare(
    'SELECT u.id, u.name, u.email, u.created_at, u.referred_by_link_id AS link_id,
            (SELECT COALESCE(SUM(e.amount_cents), 0) FROM referral_earnings e WHERE e.referral_id = u.id) AS earned,
            (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id) AS payments,
            (SELECT COALESCE(SUM(p.amount_cents), 0) FROM payments p WHERE p.user_id = u.id) AS deposited
     FROM users u JOIN referral_links l ON l.id = u.referred_by_link_id
     WHERE l.user_id = ? ORDER BY u.id DESC LIMIT 200'
);
$stmt->execute([$userId]);
$partners = [];
foreach ($stmt->fetchAll() as $row) {
    $partners[] = [
        'id' => (int) $row['id'],
        'name' => short_name($row['name']),
        'email' => mask_email($row['email']),
        'date' => $row['created_at'],
        'linkId' => (int) $row['link_id'],
        'status' => (int) $row['payments'] > 0 ? 'active' : 'pending',
        'depositedCents' => (int) $row['deposited'],
        'earnedCents' => (int) $row['earned'],
    ];
}

$stmt = $pdo->prepare(
    'SELECT id, amount_cents, fee_cents, wallet, network, status, created_at
     FROM payout_requests WHERE user_id = ? ORDER BY id DESC LIMIT 100'
);
$stmt->execute([$userId]);
$withdrawals = [];
foreach ($stmt->fetchAll() as $row) {
    $withdrawals[] = [
        'id' => (int) $row['id'],
        'date' => $row['created_at'],
        'amountCents' => (int) $row['amount_cents'],
        'feeCents' => (int) $row['fee_cents'],
        'netCents' => (int) $row['amount_cents'] - (int) $row['fee_cents'],
        'wallet' => mask_wallet($row['wallet']),
        'network' => $row['network'],
        'status' => $row['status'],
    ];
}

$stmt = $pdo->prepare('SELECT payout_wallet, payout_network FROM users WHERE id = ?');
$stmt->execute([$userId]);
$walletRow = $stmt->fetch();

respond(200, [
    'ok' => true,
    'links' => $links,
    'partners' => $partners,
    'withdrawals' => $withdrawals,
    'wallet' => $walletRow['payout_wallet'] !== null
        ? ['address' => $walletRow['payout_wallet'], 'network' => $walletRow['payout_network']]
        : null,
    'availableCents' => available_cents($pdo, $userId),
    'terms' => referral_terms(),
]);
