import 'dotenv/config'
import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import cron from 'node-cron'
import { query } from '../db/index.js'
import { amadeusService } from '../services/amadeus.service.js'
import { detectionService } from '../services/detection.service.js'
import { notificationService } from '../services/notification.service.js'
import type { IRoute, IPrice } from '../types/index.js'

const redisUrl = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379')

const connection = new IORedis({
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || '6379'),
  maxRetriesPerRequest: null,
})

export const priceCheckQueue = new Queue('price-check', { connection })

interface IPriceCheckJob {
  routeId: string
  origin: string
  destination: string
}

// Worker: process a single route
const worker = new Worker<IPriceCheckJob>(
  'price-check',
  async (job) => {
    const { routeId, origin, destination } = job.data
    console.log(`[Worker] Checking ${origin} → ${destination}`)

    // Fetch dates to check (next 30 days, every 3 days)
    const dates = generateDates(30, 3)

    for (const date of dates) {
      try {
        // Fetch economy + business in parallel
        const [economyFlights, businessFlights] = await Promise.all([
          amadeusService.searchFlights(origin, destination, date, 'ECONOMY'),
          amadeusService.searchFlights(origin, destination, date, 'BUSINESS'),
        ])

        // Persist prices
        const allFlights = [...economyFlights, ...businessFlights]
        for (const flight of allFlights) {
          await query(`
            INSERT INTO prices (id, origin, destination, departure_date, return_date, class, price, currency, airline, stops, duration_minutes, raw_payload)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT DO NOTHING
          `, [
            flight.origin,
            flight.destination,
            flight.departureDate,
            flight.returnDate,
            flight.cabinClass,
            flight.price,
            flight.currency,
            flight.airline,
            flight.stops,
            flight.durationMinutes,
            JSON.stringify(flight.rawPayload),
          ])
        }

        // Find cheapest business flight
        const cheapestBusiness = businessFlights.sort((a, b) => a.price - b.price)[0]
        if (!cheapestBusiness) continue

        // Get the persisted price record
        const { rows } = await query<IPrice>(`
          SELECT * FROM prices
          WHERE origin = $1 AND destination = $2 AND departure_date = $3 AND class = 'business'
          ORDER BY price ASC LIMIT 1
        `, [origin, destination, date])

        if (!rows[0]) continue

        // Run detection
        const alert = await detectionService.runDetection(routeId, origin, destination, rows[0])
        if (!alert) continue

        // Get baseline for notification
        const baseline = await detectionService.computeBaseline(origin, destination)
        if (!baseline) continue

        // Get route + users
        const { rows: [route] } = await query<IRoute>(`SELECT * FROM routes WHERE id = $1`, [routeId])
        const users = await notificationService.getUsersForRoute(routeId)

        for (const user of users) {
          await notificationService.notifyUser(user, alert, rows[0], route, baseline.economy_avg_30d)
        }
      } catch (err) {
        console.error(`[Worker] Error processing ${origin}→${destination} on ${date}:`, err)
      }
    }
  },
  {
    connection,
    concurrency: 5,
  },
)

worker.on('completed', job => console.log(`[Worker] Job ${job.id} completed`))
worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err))

// Scheduler: every 6 hours, enqueue all active routes
cron.schedule('0 */6 * * *', async () => {
  console.log('[Scheduler] Enqueuing active routes...')
  const { rows } = await query<IRoute>(`SELECT * FROM routes WHERE active = true`)

  for (const route of rows) {
    await priceCheckQueue.add(
      `check-${route.id}`,
      { routeId: route.id, origin: route.origin, destination: route.destination },
      { attempts: 3, backoff: { type: 'exponential', delay: 60_000 } },
    )
  }

  console.log(`[Scheduler] Enqueued ${rows.length} routes`)
})

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

console.log('[Scheduler] Worker started. Cron every 6h.')
