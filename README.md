# Trading Prompt

AI prompt builder for traders: pick an instrument, timeframes and history depth, and the service
assembles a structured prompt with market data that can be pasted into any AI chat.

React 19 + TypeScript + Vite. Plain CSS, no UI framework. Small PHP + MySQL API for accounts.
Deployment is described in [DEPLOY.md](DEPLOY.md).

## Getting started

Requires Node 22 (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:8443, /api is proxied to localhost:8090
```

| Script               | What it does                                             |
| -------------------- | -------------------------------------------------------- |
| `npm run dev`        | Dev server with hot reload                               |
| `npm run build`      | Type check + production build into `dist/`               |
| `npm run preview`    | Serve the production build locally                       |
| `npm run typecheck`  | TypeScript only                                          |
| `npm run lint`       | ESLint                                                   |
| `npm run format`     | Prettier                                                 |
| `npm run i18n:check` | Strings without an English translation, unused entries   |

## Project structure

```
src/
├── main.tsx              entry point: global CSS + I18nProvider + App
├── App.tsx               page state, prompt limit, layout of the main screen
├── navigation.ts         page ids and links shared by the menu and footer
├── types.ts              chat message types
├── api/auth.ts           calls to the PHP API (login, register, profile, sessions)
├── hooks/
│   ├── usePromptBuilder.ts   state of the prompt builder form
│   └── useChat.ts            chat messages and the typing greeting
├── utils/                buildPrompt (prompt text), promptPdf (download), format
├── data/                 static content: instruments, FAQ, legal texts, demo data
├── i18n/                 translations (see below)
├── styles/               reset, design tokens, global element styles
├── components/
│   ├── layout/           AppHeader, MainMenu, PageFooter
│   ├── chat/             chat feed, prompt result, prompt builder panel, mobile settings
│   └── …                 shared pieces: modals, CustomSelect, SectionLayout, guide, icons
└── pages/                one file per page; settings/ holds account, credits and prompt settings
public/api/               PHP endpoints
database/                 schema.sql, migrations, config template
scripts/check-i18n.mjs    translation checker
```

There is no router: `App.tsx` keeps the current page in state, and the chat stays mounted
(hidden) on other pages so the conversation survives navigation.

## Styles

- Every component has a `.css` file next to it with the same name, imported by the component.
  Class names are prefixed with the component (`.prompt-panel`, `.prompt-panel__title`,
  `.prompt-panel--collapsed`); state classes look like `.is-active`.
- `src/styles/tokens.css` holds the whole palette as CSS variables (`--accent`, `--bg`, `--text`,
  `--border` …). Use variables instead of hard-coded colors.
- `src/styles/reset.css` is a browser reset inside `@layer reset`, so any component rule wins over it.
- `src/styles/base.css` styles bare elements: body, form fields, scrollbars (`.scrollable`), animations.
- Inline `style` is only used for values computed at runtime (widths, positions, CSS variables).

## Translations

The interface is written in Russian; English lives in `src/i18n/en.ts`, keyed by the Russian text.

```tsx
const { t, language } = useI18n()
t('Собрать промпт')                       // → "Build prompt" in English
t('Шаг {current} из {total}', { current: 1, total: 5 })
```

- Strings stored in data files are marked with `tr('…')` and translated where they are rendered (`t(item.label)`).
- Long texts that differ by language (legal pages, greetings) are stored as `{ ru, en }` objects.
- After adding or changing text run `npm run i18n:check`: it lists strings that still need an English
  translation and dictionary entries nobody uses any more.

## Backend

`public/api/*.php` (PHP 7.4+, PDO) is copied into `dist/api/` by the build. Accounts live in MySQL/MariaDB
(`database/schema.sql`), sessions are stored in the database and identified by an HTTP-only cookie.
The endpoint list and setup steps are in [DEPLOY.md](DEPLOY.md).

Market data in the generated prompt is currently demo data (`src/data/mockMarketData.ts`).
