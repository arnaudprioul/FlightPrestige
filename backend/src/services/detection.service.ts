import { query } from '../db/index.js'
import type { IAlert, IPrice, IPriceBaseline, TAlertLevel } from '../types/index.js'

const INSANE_MULTIPLIER = parseFloat(process.env.INSANE_MULTIPLIER ?? '1.2')
const GOOD_MULTIPLIER = parseFloat(process.env.GOOD_MULTIPLIER ?? '1.5')
const ALERT_COOLDOWN_HOURS = parseInt(process.env.ALERT_COOLDOWN_HOURS ?? '24')
const MIN_CONSECUTIVE = parseInt(process.env.MIN_CONSECUTIVE_DETECTIONS ?? '2')

export interface IDetectionResult {
  isADeal: boolean
  level: TAlertLevel | null
  score: number
  baseline: IPriceBaseline | null
}

export class DetectionService {
  /**
   * Compute 30-day economy baseline for a route, excluding outliers via IQR.
   */
  async computeBaseline(origin: string, destination: string): Promise<IPriceBaseline | null> {
    const { rows } = await query<{ price: number; currency: string }>(`
      SELECT price, currency
      FROM prices
      WHERE origin = $1
        AND destination = $2
        AND class = 'economy'
        AND created_at >= NOW() - INTERVAL '30 days'
        AND stops <= 2
      ORDER BY price
    `, [origin, destination])

    if (rows.length < 5) return null

    const prices = rows.map(r => r.price)
    const currency = rows[0].currency

    // Remove outliers using IQR
    const sorted = [...prices].sort((a, b) => a - b)
    const q1 = sorted[Math.floor(sorted.length * 0.25)]
    const q3 = sorted[Math.floor(sorted.length * 0.75)]
    const iqr = q3 - q1
    const lower = q1 - 1.5 * iqr
    const upper = q3 + 1.5 * iqr
    const filtered = sorted.filter(p => p >= lower && p <= upper)

    if (filtered.length < 3) return null

    const avg = filtered.reduce((a, b) => a + b, 0) / filtered.length
    const p25 = filtered[Math.floor(filtered.length * 0.25)]
    const p50 = filtered[Math.floor(filtered.length * 0.5)]
    const p75 = filtered[Math.floor(filtered.length * 0.75)]

    return {
      economy_avg_30d: Math.round(avg),
      economy_p25: Math.round(p25),
      economy_p50: Math.round(p50),
      economy_p75: Math.round(p75),
      currency,
      computed_at: new Date().toISOString(),
    }
  }

  /**
   * Evaluate a business class price against the baseline.
   */
  evaluate(businessPrice: number, baseline: IPriceBaseline): IDetectionResult {
    const ratio = businessPrice / baseline.economy_avg_30d
    let level: TAlertLevel | null = null

    if (ratio <= INSANE_MULTIPLIER) {
      level = 'INSANE'
    } else if (ratio <= GOOD_MULTIPLIER) {
      level = 'GOOD'
    }

    // Score: how far below the INSANE threshold (0–1 range, higher = better deal)
    const score = Math.max(0, Math.min(1, (GOOD_MULTIPLIER - ratio) / (GOOD_MULTIPLIER - 0.5)))

    return {
      isADeal: level !== null,
      level,
      score,
      baseline,
    }
  }

  /**
   * Check if there are already MIN_CONSECUTIVE detections for this route
   * within the last 12h (consecutive check requirement).
   */
  async checkConsecutiveDetections(routeId: string): Promise<number> {
    const { rows } = await query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM alerts
      WHERE route_id = $1
        AND created_at >= NOW() - INTERVAL '12 hours'
        AND sent_at IS NULL
    `, [routeId])

    return parseInt(rows[0].count)
  }

  /**
   * Check if an alert was already sent for this route within the cooldown window.
   */
  async isOnCooldown(routeId: string): Promise<boolean> {
    const { rows } = await query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM alerts
      WHERE route_id = $1
        AND sent_at IS NOT NULL
        AND sent_at >= NOW() - INTERVAL '${ALERT_COOLDOWN_HOURS} hours'
    `, [routeId])

    return parseInt(rows[0].count) > 0
  }

  /**
   * Persist a detected deal as an alert (unsent).
   */
  async persistAlert(
    routeId: string,
    priceId: string,
    level: TAlertLevel,
    score: number,
  ): Promise<IAlert> {
    const { rows } = await query<IAlert>(`
      INSERT INTO alerts (id, route_id, price_id, score, level)
      VALUES (gen_random_uuid(), $1, $2, $3, $4)
      RETURNING *
    `, [routeId, priceId, score, level])

    return rows[0]
  }

  /**
   * Full detection pipeline for a route + business price.
   * Returns the created alert if conditions are met, null otherwise.
   */
  async runDetection(
    routeId: string,
    origin: string,
    destination: string,
    businessPrice: IPrice,
  ): Promise<IAlert | null> {
    // 1. Compute baseline
    const baseline = await this.computeBaseline(origin, destination)
    if (!baseline) return null

    // 2. Evaluate
    const result = this.evaluate(businessPrice.price, baseline)
    if (!result.isADeal || !result.level) return null

    // 3. Validation: max 2 stops, reasonable duration
    if (businessPrice.stops > 2) return null
    if (businessPrice.duration_minutes > 1440) return null // > 24h

    // 4. Persist detection attempt
    const alert = await this.persistAlert(routeId, businessPrice.id, result.level, result.score)

    // 5. Check consecutive detections
    const consecutive = await this.checkConsecutiveDetections(routeId)
    if (consecutive < MIN_CONSECUTIVE) return null

    // 6. Check cooldown
    const onCooldown = await this.isOnCooldown(routeId)
    if (onCooldown) return null

    return alert
  }
}

export const detectionService = new DetectionService()
