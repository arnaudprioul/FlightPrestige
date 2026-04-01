import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { routesPlugin } from './routes/routes.js'
import { alertsPlugin } from './routes/alerts.js'
import { pricesPlugin } from './routes/prices.js'
import { userPlugin } from './routes/user.js'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

await app.register(cors, {
  origin: process.env.NODE_ENV === 'production' ? false : true,
})

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

// Routes
await app.register(userPlugin, { prefix: '/api/user' })
await app.register(routesPlugin, { prefix: '/api/routes' })
await app.register(alertsPlugin, { prefix: '/api/alerts' })
await app.register(pricesPlugin, { prefix: '/api/prices' })

app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

const port = Number(process.env.PORT ?? 3000)
const host = '0.0.0.0'

try {
  await app.listen({ port, host })
  console.log(`FlightPrestige API running on port ${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
