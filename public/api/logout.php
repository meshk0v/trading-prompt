<?php
require __DIR__ . '/_bootstrap.php';

read_json_body();
log_out();

respond(200, ['ok' => true]);
