# FlightPrestige ✈️

> Never pay business class prices. Get notified the moment fares drop near economy.

---

FlightPrestige monitors flight routes around the clock and fires an alert the instant a business class ticket falls to a price that's absurdly close to — or even below — typical economy fares. No noise, no newsletters, just a signal that means "book now."

## How it works

Every 6 hours the engine scans your saved routes across Amadeus and Kiwi. It builds a rolling 30-day economy baseline, removes outliers, and compares the cheapest available business seat against it.

| Level | What it means | Condition |
|-------|--------------|-----------|
| **INSANE** | Business ≤ economy avg | price ≤ avg × 1.2 |
| **GOOD** | Business near economy | price ≤ avg × 1.5 |

Alerts are sent by email and/or SMS. A deal must be detected on two consecutive checks before an alert fires — no false alarms from momentary glitches. Each route has a 24-hour cooldown so your inbox stays clean.

## What you get

- **macOS desktop app** — Tauri 2 shell around the Nuxt frontend, launches at login
- **macOS widget** — latest deal visible on your desktop at a glance (WidgetKit)
- **Web interface** — works in any browser too
- **REST API** — fully documented via Swagger at `/api/v1/docs`

## Stack

```
packages/
├── frontend/   Nuxt 4 · Pinia · i18n · Sass
├── backend/    Express 4 · TypeORM · MySQL 8 · JWT · node-cron
├── shared/     TypeScript interfaces & enums
└── desktop/    Tauri 2 (macOS shell)

widget/         Swift · WidgetKit (macOS only)
```

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- Rust (for the desktop app)
- Xcode 15+ (for the widget)

## Quick start

```bash
# 1. Start the database
docker compose up -d

# 2. Install all dependencies
npm install

# 3. Configure the backend
cp packages/backend/.env.example packages/backend/.env
# → fill in API keys (see DOCUMENTATION.md)

# 4. Start everything
npm run dev
```

Web UI → http://localhost:3000  
API docs → http://localhost:4000/api/v1/docs

For the desktop app, the widget, and all technical details see [DOCUMENTATION.md](DOCUMENTATION.md).

## Data sources

- **Amadeus** — primary flight data (free test tier available)
- **Kiwi Tequila** — secondary source & cross-validation

## Notifications

- Email via [Resend](https://resend.com)
- SMS via [Twilio](https://twilio.com)
