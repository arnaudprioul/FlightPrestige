# CLAUDE.md — FlightPrestige

## Tech Stack

### packages/frontend — Nuxt 4
- **Nuxt 3/4** (Composition API + `<script setup>`)
- **TypeScript** strict mode
- **Pinia** via `@pinia/nuxt` — stores: user, routes, prices, alerts
- **@nuxtjs/i18n** — i18n, locale saved in `flightprestige_locale` cookie
- **ofetch** — HTTP client (built into Nuxt) via service composables
- **Sass** — global styles in `src/assets/scss/main.scss`
- Dev server on **port 3000**
- `srcDir: 'src/'`

### packages/backend — Express API
- **Express 4** — HTTP API on **port 4000**, prefix `/api/v1`
- **TypeORM 0.3** — ORM with DataSource pattern
- **MySQL 8.4** — primary database (TypeORM `synchronize: true` in dev)
- **jose** — JWT HS256 (httpOnly cookie `auth_token` or Bearer header)
- **bcryptjs** — password hashing (cost 12)
- **helmet + cors + cookie-parser + morgan** — security & middleware
- **express-rate-limit** — 100 req / 15 min
- **swagger-jsdoc + swagger-ui-express** — OpenAPI 3.0 at `/api/v1/docs`
- **node-cron** — scheduler (every 6h, no Redis)
- **tsx** — dev runner with watch mode

### packages/shared — @flightprestige/shared
- TypeScript interfaces: `IUser`, `IRoute`, `IPrice`, `IPriceBaseline`, `IAlert`, `INormalizedFlight`
- Enums: `HTTP_STATUS`, `CABIN_CLASS`, `ALERT_LEVEL`
- Types: `TCabinClass`, `TAlertLevel`, `TPaginatedResponse<T>`

### packages/desktop — Tauri 2
- **Tauri 2** — macOS desktop shell
- `devUrl: http://localhost:3000` (points to Nuxt dev server)

### widget/
- **Swift + WidgetKit** — macOS widget
- Reads from App Group shared defaults (`group.com.flightprestige.shared`)

### Infra
- **Docker Compose** — MySQL + backend
- TypeORM handles schema via `synchronize: true` (no SQL migration files)

## Commands

```bash
# Infrastructure
docker compose up -d            # start MySQL

# Root (monorepo)
npm install                     # install all workspaces
npm run dev                     # start API + frontend + worker

# Backend only
cd packages/backend
cp .env.example .env            # fill in API keys
npm run dev                     # API → http://localhost:4000
npm run worker                  # scheduler worker (separate process)

# Frontend only
cd packages/frontend
npm run dev                     # Nuxt → http://localhost:3000

# Desktop (Tauri)
cd packages/desktop
npm run dev                     # wraps Nuxt dev server
npm run build                   # .app bundle
```

## Project Structure

```
FlightPrestige/
├── docker-compose.yml
├── package.json                  # npm workspaces root
├── packages/
│   ├── shared/                   # @flightprestige/shared
│   │   └── src/
│   │       ├── enums/index.ts
│   │       ├── types/index.ts
│   │       └── interfaces/       # user, route, price, alert
│   ├── backend/                  # Express API (port 4000)
│   │   └── src/
│   │       ├── index.ts          # Express entry point
│   │       ├── configs/          # database.config.ts, swagger.config.ts
│   │       ├── classes/          # api-response.class.ts
│   │       ├── entities/         # *.entity.ts (TypeORM)
│   │       ├── repositories/     # *.repository.ts
│   │       ├── controllers/      # *.controller.ts
│   │       ├── routes/           # *.route.ts (Express Router + JSDoc)
│   │       ├── middlewares/      # auth, error, log
│   │       ├── utils/            # auth.util.ts (JWT sign/verify)
│   │       ├── types/            # express.type.ts (IAuthRequest)
│   │       ├── services/         # amadeus, kiwi, detection, notification
│   │       └── workers/          # scheduler.worker.ts (node-cron)
│   ├── frontend/                 # Nuxt 4 (port 3000)
│   │   ├── nuxt.config.ts
│   │   └── src/
│   │       ├── app.vue
│   │       ├── assets/scss/main.scss      # ALL design tokens
│   │       ├── assets/locales/en.json     # source of truth
│   │       ├── assets/locales/fr.json
│   │       ├── layouts/default.vue, auth.vue
│   │       ├── pages/                     # file-based routing
│   │       ├── stores/                    # *.store.ts
│   │       ├── services/                  # ofetch wrappers (*.service.ts)
│   │       ├── composables/               # use*.ts (auto-imported)
│   │       ├── middleware/auth.ts          # Nuxt route middleware
│   │       └── plugins/error.ts
│   └── desktop/                  # Tauri 2 shell
│       └── src-tauri/
└── widget/FlightPrestigeWidget/  # Swift WidgetKit
```

## CRITICAL RULES

