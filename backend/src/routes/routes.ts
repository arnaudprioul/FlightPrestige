import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { query } from '../db/index.js'
import { priceCheckQueue } from '../workers/scheduler.worker.js'
import type { IRoute } from '../types/index.js'

const createRouteSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  flexibleDates: z.boolean().default(false),
})

export const routesPlugin: FastifyPluginAsync = async (app) => {
  // GET /api/routes
  app.get('/', async (req) => {
    const userId = 'demo-user' // TODO: extract from JWT
    const { rows } = await query<IRoute>(
      `SELECT * FROM routes WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    )
    return rows
  })

  // POST /api/routes
  app.post('/', async (req, reply) => {
    const body = createRouteSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() })
    }

    const { origin, destination, flexibleDates } = body.data
    const userId = 'demo-user'

    const { rows } = await query<IRoute>(`
      INSERT INTO routes (id, user_id, origin, destination, flexible_dates)
      VALUES (gen_random_uuid(), $1, $2, $3, $4)
      RETURNING *
    `, [userId, origin, destination, flexibleDates])

    // Immediately enqueue a price check
    await priceCheckQueue.add(`check-${rows[0].id}`, {
      routeId: rows[0].id,
      origin,
      destination,
    })

    return reply.status(201).send(rows[0])
  })

  // GET /api/routes/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const { rows } = await query<IRoute>(
      `SELECT * FROM routes WHERE id = $1`,
      [req.params.id],
    )
    if (!rows[0]) return reply.status(404).send({ error: 'Route not found' })
    return rows[0]
  })

  // PATCH /api/routes/:id/toggle
  app.patch<{ Params: { id: string } }>('/:id/toggle', async (req, reply) => {
    const { rows } = await query<IRoute>(`
      UPDATE routes SET active = NOT active WHERE id = $1 RETURNING *
    `, [req.params.id])
    if (!rows[0]) return reply.status(404).send({ error: 'Route not found' })
    return rows[0]
  })

  // DELETE /api/routes/:id
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await query(`DELETE FROM routes WHERE id = $1`, [req.params.id])
    return reply.status(204).send()
  })

  // GET /api/routes/:id/prices
  app.get<{ Params: { id: string } }>('/:id/prices', async (req, reply) => {
    const { rows: [route] } = await query<IRoute>(
      `SELECT * FROM routes WHERE id = $1`,
      [req.params.id],
    )
    if (!route) return reply.status(404).send({ error: 'Route not found' })

    const { rows } = await query(`
      SELECT * FROM prices
      WHERE origin = $1 AND destination = $2
      ORDER BY created_at DESC
      LIMIT 100
    `, [route.origin, route.destination])
    return rows
  })

  // GET /api/routes/:id/baseline
  app.get<{ Params: { id: string } }>('/:id/baseline', async (req, reply) => {
    const { rows: [route] } = await query<IRoute>(
      `SELECT * FROM routes WHERE id = $1`,
      [req.params.id],
    )
    if (!route) return reply.status(404).send({ error: 'Route not found' })

    const { detectionService } = await import('../services/detection.service.js')
    const baseline = await detectionService.computeBaseline(route.origin, route.destination)
    if (!baseline) return reply.status(404).send({ error: 'Insufficient data for baseline' })
    return baseline
  })

  // GET /api/routes/:id/alerts
  app.get<{ Params: { id: string } }>('/:id/alerts', async (req) => {
    const { rows } = await query(`
      SELECT a.*, p.price, p.currency, p.airline, p.stops, p.duration_minutes, p.departure_date
      FROM alerts a
      JOIN prices p ON p.id = a.price_id
      WHERE a.route_id = $1
      ORDER BY a.created_at DESC
      LIMIT 50
    `, [req.params.id])
    return rows
  })
}
