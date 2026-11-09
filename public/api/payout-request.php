<?php
// Manual payout of the balance that automatic payouts could not send yet (for example, it was
// smaller than the network fee). Normally payouts happen by themselves, see create_payout().
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_referral.php';

read_json_body();
$user = require_user();

$result = create_payout(db(), $user['id']);
if ($result['status'] === 'no_wallet') {
    fail(422, 'Сначала укажите кошелёк для выплат');
}
if ($result['status'] === 'too_small') {
    fail(422, 'Сумма пока меньше комиссии сети ($' . number_format($result['feeCents'] / 100, 2, '.', '') . ')');
}

respond(201, ['ok' => true, 'amountCents' => $result['amountCents'], 'feeCents' => $result['feeCents'], 'netCents' => $result['netCents']]);
