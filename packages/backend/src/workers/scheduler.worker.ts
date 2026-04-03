import 'dotenv/config'
import 'reflect-metadata'
import cron from 'node-cron'
import { AppDataSource } from '../configs/database.config'
import { amadeusService } from '../services/amadeus.service'
import { detectionService } from '../services/detection.service'
import { notificationService } from '../services/notification.service'
import { RouteRepository } from '../repositories/route.repository'
import { AppDataSource as DS } from '../configs/database.config'
import { Price } from '../entities/price.entity'
import { User } from '../entities/user.entity'
import type { INormalizedFlight } from '@flightprestige/shared'

function generateDates(daysAhead: number, step: number): string[] {
  const dates: string[] = []
  const now = new Date()
  for (let i = 7; i <= daysAhead; i += step) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

async function persistFlights(flights: INormalizedFlight[]): Promise<void> {
  for (const f of flights) {
    const existing = await DS.getRepository(Price).findOne({
      where: {
        origin: f.origin,
        destination: f.destination,
        departureDate: f.departureDate,
        cabinClass: f.cabinClass,
        airline: f.airline,
      },
    })
    if (existing) continue

    const price = DS.getRepository(Price).create({
      origin: f.origin,
      destination: f.destination,
      departureDate: f.departureDate,
      returnDate: f.returnDate,
      cabinClass: f.cabinClass,
      price: f.price,
      currency: f.currency,
      airline: f.airline,
      stops: f.stops,
      durationMinutes: f.durationMinutes,
      rawPayload: f.rawPayload,
    })
    await DS.getRepository(Price).save(price)
  }
}

export async function runPriceCheck(
  routeId: string,
  origin: string,
  destination: string,
): Promise<void> {
  console.log(`[Worker] Checking ${origin} → ${destination}`)
  const dates = generateDates(30, 3)

  for (const date of dates) {
    try {
      const [economyFlights, businessFlights] = await Promise.all([
        amadeusService.searchFlights(origin, destination, date, 'ECONOMY'),
        amadeusService.searchFlights(origin, destination, date, 'BUSINESS'),
      ])

      await persistFlights([...economyFlights, ...businessFlights])

      const cheapest = await DS.getRepository(Price).findOne({
        where: { origin, destination, departureDate: date, cabinClass: 'business' },
        order: { price: 'ASC' },
      })
      if (!cheapest) continue

      const alert = await detectionService.runDetection(routeId, origin, destination, cheapest)
      if (!alert) continue

      const baseline = await detectionService.computeBaseline(origin, destination)
      if (!baseline) continue

      const route = await DS.getRepository(Price).manager.findOne(
        (await import('../entities/route.entity')).Route,
        { where: { id: routeId } },
      )
      if (!route) continue

      const users = await DS.getRepository(User)
        .createQueryBuilder('user')
        .innerJoin('user.routes', 'route', 'route.id = :routeId', { routeId })
        .getMany()

      for (const user of users) {
        await notificationService.notifyUser(user, alert, cheapest, route, baseline.economyAvg30d)
      }
    } catch (err) {
      console.error(`[Worker] Error on ${origin}→${destination} (${date}):`, err)
    }
  }
}

async function startScheduler(): Promise<void> {
  await AppDataSource.initialize()
  console.log('[Scheduler] DB connected')

  // Every 6 hours: enqueue all active routes
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Scheduler] Starting scheduled price check...')
    const routes = await RouteRepository.findActiveRoutes()

    for (const route of routes) {
      runPriceCheck(route.id, route.origin, route.destination).catch((err: unknown) =>
        console.error(`[Scheduler] Failed for route ${route.id}:`, err),
      )
    }

    console.log(`[Scheduler] Triggered checks for ${routes.length} routes`)
  })

  console.log('[Scheduler] Worker running — cron every 6h')
}

// Only start scheduler when this file is run directly
if (require.main === module) {
  startScheduler().catch((err) => {
    console.error('[Scheduler] Fatal error:', err)
    process.exit(1)
  })
}
