<?php
require __DIR__ . '/_bootstrap.php';

respond(200, ['ok' => true, 'user' => current_user()]);
