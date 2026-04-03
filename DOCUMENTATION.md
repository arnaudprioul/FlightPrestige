# FlightPrestige — Technical Documentation

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Environment Variables](#2-environment-variables)
3. [Running the Stack](#3-running-the-stack)
4. [Backend Architecture](#4-backend-architecture)
5. [API Reference](#5-api-reference)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Desktop App (Tauri 2)](#7-desktop-app-tauri-2)
8. [macOS Widget (WidgetKit)](#8-macos-widget-widgetkit)
9. [Detection & Alert Logic](#9-detection--alert-logic)
10. [Scheduler Worker](#10-scheduler-worker)
11. [Database Schema](#11-database-schema)
12. [Shared Package](#12-shared-package)
13. [Design Tokens](#13-design-tokens)
14. [Naming Conventions](#14-naming-conventions)

---

## 1. Project Structure

```
FlightPrestige/
├── docker-compose.yml          # MySQL 8.4 + backend containers
├── package.json                # npm workspaces root + esbuild override
├── CLAUDE.md                   # AI assistant rules
├── DOCUMENTATION.md            # this file
├── README.md                   # project overview
│
├── packages/
│   ├── shared/                 # @flightprestige/shared
│   │   └── src/
│   │       ├── enums/index.ts  # HTTP_STATUS, CABIN_CLASS, ALERT_LEVEL
│   │       ├── types/index.ts  # TCabinClass, TAlertLevel, TPaginatedResponse
│   │       └── interfaces/     # IUser, IRoute, IPrice, IPriceBaseline, IAlert, INormalizedFlight
│   │
│   ├── backend/                # Express API — port 4000
│   │   └── src/
│   │       ├── index.ts        # Express entry point
│   │       ├── configs/        # database.config.ts, swagger.config.ts
│   │       ├── classes/        # api-response.class.ts
│   │       ├── entities/       # *.entity.ts (TypeORM)
│   │       ├── repositories/   # *.repository.ts
│   │       ├── controllers/    # *.controller.ts
│   │       ├── routes/         # *.route.ts (Express Router + Swagger JSDoc)
│   │       ├── middlewares/    # auth, error, log
│   │       ├── utils/          # auth.util.ts (JWT sign/verify)
│   │       ├── types/          # express.type.ts (IAuthRequest)
│   │       ├── services/       # amadeus, kiwi, detection, notification
│   │       └── workers/        # scheduler.worker.ts (node-cron)
│   │
│   ├── frontend/               # Nuxt 4 — port 3000
│   │   ├── nuxt.config.ts
│   │   └── src/
│   │       ├── app.vue
│   │       ├── assets/scss/main.scss       # ALL design tokens
│   │       ├── assets/locales/en.json      # source of truth for i18n
│   │       ├── assets/locales/fr.json
│   │       ├── layouts/                    # default.vue, auth.vue
│   │       ├── pages/                      # file-based routing
│   │       ├── stores/                     # *.store.ts (Pinia)
│   │       ├── services/                   # *.service.ts (ofetch wrappers)
│   │       ├── composables/                # use*.ts (auto-imported)
│   │       ├── middleware/auth.ts          # Nuxt route guard
│   │       └── plugins/error.ts
│   │
│   └── desktop/                # Tauri 2 macOS shell
│       ├── package.json
│       └── src-tauri/
│           ├── Cargo.toml
│           ├── tauri.conf.json
│           ├── capabilities/main.json
│           └── src/
│               ├── main.rs
│               └── lib.rs
│
└── widget/
    └── FlightPrestigeWidget/   # Swift WidgetKit (Xcode project)
        └── FlightPrestigeWidget.swift
```

---

## 2. Environment Variables

Copy and fill in `packages/backend/.env.example` → `packages/backend/.env`.

| Variable | Required | Description |
|---|---|---|
| `PORT` | no | API port (default `4000`) |
| `NODE_ENV` | no | `development` or `production` |
| `DB_HOST` | yes | MySQL host (`localhost` locally, `mysql` in Docker) |
| `DB_PORT` | no | MySQL port (default `3306`) |
| `DB_NAME` | yes | Database name |
| `DB_USER` | yes | MySQL user |
| `DB_PASSWORD` | yes | MySQL password |
| `DB_SYNC` | no | TypeORM `synchronize` (`true` in dev — auto-creates/alters tables) |
| `JWT_SECRET` | yes | HS256 secret, min 32 chars |
| `JWT_EXPIRES_IN` | no | Token TTL (default `7d`) |
| `COOKIE_SECURE` | no | Set `true` in production (HTTPS only) |
| `AMADEUS_API_KEY` | yes | Amadeus client ID |
| `AMADEUS_API_SECRET` | yes | Amadeus client secret |
| `AMADEUS_BASE_URL` | no | `https://test.api.amadeus.com` (test) or production URL |
| `KIWI_API_KEY` | yes | Kiwi Tequila API key |
| `KIWI_BASE_URL` | no | `https://api.tequila.kiwi.com` |
| `RESEND_API_KEY` | yes | Resend email API key |
| `RESEND_FROM_EMAIL` | no | Sender address (default `alerts@flightprestige.com`) |
| `TWILIO_ACCOUNT_SID` | yes* | Twilio SID (*only if SMS notifications enabled) |
| `TWILIO_AUTH_TOKEN` | yes* | Twilio auth token |
| `TWILIO_FROM_PHONE` | yes* | E.164 format, e.g. `+33600000000` |
| `INSANE_MULTIPLIER` | no | Deal threshold (default `1.2`) |
| `GOOD_MULTIPLIER` | no | Deal threshold (default `1.5`) |
| `ALERT_COOLDOWN_HOURS` | no | Min hours between alerts per route (default `24`) |
| `MIN_CONSECUTIVE_DETECTIONS` | no | Detections required before alert fires (default `2`) |
| `ENABLE_REQUEST_LOGGER` | no | Enable morgan HTTP logging (default `true`) |

---

## 3. Running the Stack

### Local development

```bash
# Start MySQL (required first)
docker compose up -d

# Install all workspace dependencies
npm install

# Start API + Nuxt frontend + scheduler worker in parallel
npm run dev

# Or start each individually:
cd packages/backend  &&  npm run dev       # API on :4000
cd packages/backend  &&  npm run worker    # scheduler (separate process)
cd packages/frontend &&  npm run dev       # Nuxt on :3000
```

### Docker (backend + MySQL only)

```bash
docker compose up -d --build
```

The backend image is built from the repo root. The Dockerfile is at `packages/backend/Dockerfile`.

> The frontend is **not** containerised — run it locally with `npm run dev`.

### Health check

```
GET http://localhost:4000/health
→ { "status": "ok", "timestamp": "..." }
```

---

## 4. Backend Architecture

Request flow:

```
HTTP Request
  → Express Router (route.ts)
  → Middleware (auth, rate-limit)
  → Controller (uses ApiResponse)
  → Repository (TypeORM)
  → Entity (MySQL via TypeORM)
```

### Key rules

- **Never call `res.json()` directly** — always use `ApiResponse.ok(data).send(res)`, etc.
- **Data access goes in repositories** — controllers must not use `AppDataSource` directly except for `.create()` + `.save()`.
- **Auth** — JWT is stored as an httpOnly cookie named `auth_token`. All routes except `/auth/register` and `/auth/login` require it.
- **TypeORM** — schema is auto-synced (`synchronize: true`) in dev. No SQL migration files.
- **Union types** — any `Column` with a `T | null` TypeScript type must declare `type: 'varchar'` (or the appropriate SQL type) explicitly, because `emitDecoratorMetadata` reflects union types as `Object`.

### ApiResponse static methods

```typescript
ApiResponse.ok(data, message?)         // 200
ApiResponse.created(data, message?)    // 201
ApiResponse.noContent()                // 204
ApiResponse.badRequest(error)          // 400
ApiResponse.unauthorized(error?)       // 401
ApiResponse.notFound(error?)           // 404
ApiResponse.conflict(error)            // 409
ApiResponse.internal(error?)           // 500
```

---

## 5. API Reference

All routes are prefixed with `/api/v1`.  
Interactive docs: `http://localhost:4000/api/v1/docs`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Login → sets `auth_token` cookie |
| POST | `/auth/logout` | ✓ | Clear cookie |
| GET | `/auth/me` | ✓ | Decode token → current user |
| GET | `/user/me` | ✓ | Full user profile |
| PATCH | `/user/me` | ✓ | Update email / phone / notification prefs |
| GET | `/routes` | ✓ | All routes for current user |
| POST | `/routes` | ✓ | Create route + immediately trigger price check |
| GET | `/routes/:id` | ✓ | Single route |
| PATCH | `/routes/:id/toggle` | ✓ | Enable or disable monitoring |
| DELETE | `/routes/:id` | ✓ | Delete route |
| GET | `/routes/:id/prices` | ✓ | Price history |
| GET | `/routes/:id/baseline` | ✓ | 30-day economy baseline stats |
| GET | `/routes/:id/alerts` | ✓ | Alerts for a route |
| GET | `/alerts` | ✓ | All alerts for current user |
| GET | `/prices` | ✓ | Price query |

---

## 6. Frontend Architecture

- **Framework**: Nuxt 4, `srcDir: 'src/'`, Composition API + `<script setup lang="ts">`
- **State**: Pinia stores in `src/stores/` — `user.store.ts`, `routes.store.ts`, `prices.store.ts`, `alerts.store.ts`
- **HTTP**: `ofetch` wrappers in `src/services/*.service.ts`
- **i18n**: `@nuxtjs/i18n`, locale cookie `flightprestige_locale`, `en.json` is source of truth
- **Styles**: Sass, all design tokens in `src/assets/scss/main.scss` — never use raw hex in components

### Pages

| Route | File | Layout |
|---|---|---|
| `/` | `index.vue` | auth |
| `/dashboard` | `dashboard.vue` | default |
| `/add-route` | `add-route.vue` | default |
| `/settings` | `settings.vue` | default |

### Component rules

- Business logic lives in stores/services, not in components
- All interactive icon-only elements need `aria-label`
- `data-cy="..."` on every interactive element
- Tauri API calls must be guarded: `'__TAURI_INTERNALS__' in window`

---

## 7. Desktop App (Tauri 2)

The desktop app is a Tauri 2 shell that wraps the Nuxt dev server (or a production build).

### Development

```bash
cd packages/desktop
npm run dev          # starts Tauri pointing to http://localhost:3000
```

Nuxt must be running separately (`npm run dev` in `packages/frontend`).

### Production build

```bash
cd packages/desktop
npm run build        # outputs .app bundle
```

The `.app` is output to `packages/desktop/src-tauri/target/release/bundle/macos/`.

### Auto-launch at login

Managed via `tauri-plugin-autostart` with `MacosLauncher::LaunchAgent`.  
The toggle is in the Settings page of the app. It writes a LaunchAgent plist to `~/Library/LaunchAgents/`.

### Capabilities

Declared in `packages/desktop/src-tauri/capabilities/main.json`:
- `autostart:allow-enable`
- `autostart:allow-disable`
- `autostart:allow-is-enabled`

---

## 8. macOS Widget (WidgetKit)

The widget is a separate Swift/WidgetKit target. It reads data from a shared App Group and displays the latest detected deal on the macOS desktop.

### App Group identifier

```
group.com.flightprestige.shared
```

The main Tauri app writes the latest deal to `UserDefaults` under this App Group key `latestDeal` (JSON-encoded `FlightDeal`). The widget reads the same key every 30 minutes.

### How to build and install the widget

The widget has no Xcode project file in the repo yet — only the Swift source is present. To build it:

**Step 1 — Create the Xcode project**

1. Open Xcode → **File > New > Project**
2. Choose **Widget Extension** (under macOS)
3. Name it `FlightPrestigeWidget`, bundle ID `com.flightprestige.widget`
4. Replace the generated Swift file with `widget/FlightPrestigeWidget/FlightPrestigeWidget.swift`

**Step 2 — Configure the App Group**

1. In Xcode, select the widget target → **Signing & Capabilities**
2. Add the **App Groups** capability
3. Add the group `group.com.flightprestige.shared`

> You need an Apple Developer account (free tier is enough for local use).

**Step 3 — Build and run**

1. Select the widget scheme in Xcode
2. Press **Cmd + R** — Xcode installs the widget extension on your Mac
3. Open Notification Center → scroll to the bottom → click **Edit Widgets**
4. Search for **FlightPrestige** and add the Small or Medium widget to your desktop

### Where to find the widget

After building: right-click your macOS desktop → **Edit Widgets** → search "FlightPrestige".  
Or: open Notification Center (top-right clock) → scroll down → **Edit Widgets**.

### Widget display states

| State | When shown |
|---|---|
| Empty ("No deals yet") | No deal has been written to the App Group yet |
| INSANE badge (orange) | Latest alert is level `INSANE` |
| GOOD badge (yellow) | Latest alert is level `GOOD` |

The widget refreshes every 30 minutes automatically.

### How data flows to the widget

```
Scheduler detects deal
  → backend creates Alert in DB
  → NotificationService sends email/SMS
  → (TODO) Tauri app polls /alerts and writes to UserDefaults(group.com.flightprestige.shared)
  → Widget reads UserDefaults on next timeline refresh
```

> The bridge between the Tauri app and the widget (writing to UserDefaults) needs to be implemented in the frontend settings/store layer.

---

## 9. Detection & Alert Logic

### Baseline computation

- Rolling 30-day window of economy prices for the route
- Outliers removed via the IQR method (Q1 − 1.5×IQR, Q3 + 1.5×IQR)
- Requires ≥ 5 raw data points and ≥ 3 after IQR filtering
- Returns `{ economyAvg30d, sampleSize, priceMin, priceMax }`

### Deal formula

```
INSANE: business_price  ≤  economyAvg30d × INSANE_MULTIPLIER   (default 1.2)
GOOD:   business_price  ≤  economyAvg30d × GOOD_MULTIPLIER     (default 1.5)
```

### Consecutive detection guard

A deal must be detected on **`MIN_CONSECUTIVE_DETECTIONS`** (default 2) consecutive scheduler runs before an `Alert` row is created and notifications are sent. This prevents false positives from momentary data glitches.

### Alert cooldown

Once an alert fires for a route, no new alert is sent for **`ALERT_COOLDOWN_HOURS`** (default 24) hours, regardless of price.

### Flight validation

Flights are rejected before baseline comparison if:
- More than 2 stops
- Total duration > 24 hours

---

## 10. Scheduler Worker

The scheduler runs as a **separate Node.js process** from the API server.

```bash
cd packages/backend
npm run worker
```

- Uses `node-cron` — schedule: every 6 hours (`0 */6 * * *`)
- Scans all `active: true` routes
- For each route, queries Amadeus for economy + business prices on dates 7–30 days out (step 3 days)
- Persists new prices (deduplication by origin/destination/date/cabin/airline)
- Runs detection and conditionally creates alerts + sends notifications
- No Redis, no BullMQ — direct async execution

A single price check can also be triggered immediately via `POST /routes` (on route creation).

---

## 11. Database Schema

Schema is managed by TypeORM with `synchronize: true` in development — no SQL migration files.

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | varchar(255) | unique |
| `password` | varchar | nullable, select: false |
| `phone` | varchar(20) | nullable |
| `notifyEmail` | boolean | default true |
| `notifySms` | boolean | default false |
| `createdAt` | datetime | auto |

### `routes`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `userId` | varchar | FK → users |
| `origin` | varchar(3) | IATA code |
| `destination` | varchar(3) | IATA code |
| `flexibleDates` | boolean | default false |
| `active` | boolean | default true |
| `createdAt` | datetime | auto |

Unique constraint: `(userId, origin, destination)`

### `prices`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `origin` | varchar(3) | |
| `destination` | varchar(3) | |
| `departureDate` | date | |
| `returnDate` | date | nullable |
| `cabinClass` | enum | `economy` / `business` |
| `price` | decimal(10,2) | |
| `currency` | varchar(3) | default `EUR` |
| `airline` | varchar(10) | IATA carrier code |
| `stops` | smallint | |
| `durationMinutes` | int | |
| `rawPayload` | json | nullable |
| `createdAt` | datetime | auto |

Index: `(origin, destination, cabinClass, createdAt)`

### `alerts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `routeId` | varchar | FK → routes |
| `priceId` | varchar | FK → prices |
| `score` | decimal(4,3) | ratio business/economyAvg |
| `level` | enum | `INSANE` / `GOOD` |
| `sentAt` | datetime | nullable |
| `createdAt` | datetime | auto |

Index: `(routeId, createdAt)`

---

## 12. Shared Package

Published internally as `@flightprestige/shared`.

```typescript
// Enums
HTTP_STATUS           // OK = 200, CREATED = 201, etc.
CABIN_CLASS           // ECONOMY = 'economy', BUSINESS = 'business'
ALERT_LEVEL           // INSANE = 'INSANE', GOOD = 'GOOD'

// Types
TCabinClass           // 'economy' | 'business'
TAlertLevel           // 'INSANE' | 'GOOD'
TPaginatedResponse<T> // { data: T[], total: number, page: number, limit: number }

// Interfaces
IUser                 // id, email, phone, notifyEmail, notifySms, createdAt
IRoute                // id, userId, origin, destination, flexibleDates, active, createdAt
IPrice                // id, origin, destination, departureDate, returnDate, cabinClass, price, currency, airline, stops, durationMinutes, createdAt
IPriceBaseline        // origin, destination, economyAvg30d, sampleSize, priceMin, priceMax
IAlert                // id, routeId, priceId, score, level, sentAt, createdAt
INormalizedFlight     // origin, destination, departureDate, returnDate, cabinClass, price, currency, airline, stops, durationMinutes, rawPayload
```

---

## 13. Design Tokens

All tokens are CSS variables defined in `packages/frontend/src/assets/scss/main.scss`.  
**Never use raw hex colors in components.**

| Token | Value | Usage |
|---|---|---|
| `--bg-deep` | `#07070a` | App background |
| `--bg-elevated` | `#17171c` | Sidebar, panels |
| `--bg-card` | `#1e1e26` | Cards |
| `--accent` | `#14b8a6` | Primary CTA, links |
| `--accent-orange` | `#ea580c` | INSANE deal badge |
| `--accent-gold` | `#f59e0b` | GOOD deal badge |
| `--border` | `rgba(255,255,255,0.08)` | All borders |
| `--ease-out` | `cubic-bezier(0.16,1,0.3,1)` | Transitions |

Fonts: **JetBrains Sans** (UI text) + **JetBrains Mono** (prices, IATA codes, numbers)

---

## 14. Naming Conventions

### Files

| Layer | Pattern | Example |
|---|---|---|
| Vue components | `PascalCase.vue` | `AlertCard.vue` |
| Pages | `kebab-case.vue` | `add-route.vue` |
| Pinia stores | `kebab-case.store.ts` | `alerts.store.ts` |
| Frontend services | `kebab-case.service.ts` | `route.service.ts` |
| Backend services | `kebab-case.service.ts` | `detection.service.ts` |
| Controllers | `kebab-case.controller.ts` | `route.controller.ts` |
| Repositories | `kebab-case.repository.ts` | `alert.repository.ts` |
| Entities | `kebab-case.entity.ts` | `price.entity.ts` |
| Routes | `kebab-case.route.ts` | `route.route.ts` |

### Identifiers

| Kind | Convention | Example |
|---|---|---|
| Interfaces | `I` prefix | `IAlert`, `IRoute` |
| Types | `T` prefix | `TCabinClass` |
| Enums | SCREAMING_SNAKE_CASE keys | `HTTP_STATUS.OK` |
| Constants | SCREAMING_SNAKE_CASE | `INSANE_MULTIPLIER` |
| Composables | `use` prefix | `useAlertService` |
