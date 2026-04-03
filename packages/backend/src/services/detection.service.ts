import type { IPriceBaseline, TAlertLevel } from '@flightprestige/shared'
import { PriceRepository } from '../repositories/price.repository'
import { AlertRepository } from '../repositories/alert.repository'
import { Alert } from '../entities/alert.entity'
import { AppDataSource } from '../configs/database.config'
import type { Price } from '../entities/price.entity'

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
  async computeBaseline(origin: string, destination: string): Promise<IPriceBaseline | null> {
    const rows = await PriceRepository.findEconomy30d(origin, destination)
    if (rows.length < 5) return null

    const prices = rows.map((r) => Number(r.price))
    const currency = rows[0].currency

    // Remove outliers via IQR
    const sorted = [...prices].sort((a, b) => a - b)
    const q1 = sorted[Math.floor(sorted.length * 0.25)]
    const q3 = sorted[Math.floor(sorted.length * 0.75)]
    const iqr = q3 - q1
    const filtered = sorted.filter((p) => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr)
    if (filtered.length < 3) return null

    const avg = filtered.reduce((a, b) => a + b, 0) / filtered.length

    return {
      economyAvg30d: Math.round(avg),
      economyP25: Math.round(filtered[Math.floor(filtered.length * 0.25)]),
      economyP50: Math.round(filtered[Math.floor(filtered.length * 0.5)]),
      economyP75: Math.round(filtered[Math.floor(filtered.length * 0.75)]),
      currency,
      computedAt: new Date().toISOString(),
    }
  }

  evaluate(businessPrice: number, baseline: IPriceBaseline): IDetectionResult {
    const ratio = businessPrice / baseline.economyAvg30d
    let level: TAlertLevel | null = null

    if (ratio <= INSANE_MULTIPLIER) level = 'INSANE'
    else if (ratio <= GOOD_MULTIPLIER) level = 'GOOD'

    const score = Math.max(0, Math.min(1, (GOOD_MULTIPLIER - ratio) / (GOOD_MULTIPLIER - 0.5)))

    return { isADeal: level !== null, level, score, baseline }
  }

  async runDetection(
    routeId: string,
    origin: string,
    destination: string,
    businessPrice: Price,
  ): Promise<Alert | null> {
    const baseline = await this.computeBaseline(origin, destination)
    if (!baseline) return null

    const result = this.evaluate(Number(businessPrice.price), baseline)
    if (!result.isADeal || !result.level) return null

    // Validation: max 2 stops, max 24h
    if (businessPrice.stops > 2) return null
    if (businessPrice.durationMinutes > 1440) return null

    // Persist detection attempt
    const alert = AppDataSource.getRepository(Alert).create({
      routeId,
      priceId: businessPrice.id,
      level: result.level,
      score: result.score,
    })
    await AppDataSource.getRepository(Alert).save(alert)

    // Check consecutive detections
    const consecutive = await AlertRepository.countRecentUnsent(routeId)
    if (consecutive < MIN_CONSECUTIVE) return null

    // Check cooldown
    if (await AlertRepository.isOnCooldown(routeId, ALERT_COOLDOWN_HOURS)) return null

    return alert
  }
}

export const detectionService = new DetectionService()
