# Deploy to tradingprompt.space (Plesk)

The frontend is a static Vite build. Registration and login are handled by a small PHP API
(`public/api/*.php`, PHP 7.4+) backed by MySQL/MariaDB.

## 1. Database

1. Plesk → Databases → Add database: `tradinx_prompt`, user `tradinx_app`, access "local connections only".
2. Open phpMyAdmin for that database → Import → `database/schema.sql`.

## 2. Config (outside the web root)

Copy `database/tp-config.example.php` to the domain folder **next to** `httpdocs`
(not inside it) as `tp-config.php`, and fill in the database name, user and password.

```
tradingprompt.space/
├── tp-config.php   ← secrets, not web-accessible
└── httpdocs/       ← site files
```

## 3. Site files

```bash
npm ci
npm run build
```

Upload the contents of `dist/` into `httpdocs/` (`index.html` must sit directly in `httpdocs`).
`dist/api/` contains the PHP endpoints. Enable Let's Encrypt in Plesk → SSL/TLS so the session cookie is sent over HTTPS only.

## API

All endpoints live under `/api/`, write endpoints accept only `POST` with a JSON body.

| Endpoint        | Body                                                   | Result                  |
| --------------- | ------------------------------------------------------ | ----------------------- |
| `register.php`  | `name, email, telegram, password, termsAccepted`        | `{ ok, user }`, logs in |
| `login.php`     | `email, password`                                       | `{ ok, user }`          |
| `logout.php`    | `{}`                                                    | `{ ok }`                |
| `me.php` (GET)  | —                                                       | `{ ok, user \| null }`  |
| `profile.php`   | `name`                                                  | `{ ok, user }`          |
| `password.php`  | `currentPassword, newPassword`                          | `{ ok }`, signs out other devices |
| `sessions.php` (GET) | —                                                  | `{ ok, sessions }`      |
| `session-revoke.php` | `id`                                               | `{ ok }`                |

Errors return `{ ok: false, error }` with an HTTP status. Login and password change are limited to 10 failed attempts per IP per 15 minutes.

Sessions are stored in `user_sessions`: the `tp_session` cookie holds a random token, the database keeps only its SHA-256 hash. Sessions expire after 30 days without activity.

## Database updates

New installs import `database/schema.sql`. Existing databases apply the files in `database/migrations/` in order (phpMyAdmin → Import).

## Local development

```bash
docker network create tpnet
docker run -d --name tpdb --network tpnet -e MARIADB_ROOT_PASSWORD=root \
  -e MARIADB_DATABASE=tradinx_prompt -e MARIADB_USER=tradinx_app -e MARIADB_PASSWORD=testpass \
  -v "$PWD/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql:ro" mariadb:10.11
```

Serve `public/` with PHP + `pdo_mysql` on port 8090 (with `tp-config.php` two levels above `api/`),
then `npm run dev` — Vite proxies `/api` to `http://localhost:8090`.

## Preview on GitHub Pages

`.github/workflows/deploy.yml` builds every push to `main` with `BASE_PATH=/<repo-name>` and publishes
`dist/` to GitHub Pages. Pages serves static files only, so the PHP API (sign-in) does not work there.
