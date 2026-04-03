import morgan from 'morgan'
import type { RequestHandler } from 'express'

export function createLogMiddleware(): RequestHandler | null {
  if (process.env.ENABLE_REQUEST_LOGGER !== 'true') return null
  return morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
}
