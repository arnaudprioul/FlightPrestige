import { AppDataSource } from '../configs/database.config'
import { Price } from '../entities/price.entity'

export const PriceRepository = AppDataSource.getRepository(Price).extend({
  async findByRoute(
    origin: string,
    destination: string,
    limit = 100,
  ): Promise<Price[]> {
    return this.find({
      where: { origin, destination },
      order: { createdAt: 'DESC' },
      take: limit,
    })
  },

  async findEconomy30d(origin: string, destination: string): Promise<Price[]> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)

    return this.createQueryBuilder('price')
      .where('price.origin = :origin', { origin })
      .andWhere('price.destination = :destination', { destination })
      .andWhere('price.cabinClass = :class', { class: 'economy' })
      .andWhere('price.createdAt >= :cutoff', { cutoff })
      .andWhere('price.stops <= 2')
      .orderBy('price.price', 'ASC')
      .getMany()
  },

  async findCheapestBusiness(
    origin: string,
    destination: string,
    departureDate: string,
  ): Promise<Price | null> {
    return this.createQueryBuilder('price')
      .where('price.origin = :origin', { origin })
      .andWhere('price.destination = :destination', { destination })
      .andWhere('price.departureDate = :departureDate', { departureDate })
      .andWhere('price.cabinClass = :class', { class: 'business' })
      .orderBy('price.price', 'ASC')
      .getOne()
  },
})
