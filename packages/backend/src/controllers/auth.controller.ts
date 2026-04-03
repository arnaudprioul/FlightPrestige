import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { ApiResponse } from '../classes/api-response.class'
import { UserRepository } from '../repositories/user.repository'
import { signAuthToken } from '../utils/auth.util'
import { AppDataSource } from '../configs/database.config'
import { User } from '../entities/user.entity'
import type { IAuthRequest } from '../types/express.type'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

export class AuthController {
  register = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email?: string; password?: string }

    if (!email || !password) {
      ApiResponse.badRequest('Email and password are required').send(res)
      return
    }

    if (password.length < 8) {
      ApiResponse.badRequest('Password must be at least 8 characters').send(res)
      return
    }

    const existing = await UserRepository.findByEmail(email)
    if (existing) {
      ApiResponse.conflict('Email already registered').send(res)
      return
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = AppDataSource.getRepository(User).create({ email, password: hashed })
    await AppDataSource.getRepository(User).save(user)

    const token = await signAuthToken({ userId: user.id, email: user.email })
    res.cookie('auth_token', token, COOKIE_OPTIONS)

    const { password: _pw, ...publicUser } = user
    ApiResponse.created(publicUser, 'Account created').send(res)
  }

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email?: string; password?: string }

    if (!email || !password) {
      ApiResponse.badRequest('Email and password are required').send(res)
      return
    }

    const user = await UserRepository.findByEmailWithPassword(email)
    if (!user || !user.password) {
      ApiResponse.unauthorized('Invalid credentials').send(res)
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      ApiResponse.unauthorized('Invalid credentials').send(res)
      return
    }

    const token = await signAuthToken({ userId: user.id, email: user.email })
    res.cookie('auth_token', token, COOKIE_OPTIONS)

    const { password: _pw, ...publicUser } = user
    ApiResponse.ok(publicUser, 'Login successful').send(res)
  }

  logout = (_req: Request, res: Response): void => {
    res.clearCookie('auth_token')
    ApiResponse.ok(null, 'Logged out').send(res)
  }

  me = (req: IAuthRequest, res: Response): void => {
    const { password: _pw, ...publicUser } = req.user as User & { password?: string }
    ApiResponse.ok(publicUser).send(res)
  }
}
