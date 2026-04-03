import type { Request, Response } from 'express'
import { ApiResponse } from '../classes/api-response.class'
import { AppDataSource } from '../configs/database.config'
import { Price } from '../entities/price.entity'
import type { TCabinClass } from '@flightprestige/shared'

export class PriceController {
  query = async (req: Request, res: Response): Promise<void> => {
    const { origin, destination, class: cabinClass, limit = '50' } = req.query as {
      origin?: string
      destination?: string
      class?: TCabinClass
      limit?: string
    }

    const qb = AppDataSource.getRepository(Price)
      .createQueryBuilder('price')
      .orderBy('price.createdAt', 'DESC')
      .take(parseInt(limit))

    if (origin) qb.andWhere('price.origin = :origin', { origin })
    if (destination) qb.andWhere('price.destination = :destination', { destination })
    if (cabinClass) qb.andWhere('price.cabinClass = :class', { class: cabinClass })

    const prices = await qb.getMany()
    ApiResponse.ok(prices).send(res)
  }
}
