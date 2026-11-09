# Хостинг и обновление сайта

Сайт уже развёрнут на https://tradingprompt.space (Plesk). Здесь — как он устроен на хостинге
и как выкладывать новые версии.

## Что где лежит

```
tradingprompt.space/
├── tp-config.php   ← доступ к базе (имя, пользователь, пароль); не трогать, в репозиторий не попадает
└── httpdocs/       ← файлы сайта = содержимое dist/
    ├── index.html
    ├── assets/     ← JS, CSS, флаги
    ├── images/
    └── api/        ← PHP-обработчики
```

- База данных: `tradinx_prompt`, пользователь `tradinx_app` (MySQL/MariaDB, управляется через phpMyAdmin).
- PHP 7.4+ с PDO. HTTPS — Let's Encrypt, cookie сессии передаётся только по HTTPS.

## Обновление сайта

1. **Миграции.** Если с прошлого обновления в `database/migrations/` появился новый файл —
   сначала импортировать его в phpMyAdmin (база `tradinx_prompt` → Импорт). Только потом заливать
   файлы: новый код может обращаться к новым столбцам. Каждая миграция применяется один раз; если
   не уверены, применена ли она, проверьте таблицу `users` (например, `003` добавляет столбец
   `guide_completed_at`).
2. **Сборка.** `npm ci && npm run build` — без `BASE_PATH`. Упаковать **содержимое** `dist/` в архив
   (`index.html` должен быть в корне архива, а не в папке `dist/`).
3. **Заливка.** В `httpdocs/` удалить `assets`, `images`, `api` и `index.html`, затем распаковать
   архив туда же. `tp-config.php` лежит выше `httpdocs` и не затрагивается.
4. **Проверка.** Открыть сайт, войти в аккаунт. Если браузер показывает старую версию — обновить
   страницу без кеша.

## API

Все обработчики находятся в `/api/`; изменяющие данные принимают только `POST` с телом в JSON.

| Обработчик           | Тело запроса                                     | Ответ                                                               |
| -------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| `register.php`       | `name, email, telegram, password, termsAccepted` | `{ ok, user }`, сразу выполняет вход                                |
| `login.php`          | `email, password`                                | `{ ok, user }`                                                      |
| `logout.php`         | `{}`                                             | `{ ok }`                                                            |
| `me.php` (GET)       | —                                                | `{ ok, user \| null }`                                              |
| `profile.php`        | `name`                                           | `{ ok, user }`                                                      |
| `password.php`       | `currentPassword, newPassword`                   | `{ ok }`, завершает сессии на других устройствах                    |
| `sessions.php` (GET) | —                                                | `{ ok, sessions }`                                                  |
| `session-revoke.php` | `id`                                             | `{ ok }`                                                            |
| `guide-complete.php` | `{}`                                             | `{ ok, user }`, обучение больше не покажется ни на одном устройстве |
| `referral.php` (GET) | —                                                | `{ ok, links, partners, withdrawals, wallet, availableCents, terms }` — всё для страницы партнёрской программы; стандартная ссылка создаётся при первом открытии |
| `referral-link.php`  | `action: create` + `name`, или `action: delete` + `id` | `{ ok }`; стандартную ссылку удалить нельзя, удалённая ссылка продолжает работать для уже привлечённых |
| `referral-wallet.php`| `address, network`                               | `{ ok }`; адрес проверяется по формату сети (TRC20, ERC20, BEP20, POLYGON) |
| `payout-request.php` | `{}`                                             | `{ ok, amountCents, feeCents, netCents }` — заявка на вывод всей доступной суммы, статус `processing` |
| `payment-demo.php`   | `amount` (доллары)                               | `{ ok, amountCents, partnerRewardCents }` — тестовая оплата; работает только при `'demo_payments' => true` в `tp-config.php` |

Ошибки возвращаются как `{ ok: false, error }` с HTTP-статусом. Вход и смена пароля ограничены 10 неудачными попытками с одного IP за 15 минут.

Сессии хранятся в `user_sessions`: в cookie `tp_session` лежит случайный токен, в базе — только его SHA-256-хеш. Сессия истекает через 30 дней без активности.

## Реферальная программа

Правила лежат в `public/api/_referral.php`: вознаграждение партнёра (`REFERRAL_REWARD_PERCENT`, сейчас 50%),
минимальная сумма вывода (`PAYOUT_MIN_CENTS`, $5), доля комиссии сети, которую платит партнёр
(`PAYOUT_FEE_SHARE_PERCENT`, 50%), и комиссии сетей (`PAYOUT_NETWORKS`, пока оценочные).
Деньги хранятся в центах.

- Ссылка вида `https://tradingprompt.space/?ref=код`: сайт запоминает код в браузере, при регистрации он
  уходит в `register.php`, и пользователь привязывается к партнёру.
- Каждая оплата пользователя проходит через `record_payment()`: пополняет его баланс и создаёт одну
  запись вознаграждения партнёру (`referral_earnings`, `payment_id` уникален, повторное уведомление
  платёжной системы не начислит дважды). Платёжная система должна вызывать эту функцию.
- Вывод: «доступно» = вознаграждения минус заявки на вывод (кроме отклонённых). Заявка создаётся со
  статусом `processing`; выплату пока выполняют вручную и меняют статус в `payout_requests`
  (`completed` или `rejected`, при `rejected` деньги возвращаются в доступные).
- Тестовые оплаты (`payment-demo.php`) включаются ключом `'demo_payments' => true` в `tp-config.php`.
  На рабочем сайте ключа быть не должно.

## Изменения базы данных

Любое изменение структуры базы оформляется двумя правками в одном коммите:

- новый файл `database/migrations/NNN_описание.sql` — для уже работающей базы на хостинге;
- то же изменение в `database/schema.sql` — полная схема для новой установки (например, локальной).

## Локальная разработка

```bash
docker network create tpnet
docker run -d --name tpdb --network tpnet -e MARIADB_ROOT_PASSWORD=root \
  -e MARIADB_DATABASE=tradinx_prompt -e MARIADB_USER=tradinx_app -e MARIADB_PASSWORD=testpass \
  -v "$PWD/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql:ro" mariadb:10.11
```

Раздавать `public/` через PHP с `pdo_mysql` на порту 8090. Рядом положить `tp-config.php`
(шаблон — `database/tp-config.example.php`) на два уровня выше `api/`, с тестовым паролем.
Затем `npm run dev` — Vite проксирует `/api` на `http://localhost:8090`.

## Предпросмотр на GitHub Pages

`.github/workflows/deploy.yml` собирает каждый push в `main` с `BASE_PATH=/<имя-репозитория>` и публикует
`dist/` на GitHub Pages. Pages отдаёт только статические файлы, поэтому PHP API (вход) там не работает.
