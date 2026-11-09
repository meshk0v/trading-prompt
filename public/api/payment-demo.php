<?php
// Test payment that credits the balance and pays the partner, for trying the referral program
// before a payment system is connected. Switched off unless tp-config.php has 'demo_payments' => true.
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_referral.php';

$body = read_json_body();
$user = require_user();
if ((config()['demo_payments'] ?? false) !== true) {
    fail(403, 'Тестовые платежи отключены');
}

$amount = (float) ($body['amount'] ?? 0);
if ($amount < 1 || $amount > 1000) {
    fail(422, 'Сумма — от $1 до $1000');
}
$cents = (int) round($amount * 100);

$reward = record_payment(db(), $user['id'], $cents, 'demo');
respond(201, ['ok' => true, 'amountCents' => $cents, 'partnerRewardCents' => $reward]);
