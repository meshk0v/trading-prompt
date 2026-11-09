<?php
// Referral program rules and helpers shared by the endpoints. Money is in cents (USD).
// Compatible with PHP 7.4+.

declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

/** Partner reward, percent of every payment of an invited user. */
const REFERRAL_REWARD_PERCENT = 50;
/** Share of the network fee charged to the partner (the rest is covered by the service). */
const PAYOUT_FEE_SHARE_PERCENT = 50;
const MAX_LINKS_PER_USER = 20;

/** Payout networks: network fee in cents (an estimate until a payment provider is connected) and address format. */
const PAYOUT_NETWORKS = [
    'TRC20' => ['fee' => 170, 'pattern' => '/^T[1-9A-HJ-NP-Za-km-z]{33}$/'],
    'BEP20' => ['fee' => 30, 'pattern' => '/^0x[0-9a-fA-F]{40}$/'],
    'POLYGON' => ['fee' => 10, 'pattern' => '/^0x[0-9a-fA-F]{40}$/'],
    'ERC20' => ['fee' => 500, 'pattern' => '/^0x[0-9a-fA-F]{40}$/'],
];

function referral_terms(): array
{
    $networks = [];
    foreach (PAYOUT_NETWORKS as $id => $network) {
        $networks[] = ['id' => $id, 'feeCents' => $network['fee'], 'partnerFeeCents' => partner_fee_cents($id)];
    }
    return [
        'rewardPercent' => REFERRAL_REWARD_PERCENT,
        'feeSharePercent' => PAYOUT_FEE_SHARE_PERCENT,
        'networks' => $networks,
    ];
}

/** The partner's share of the network fee, rounded up to a cent. */
function partner_fee_cents(string $network): int
{
    return (int) ceil(PAYOUT_NETWORKS[$network]['fee'] * PAYOUT_FEE_SHARE_PERCENT / 100);
}

function new_referral_code(PDO $pdo): string
{
    $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    do {
        $code = '';
        for ($i = 0; $i < 8; $i++) {
            $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        $stmt = $pdo->prepare('SELECT 1 FROM referral_links WHERE code = ?');
        $stmt->execute([$code]);
    } while ($stmt->fetchColumn());
    return $code;
}

function create_referral_link(PDO $pdo, int $userId, string $name, bool $default): void
{
    $pdo->prepare('INSERT INTO referral_links (user_id, code, name, is_default) VALUES (?, ?, ?, ?)')
        ->execute([$userId, new_referral_code($pdo), $name, $default ? 1 : 0]);
}

/** Rewards earned minus payouts requested and not rejected: what the partner can still withdraw. */
function available_cents(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare(
        'SELECT (SELECT COALESCE(SUM(amount_cents), 0) FROM referral_earnings WHERE partner_id = ?)
              - (SELECT COALESCE(SUM(amount_cents), 0) FROM payout_requests WHERE user_id = ? AND status <> \'rejected\')'
    );
    $stmt->execute([$userId, $userId]);
    return (int) $stmt->fetchColumn();
}

/**
 * Pays out everything the partner has earned to their saved wallet, as one payout request.
 * Runs on its own or inside a transaction. Returns the amounts, or a reason why nothing was paid:
 * 'no_wallet', or 'too_small' while the balance does not cover the partner's share of the network fee.
 */
function create_payout(PDO $pdo, int $userId): array
{
    $own = !$pdo->inTransaction();
    if ($own) {
        $pdo->beginTransaction();
    }
    try {
        // Lock the user row so two parallel payments or requests cannot withdraw the same money.
        $stmt = $pdo->prepare('SELECT payout_wallet, payout_network FROM users WHERE id = ? FOR UPDATE');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        $result = ['status' => 'no_wallet'];
        if ($row && $row['payout_wallet'] !== null && isset(PAYOUT_NETWORKS[(string) $row['payout_network']])) {
            $amount = available_cents($pdo, $userId);
            $fee = partner_fee_cents($row['payout_network']);
            if ($amount <= $fee) {
                $result = ['status' => 'too_small', 'feeCents' => $fee];
            } else {
                $pdo->prepare('INSERT INTO payout_requests (user_id, amount_cents, fee_cents, wallet, network) VALUES (?, ?, ?, ?, ?)')
                    ->execute([$userId, $amount, $fee, $row['payout_wallet'], $row['payout_network']]);
                $result = ['status' => 'ok', 'amountCents' => $amount, 'feeCents' => $fee, 'netCents' => $amount - $fee];
            }
        }
        if ($own) {
            $pdo->commit();
        }
        return $result;
    } catch (Throwable $e) {
        if ($own && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

/**
 * Records a successful payment: credits the balance and rewards (and pays out) the partner who invited the user.
 * The payment provider webhook calls this too. Returns the partner reward in cents (0 if none).
 */
function record_payment(PDO $pdo, int $userId, int $amountCents, string $provider): int
{
    $pdo->beginTransaction();
    try {
        $pdo->prepare('INSERT INTO payments (user_id, amount_cents, provider) VALUES (?, ?, ?)')
            ->execute([$userId, $amountCents, $provider]);
        $paymentId = (int) $pdo->lastInsertId();
        $pdo->prepare('UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?')->execute([$amountCents, $userId]);

        $stmt = $pdo->prepare(
            'SELECT l.id AS link_id, l.user_id AS partner_id
             FROM users u JOIN referral_links l ON l.id = u.referred_by_link_id
             WHERE u.id = ?'
        );
        $stmt->execute([$userId]);
        $link = $stmt->fetch();

        $reward = 0;
        if ($link && (int) $link['partner_id'] !== $userId) {
            $reward = intdiv($amountCents * REFERRAL_REWARD_PERCENT, 100);
            if ($reward > 0) {
                $pdo->prepare(
                    'INSERT INTO referral_earnings (partner_id, referral_id, link_id, payment_id, amount_cents) VALUES (?, ?, ?, ?, ?)'
                )->execute([$link['partner_id'], $userId, $link['link_id'], $paymentId, $reward]);
                // The reward goes to the partner's wallet right away (or waits for a wallet / a larger balance).
                create_payout($pdo, (int) $link['partner_id']);
            }
        }
        $pdo->commit();
        return $reward;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function mask_email(string $email): string
{
    $parts = explode('@', $email, 2);
    return mb_substr($parts[0], 0, 3) . '***@' . ($parts[1] ?? '');
}

/** "Александр Петров" becomes "Александр П." so partners do not see full names of strangers. */
function short_name(string $name): string
{
    $words = preg_split('/\s+/u', trim($name)) ?: [];
    if (count($words) < 2) {
        return $words[0] ?? '';
    }
    return $words[0] . ' ' . mb_substr($words[1], 0, 1) . '.';
}

function mask_wallet(string $wallet): string
{
    return mb_substr($wallet, 0, 3) . '···' . mb_substr($wallet, -4);
}
