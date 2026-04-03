import type { Request, Response, NextFunction } from 'express'
import { verifyAuthToken } from '../utils/auth.util'
import { UserRepository } from '../repositories/user.repository'
import { ApiResponse } from '../classes/api-response.class'
import type { IAuthRequest } from '../types/express.type'

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    let token: string | undefined

    if (req.cookies?.auth_token) {
      token = req.cookies.auth_token as string
    } else {
      const authorization = req.headers.authorization
      if (authorization?.startsWith('Bearer ')) {
        token = authorization.slice(7)
      }
    }

    if (!token) {
      ApiResponse.unauthorized().send(res)
      return
    }

    const payload = await verifyAuthToken(token)
    const user = await UserRepository.findById(payload.userId)

    if (!user) {
      ApiResponse.unauthorized('User not found').send(res)
      return
    }

    ;(req as IAuthRequest).user = user
    next()
  } catch {
    ApiResponse.unauthorized('Invalid or expired token').send(res)
  }
}
