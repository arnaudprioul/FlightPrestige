import type { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../classes/api-response.class'

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[Error]', err.message, err.stack)
  ApiResponse.internal(
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  ).send(res)
}

export function notFoundMiddleware(_req: Request, res: Response): void {
  ApiResponse.notFound('Route not found').send(res)
}
