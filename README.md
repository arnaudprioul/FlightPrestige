# FlightPrestige ✈️

> Detect anomalously low business class flight prices and get notified before they disappear.

## Overview

FlightPrestige monitors flight prices across multiple providers, computes statistical baselines, and alerts you only when a business class deal is significantly cheaper than typical economy fares — **Signal > Noise**.

## Deal Levels

| Level | Condition |
|-------|-----------|
| **INSANE** | Business price ≤ Economy avg × 1.2 |
| **GOOD** | Business price ≤ Economy avg × 1.5 |

## Architecture

```
frontend/     Vue 3 + Vite + Tauri 2 (macOS desktop app)
backend/      Fastify + BullMQ + PostgreSQL + Redis (API + workers)
widget/       Swift macOS widget (WidgetKit)
infra/        Docker Compose + PostgreSQL migrations
```

## Quick Start

### Prerequisites
- Node.js 20+
- Rust (for Tauri)
- Docker + Docker Compose

### Start infrastructure
```bash
docker compose up -d
```

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # web only → http://localhost:1420
npm run tauri dev    # macOS app
```

## Environment Variables

See `backend/.env.example` for required variables:
- `AMADEUS_API_KEY` / `AMADEUS_API_SECRET`
- `KIWI_API_KEY`
- `RESEND_API_KEY`
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`
- `DATABASE_URL`
- `REDIS_URL`

## Data Sources

- **Amadeus** — primary flight data
- **Kiwi Tequila** — secondary / validation

## Notification Channels

- Email via [Resend](https://resend.com)
- SMS via [Twilio](https://twilio.com)
