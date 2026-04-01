import type { FastifyPluginAsync } from 'fastify'
import { query } from '../db/index.js'

export const alertsPlugin: FastifyPluginAsync = async (app) => {
  // GET /api/alerts — latest alerts for current user
  app.get('/', async () => {
    const userId = 'demo-user'
    const { rows } = await query(`
      SELECT a.*, p.price, p.currency, p.airline, p.stops, p.departure_date,
             r.origin, r.destination
      FROM alerts a
      JOIN prices p ON p.id = a.price_id
      JOIN routes r ON r.id = a.route_id
      WHERE r.user_id = $1
      ORDER BY a.created_at DESC
      LIMIT 50
    `, [userId])
    return rows
  })
}
