import type { Response } from 'express'
import { ApiResponse } from '../classes/api-response.class'
import { AppDataSource } from '../configs/database.config'
import { User } from '../entities/user.entity'
import type { IAuthRequest } from '../types/express.type'

export class UserController {
  getMe = (req: IAuthRequest, res: Response): void => {
    ApiResponse.ok(req.user).send(res)
  }

  updateMe = async (req: IAuthRequest, res: Response): Promise<void> => {
    const { email, phone, notifyEmail, notifySms } = req.body as Partial<
      Pick<User, 'email' | 'phone' | 'notifyEmail' | 'notifySms'>
    >

    await AppDataSource.getRepository(User).update(req.user.id, {
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(notifyEmail !== undefined && { notifyEmail }),
      ...(notifySms !== undefined && { notifySms }),
    })

    const updated = await AppDataSource.getRepository(User).findOne({ where: { id: req.user.id } })
    ApiResponse.ok(updated).send(res)
  }
}
