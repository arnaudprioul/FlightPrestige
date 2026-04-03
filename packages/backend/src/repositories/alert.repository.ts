import { AppDataSource } from '../configs/database.config'
import { Alert } from '../entities/alert.entity'

export const AlertRepository = AppDataSource.getRepository(Alert).extend({
  async findByUserId(userId: string, limit = 50): Promise<Alert[]> {
    return this.createQueryBuilder('alert')
      .leftJoinAndSelect('alert.price', 'price')
      .leftJoinAndSelect('alert.route', 'route')
      .where('route.userId = :userId', { userId })
      .orderBy('alert.createdAt', 'DESC')
      .take(limit)
      .getMany()
  },

  async findByRouteId(routeId: string, limit = 50): Promise<Alert[]> {
    return this.find({
      where: { routeId },
      relations: { price: true },
      order: { createdAt: 'DESC' },
      take: limit,
    })
  },

  async countRecentUnsent(routeId: string, hours = 12): Promise<number> {
    const cutoff = new Date()
    cutoff.setHours(cutoff.getHours() - hours)

    return this.createQueryBuilder('alert')
      .where('alert.routeId = :routeId', { routeId })
      .andWhere('alert.createdAt >= :cutoff', { cutoff })
      .andWhere('alert.sentAt IS NULL')
      .getCount()
  },

  async isOnCooldown(routeId: string, hours: number): Promise<boolean> {
    const cutoff = new Date()
    cutoff.setHours(cutoff.getHours() - hours)

    const count = await this.createQueryBuilder('alert')
      .where('alert.routeId = :routeId', { routeId })
      .andWhere('alert.sentAt IS NOT NULL')
      .andWhere('alert.sentAt >= :cutoff', { cutoff })
      .getCount()

    return count > 0
  },
})
