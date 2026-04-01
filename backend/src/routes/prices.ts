import type { FastifyPluginAsync } from 'fastify'
import { query } from '../db/index.js'

export const pricesPlugin: FastifyPluginAsync = async (app) => {
  // GET /api/prices?origin=CDG&destination=JFK&class=business
  app.get<{
    Querystring: { origin?: string; destination?: string; class?: string; limit?: string }
  }>('/', async (req) => {
    const { origin, destination, class: cabinClass, limit = '50' } = req.query
    const conditions: string[] = []
    const params: unknown[] = []

    if (origin) { params.push(origin); conditions.push(`origin = $${params.length}`) }
    if (destination) { params.push(destination); conditions.push(`destination = $${params.length}`) }
    if (cabinClass) { params.push(cabinClass); conditions.push(`class = $${params.length}`) }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    params.push(parseInt(limit))

    const { rows } = await query(
      `SELECT * FROM prices ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
      params,
    )
    return rows
  })
}
