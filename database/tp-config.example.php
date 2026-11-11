<?php
// Copy to the domain folder ONE LEVEL ABOVE httpdocs as tp-config.php
// (e.g. /var/www/vhosts/tradingprompt.space/tp-config.php), so it is never web-accessible.
return [
    'db_host' => 'localhost',
    'db_name' => 'tradingprompt',
    'db_user' => 'tradingprompt',
    'db_pass' => 'change-me',

    // Support tickets (optional; without these the tickets are only stored on the site).
    // 'tg_bot_token' => '123456:token-from-BotFather',
    // 'tg_chat_id' => '-1001234567890',        // support group
    // 'tg_forum' => true,                      // the group has topics enabled: one topic per ticket
    // 'tg_webhook_secret' => 'long-random-string',
    // Email copy of the answers to the user (optional).
    // 'smtp' => ['host' => 'srv-plesk20.ps.kz', 'port' => 465, 'secure' => 'ssl',
    //            'user' => 'support@tradingprompt.space', 'pass' => 'change-me', 'from_name' => 'Trading Prompt'],

    // Replies by email are read from the same mailbox; only needed when it differs from `smtp`.
    // 'imap' => ['host' => 'srv-plesk20.ps.kz', 'port' => 993, 'secure' => 'ssl', 'user' => 'support@tradingprompt.space', 'pass' => 'change-me'],

    // Test payments for trying the referral program. Never set on the live site.
    // 'demo_payments' => true,
];
