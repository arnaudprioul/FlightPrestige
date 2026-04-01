# CLAUDE.md — FlightPrestige

## Tech Stack

### Frontend (`frontend/`)
- **Vue 3** (Composition API + `<script setup>`)
- **TypeScript** strict mode
- **Pinia** — state management (stores: user, routes, prices, alerts)
- **Vue Router 4** — hash history (Tauri-compatible)
- **vue-i18n 9** — i18n (legacy: false)
- **Tauri 2** — macOS desktop shell
- **Vite 5** — dev server on port 1420

### Backend (`backend/`)
- **Fastify 4** — HTTP API on port 3000
- **PostgreSQL 16** — primary database
- **Redis 7** — BullMQ job queue
- **BullMQ** — background job queue for price checks
- **node-cron** — scheduler (every 6h)
- **Zod** — request validation
- **tsx** — dev runner with watch mode

### Widget (`widget/`)
- **Swift + WidgetKit** — macOS widget
- Reads from App Group shared defaults (`group.com.flightprestige.shared`)

### Infra
- **Docker Compose** — PostgreSQL + Redis + backend
- SQL migrations: `infra/sql/001_initial.sql`

## Commands

```bash
# Infrastructure
docker compose up -d            # start postgres + redis

# Backend
cd backend
npm install
cp .env.example .env            # fill in API keys
npm run dev                     # API server → http://localhost:3000
npm run worker                  # BullMQ worker (separate process)
npm run migrate                 # apply SQL migrations

# Frontend
cd frontend
npm install
npm run dev                     # web only → http://localhost:1420
npm run tauri dev               # macOS app (requires Rust)
npm run tauri build             # .app bundle
```

## Project Structure

```
FlightPrestige/
├── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── assets/
│   │   │   ├── css/global.css          # ALL design tokens — never raw hex in components
│   │   │   └── locales/
│   │   │       ├── en.json             # source of truth
│   │   │       └── fr.json
│   │   ├── routes/index.route.ts       # Vue Router (hash history)
│   │   ├── plugins/i18n.ts
│   │   ├── types/                      # price.type.ts, route.type.ts, alert.type.ts
│   │   ├── stores/                     # user, routes, prices, alerts
│   │   ├── pages/                      # dashboard.vue, add-route.vue, route-detail.vue
│   │   └── components/
│   │       ├── layout/AppSidebar.vue
│   │       └── ui/AlertCard.vue, RouteCard.vue
│   └── src-tauri/                      # Tauri config (init separately)
├── backend/
│   ├── src/
│   │   ├── server.ts                   # Fastify entry point
│   │   ├── db/index.ts                 # pg Pool
│   │   ├── db/migrate.ts
│   │   ├── types/index.ts              # shared backend types
│   │   ├── routes/                     # routes.ts, alerts.ts, prices.ts, user.ts
│   │   ├── services/
│   │   │   ├── amadeus.service.ts      # Amadeus API adapter
│   │   │   ├── kiwi.service.ts         # Kiwi Tequila adapter
│   │   │   ├── detection.service.ts    # deal detection engine
│   │   │   └── notification.service.ts # Resend + Twilio
│   │   └── workers/scheduler.worker.ts # BullMQ + cron
│   ├── .env.example
│   └── Dockerfile
├── infra/sql/001_initial.sql           # DB schema
└── widget/FlightPrestigeWidget/        # Swift WidgetKit
```

## CRITICAL RULES

- **Never use raw hex colors in components** — always use CSS variables from `frontend/src/assets/css/global.css`
- **i18n** — always use `useI18n()` + `t()` in `<script setup>`, never hardcode strings in templates; locale saved in `flightprestige_locale`
- **i18n locale files** — `en.json` is the source of truth; add keys there first, then mirror in `fr.json`
- **Deal thresholds are in `.env`** — `INSANE_MULTIPLIER=1.2`, `GOOD_MULTIPLIER=1.5`; do not hardcode in logic
- **Detection requires 2 consecutive detections** — see `MIN_CONSECUTIVE_DETECTIONS` env var
- **Alert cooldown** — 24h by default (`ALERT_COOLDOWN_HOURS`); never send duplicate alerts within window
- **Validation rules** — max 2 stops, max 24h duration; reject otherwise even if price qualifies
- **BullMQ worker runs separately** from the API server (`npm run worker`)
- **SQL migrations** — only edit `infra/sql/001_initial.sql` for schema changes; always test with `docker compose down -v && docker compose up -d`
- **Always update CLAUDE.md** when an important rule or pattern is discovered

## Design Tokens (`frontend/src/assets/css/global.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | `#07070a` | App background |
| `--bg-elevated` | `#17171c` | Sidebar, panels |
| `--bg-card` | `#1e1e26` | Cards |
| `--accent` | `#14b8a6` | Primary CTA, links |
| `--accent-orange` | `#ea580c` | INSANE deal badge |
| `--accent-gold` | `#f59e0b` | GOOD deal badge |
| `--border` | `rgba(255,255,255,0.08)` | All borders |
| `--ease-out` | `cubic-bezier(0.16,1,0.3,1)` | Transitions |

Fonts: **JetBrains Sans** (UI) + **JetBrains Mono** (prices, IATA codes)

## Data Model

```ts
// Deal detection formula:
// INSANE: business_price <= economy_avg_30d * 1.2
// GOOD:   business_price <= economy_avg_30d * 1.5

// Baseline: 30-day rolling window, outliers removed via IQR method

// DB tables: users, routes, prices, alerts
// See infra/sql/001_initial.sql for full schema
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/me` | Current user |
| PATCH | `/api/user/me` | Update notifications |
| GET | `/api/routes` | All routes for user |
| POST | `/api/routes` | Create route + enqueue check |
| PATCH | `/api/routes/:id/toggle` | Enable/disable route |
| DELETE | `/api/routes/:id` | Delete route |
| GET | `/api/routes/:id/prices` | Price history |
| GET | `/api/routes/:id/baseline` | 30-day economy baseline |
| GET | `/api/routes/:id/alerts` | Alerts for route |
| GET | `/api/alerts` | All alerts for user |
| GET | `/api/prices` | Price query (origin, destination, class) |

## Naming Conventions

### File names

| Layer | Pattern | Examples |
|---|---|---|
| Components | `PascalCase.vue` | `AlertCard.vue`, `RouteCard.vue` |
| Pages | `kebab-case.vue` | `dashboard.vue`, `add-route.vue` |
| Stores | `kebab-case.store.ts` | `alerts.store.ts` |
| Services (backend) | `kebab-case.service.ts` | `detection.service.ts` |
| Routes (backend) | `kebab-case.ts` | `routes.ts`, `alerts.ts` |
| Types | `kebab-case.type.ts` | `price.type.ts` |

### Identifiers

- **Interfaces** — prefix `I`: `IAlert`, `IRoute`, `IPrice`
- **Types** — prefix `T`: `TCabinClass`, `TAlertLevel`
- **Constants** — SCREAMING_SNAKE_CASE: `INSANE_MULTIPLIER`
- **Composables** — `use` prefix: `useAlerts`, `useRoutes`

## Component Conventions

- `<script setup lang="ts">` always
- Business logic in stores, not in components
- Animations use CSS transitions only — no JS animation libraries
- All interactive icon-only elements need `aria-label`
- `data-cy="..."` attributes for testable interactive elements
