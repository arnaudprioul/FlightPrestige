import 'dotenv/config'
import 'reflect-metadata'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { AppDataSource } from './configs/database.config'
import { swaggerSpec } from './configs/swagger.config'
import { createLogMiddleware } from './middlewares/log.middleware'
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware'
import authRouter from './routes/auth.route'
import userRouter from './routes/user.route'
import routeRouter from './routes/route.route'
import alertRouter from './routes/alert.route'
import priceRouter from './routes/price.route'

const app = express()
const PORT = parseInt(process.env.PORT ?? '4000')
const PREFIX = '/api/v1'

// Security & parsing
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
const logMiddleware = createLogMiddleware()
if (logMiddleware) app.use(logMiddleware)

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
}))

// Swagger docs
app.use(`${PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// API routes
app.use(`${PREFIX}/auth`, authRouter)
app.use(`${PREFIX}/user`, userRouter)
app.use(`${PREFIX}/routes`, routeRouter)
app.use(`${PREFIX}/alerts`, alertRouter)
app.use(`${PREFIX}/prices`, priceRouter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 + error handlers (must be last)
app.use(notFoundMiddleware)
app.use(errorMiddleware)

async function start(): Promise<void> {
  await AppDataSource.initialize()
  console.log('[DB] Connected to MySQL')

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[API] FlightPrestige running on http://localhost:${PORT}`)
    console.log(`[API] Swagger docs: http://localhost:${PORT}${PREFIX}/docs`)
  })
}

start().catch((err) => {
  console.error('[Fatal]', err)
  process.exit(1)
})
