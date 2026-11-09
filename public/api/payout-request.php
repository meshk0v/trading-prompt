<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_referral.php';

read_json_body();
$user = require_user();
$pdo = db();

$pdo->beginTransaction();
try {
    // Lock the user row so two parallel requests cannot withdraw the same money.
    $stmt = $pdo->prepare('SELECT payout_wallet, payout_network FROM users WHERE id = ? FOR UPDATE');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();
    if ($row['payout_wallet'] === null || !isset(PAYOUT_NETWORKS[(string) $row['payout_network']])) {
        $pdo->rollBack();
        fail(422, 'Сначала укажите кошелёк для выплат');
    }

    $amount = available_cents($pdo, $user['id']);
    $fee = partner_fee_cents($row['payout_network']);
    if ($amount < PAYOUT_MIN_CENTS || $amount <= $fee) {
        $pdo->rollBack();
        fail(422, 'Минимальная сумма вывода — $' . number_format(PAYOUT_MIN_CENTS / 100, 2, '.', ''));
    }

    $pdo->prepare('INSERT INTO payout_requests (user_id, amount_cents, fee_cents, wallet, network) VALUES (?, ?, ?, ?, ?)')
        ->execute([$user['id'], $amount, $fee, $row['payout_wallet'], $row['payout_network']]);
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $e;
}

respond(201, ['ok' => true, 'amountCents' => $amount, 'feeCents' => $fee, 'netCents' => $amount - $fee]);
