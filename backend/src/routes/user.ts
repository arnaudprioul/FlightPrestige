import type { FastifyPluginAsync } from 'fastify'
import { query } from '../db/index.js'
import type { IUser } from '../types/index.js'

export const userPlugin: FastifyPluginAsync = async (app) => {
  // GET /api/user/me — demo: return or create demo user
  app.get('/me', async () => {
    const { rows } = await query<IUser>(
      `SELECT * FROM users WHERE id = 'demo-user'`,
    )

    if (rows[0]) return rows[0]

    const { rows: created } = await query<IUser>(`
      INSERT INTO users (id, email, notify_email, notify_sms)
      VALUES ('demo-user', 'demo@flightprestige.com', true, false)
      RETURNING *
    `)
    return created[0]
  })

  // PATCH /api/user/me
  app.patch<{ Body: Partial<Pick<IUser, 'email' | 'phone' | 'notify_email' | 'notify_sms'>> }>(
    '/me',
    async (req) => {
      const { email, phone, notify_email, notify_sms } = req.body
      const { rows } = await query<IUser>(`
        UPDATE users
        SET
          email = COALESCE($1, email),
          phone = COALESCE($2, phone),
          notify_email = COALESCE($3, notify_email),
          notify_sms = COALESCE($4, notify_sms)
        WHERE id = 'demo-user'
        RETURNING *
      `, [email, phone, notify_email, notify_sms])
      return rows[0]
    },
  )
}
