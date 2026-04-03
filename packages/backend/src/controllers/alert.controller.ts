import type { Response } from 'express'
import { ApiResponse } from '../classes/api-response.class'
import { AlertRepository } from '../repositories/alert.repository'
import type { IAuthRequest } from '../types/express.type'

export class AlertController {
  getAll = async (req: IAuthRequest, res: Response): Promise<void> => {
    const alerts = await AlertRepository.findByUserId(req.user.id)
    ApiResponse.ok(alerts).send(res)
  }
}