- **Never use raw hex colors in components** — always use CSS variables from `packages/frontend/src/assets/scss/main.scss`
- **i18n** — always use `useI18n()` + `t()` in `<script setup>`, never hardcode strings; locale saved in `flightprestige_locale` cookie
- **i18n locale files** — `en.json` is the source of truth; add keys there first, then mirror in `fr.json`
- **Deal thresholds are in `.env`** — `INSANE_MULTIPLIER=1.2`, `GOOD_MULTIPLIER=1.5`; do not hardcode in logic
- **Detection requires 2 consecutive detections** — see `MIN_CONSECUTIVE_DETECTIONS` env var
- **Alert cooldown** — 24h by default (`ALERT_COOLDOWN_HOURS`); never send duplicate alerts within window
- **Validation rules** — max 2 stops, max 24h duration; reject otherwise even if price qualifies
- **Scheduler worker runs separately** from the API server (`npm run worker` in `packages/backend`)
- **No Redis / No BullMQ** — scheduler uses node-cron + direct async execution; no queue needed
- **TypeORM synchronize** — schema is auto-synced in dev (`DB_SYNC=true`); no SQL migration files
- **Auth** — JWT stored as httpOnly cookie `auth_token`; all `/api/v1` routes except `/auth/register` and `/auth/login` require auth
- **API response wrapper** — always use `ApiResponse` class; never call `res.json()` directly in controllers
- **Repository pattern** — data access goes in `*.repository.ts`; controllers use repositories, not AppDataSource directly (except for `.create()` + `.save()`)
- **Auto-launch (Tauri)** — toggle via `@tauri-apps/plugin-autostart`; always guard with `'__TAURI_INTERNALS__' in window` before calling any Tauri API so the page works in browser too
- **Always update CLAUDE.md** when an important rule or pattern is discovered

## Backend Architecture: Repository → Controller → Route

```
Request → Route (Express Router + Swagger JSDoc)
        → Middleware (auth, rate-limit)
        → Controller (arrow methods, uses ApiResponse)
        → Repository (TypeORM extended repository)
        → Entity (TypeORM @Entity)
```

## API Routes

All routes prefixed with `/api/v1`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register |
| POST | `/auth/login` | — | Login (sets cookie) |
| POST | `/auth/logout` | ✓ | Logout (clears cookie) |
| GET | `/auth/me` | ✓ | Current user (from token) |
| GET | `/user/me` | ✓ | User profile |
| PATCH | `/user/me` | ✓ | Update notifications |
| GET | `/routes` | ✓ | All routes for user |
| POST | `/routes` | ✓ | Create route + trigger check |
| PATCH | `/routes/:id/toggle` | ✓ | Enable/disable route |
| DELETE | `/routes/:id` | ✓ | Delete route |
| GET | `/routes/:id/prices` | ✓ | Price history |
| GET | `/routes/:id/baseline` | ✓ | 30-day economy baseline |
| GET | `/routes/:id/alerts` | ✓ | Alerts for route |
| GET | `/alerts` | ✓ | All alerts for user |
| GET | `/prices` | ✓ | Price query |
| GET | `/api/v1/docs` | — | Swagger UI |

## Design Tokens (`packages/frontend/src/assets/scss/main.scss`)

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
// INSANE: business_price <= economy_avg_30d * INSANE_MULTIPLIER (1.2)
// GOOD:   business_price <= economy_avg_30d * GOOD_MULTIPLIER (1.5)

// Baseline: 30-day rolling window, outliers removed via IQR method
// Requires >= 5 economy data points (>= 3 after IQR filtering)

// DB tables (TypeORM entities): users, routes, prices, alerts
```

## Naming Conventions

### File names

| Layer | Pattern | Examples |
|---|---|---|
| Components | `PascalCase.vue` | `AlertCard.vue`, `RouteCard.vue` |
| Pages | `kebab-case.vue` | `dashboard.vue`, `add-route.vue` |
| Stores | `kebab-case.store.ts` | `alerts.store.ts` |
| Services (frontend) | `kebab-case.service.ts` | `route.service.ts` |
| Services (backend) | `kebab-case.service.ts` | `detection.service.ts` |
| Controllers | `kebab-case.controller.ts` | `route.controller.ts` |
| Repositories | `kebab-case.repository.ts` | `alert.repository.ts` |
| Entities | `kebab-case.entity.ts` | `price.entity.ts` |
| Routes (backend) | `kebab-case.route.ts` | `route.route.ts` |

### Identifiers

- **Interfaces** — prefix `I`: `IAlert`, `IRoute`, `IPrice`
- **Types** — prefix `T`: `TCabinClass`, `TAlertLevel`
- **Enums** — SCREAMING_SNAKE_CASE keys: `HTTP_STATUS.OK`
- **Constants** — SCREAMING_SNAKE_CASE: `INSANE_MULTIPLIER`
- **Composables** — `use` prefix: `useAlertService`, `useRoutesStore`

## Component Conventions

- `<script setup lang="ts">` always
- Business logic in stores/services, not in components
- Animations use CSS transitions only — no JS animation libraries
- All interactive icon-only elements need `aria-label`
- `data-cy="..."` attributes for testable interactive elements
- Nuxt auto-imports: `ref`, `computed`, `useI18n`, `useRouter`, `useRoute`, `definePageMeta`, stores, services
