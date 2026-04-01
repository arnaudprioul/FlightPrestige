-- FlightPrestige — Initial Schema
-- Run: npm run migrate (from backend/)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT,
  notify_email    BOOLEAN NOT NULL DEFAULT true,
  notify_sms      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Routes (monitored city pairs)
-- ============================================================
CREATE TABLE IF NOT EXISTS routes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin          CHAR(3) NOT NULL,           -- IATA airport code
  destination     CHAR(3) NOT NULL,           -- IATA airport code
  flexible_dates  BOOLEAN NOT NULL DEFAULT false,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT routes_unique_per_user UNIQUE (user_id, origin, destination)
);

CREATE INDEX IF NOT EXISTS idx_routes_user_active ON routes (user_id, active);

-- ============================================================
-- Prices (raw price snapshots from providers)
-- ============================================================
CREATE TYPE cabin_class AS ENUM ('economy', 'business');

CREATE TABLE IF NOT EXISTS prices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin           CHAR(3) NOT NULL,
  destination      CHAR(3) NOT NULL,
  departure_date   DATE NOT NULL,
  return_date      DATE,
  class            cabin_class NOT NULL,
  price            NUMERIC(10, 2) NOT NULL,
  currency         CHAR(3) NOT NULL DEFAULT 'EUR',
  airline          VARCHAR(10) NOT NULL,
  stops            SMALLINT NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL,
  raw_payload      JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prices_route_class_date
  ON prices (origin, destination, class, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prices_economy_baseline
  ON prices (origin, destination, created_at)
  WHERE class = 'economy';

-- ============================================================
-- Alerts (detected deals)
-- ============================================================
CREATE TYPE alert_level AS ENUM ('INSANE', 'GOOD');

CREATE TABLE IF NOT EXISTS alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id    UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  price_id    UUID NOT NULL REFERENCES prices(id),
  score       NUMERIC(4, 3) NOT NULL,          -- 0.000–1.000
  level       alert_level NOT NULL,
  sent_at     TIMESTAMPTZ,                      -- NULL = not yet sent
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_route_recent
  ON alerts (route_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_unsent
  ON alerts (route_id, sent_at)
  WHERE sent_at IS NULL;
