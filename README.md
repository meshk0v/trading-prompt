# Trading Prompt

Сборщик промптов для ИИ для трейдеров. Пользователь выбирает инструмент, до трёх таймфреймов и глубину
истории, при желании добавляет свою задачу — сервис собирает структурированный промпт с рыночными данными.
Готовый промпт копируется или скачивается файлом и отправляется в любую нейросеть.

- Сайт: https://tradingprompt.space
- Хостинг, обновление сайта, API и база данных: [DEPLOY.md](DEPLOY.md)

## Как устроен проект

Интерфейс разрабатывается в Figma Make, а его код целиком лежит в `src/` (Tailwind, большие `App.tsx`
и `index.css`, библиотека уровней `tradingLevelsLibrary.js` и загрузка рынка `tradingMarketData.ts`).
Рыночные данные браузер берёт напрямую у Binance и [biquote.io](https://biquote.io/docs/).
Сервера в Figma-коде нет: он добавлен отдельно — PHP + MySQL в `public/api/` и тонкий клиент
`src/api/auth.ts`.

| Что                              | Где                                                          |
| -------------------------------- | ------------------------------------------------------------ |
| Интерфейс, промпт, данные рынка  | `src/` — из Figma, правится в Figma и переносится целиком    |
| Аккаунты, сессии, партнёрская программа | `public/api/*.php`, `src/api/auth.ts`, `src/api/referral.ts`, `src/api/tickets.ts`, `database/` |
| Подключение интерфейса к серверу | `src/App.tsx` (вход, выход, `fetchCurrentUser`), `AuthModal`, `AffiliatePage` и `SupportPage` в `src/appSupport.tsx`, `src/components/AccountSettings.tsx` |

Партнёрская программа (ссылки, партнёры, вознаграждения, кошелёк, заявки на вывод) работает на сервере; оплата
пока тестовая (`payment-demo.php`), без платёжной системы. Обращения в поддержку идут в Telegram-группу, ответы
возвращаются на сайт и на почту (см. [DEPLOY.md](DEPLOY.md#поддержка-telegram-и-почта)).

## Стек

- React 19 + TypeScript + Vite 8, Tailwind 4, `flag-icons`, `@debut/indicators`
- Сервер: PHP 7.4+ (PDO) и MySQL/MariaDB — аккаунты и сессии
- Хостинг: Plesk, статические файлы + PHP

## Быстрый старт

Нужен Node 22 (см. `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:8443, запросы /api проксируются на localhost:8090
```

Без PHP-сервера интерфейс работает, кроме входа и регистрации. Как поднять PHP и базу локально —
в [DEPLOY.md](DEPLOY.md#локальная-разработка).

| Команда             | Что делает                                |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Сервер разработки                         |
| `npm run build`     | Проверка типов и сборка в `dist/`         |
| `npm run typecheck` | Только проверка типов                     |
| `npm run lint`      | ESLint (только наш код в `src/api`)       |
| `npm run format`    | Prettier (только наш код в `src/api`)     |

`BASE_PATH` — сборка для подпапки (например, `/trading-prompt` для GitHub Pages), `API_PROXY` — другой
адрес PHP API при разработке. Для хостинга собирать без `BASE_PATH`.

## Обновление кода из Figma

Файлы `src/` (кроме `src/api/`) приходят из Figma Make как есть, поэтому линтер и Prettier их не трогают:
тогда новая выгрузка ложится поверх без лишних различий.

1. В Figma: File → Save local copy (полный файл `.make`).
2. Из `.make` достать `make_repos/*.zip`, собрать из `packs/` git-репозиторий и взять коммит из
   `manifest.json` (`commit_sha`).
3. Заменить `src/` и `public/` (кроме `public/api/`) новой версией, сохранив `src/api/`.
4. Заново применить правки подключения к серверу (таблица выше; они небольшие, см. историю коммитов
   «Connect … to the PHP API»), затем `npx tsc --noEmit` и `npm run build`.

В Figma-коде `tsc` находил несколько ошибок типов (`replaceAll`, `CSSProperties` и т. п.) — они исправлены
минимально, после новой выгрузки могут появиться снова.

## Сервер

`public/api/*.php` при сборке попадает в `dist/api/`. Аккаунты хранятся в MySQL/MariaDB
(`database/schema.sql`), сессии — в базе, браузер получает HTTP-only cookie. Пароль от базы лежит
в `tp-config.php` выше корня сайта и в репозиторий не попадает. Изменения базы оформляются
миграциями в `database/migrations/` и одновременно вносятся в `schema.sql`.

Список обработчиков, устройство хостинга и порядок обновления — в [DEPLOY.md](DEPLOY.md).

## Перед коммитом

```bash
npx tsc --noEmit
npx eslint .
npx prettier --check .
npm run build
```
