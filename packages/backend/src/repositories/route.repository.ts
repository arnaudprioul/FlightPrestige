import { AppDataSource } from '../configs/database.config'
import { Route } from '../entities/route.entity'

export const RouteRepository = AppDataSource.getRepository(Route).extend({
  async findByUserId(userId: string): Promise<Route[]> {
    return this.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    })
  },

  async findActiveRoutes(): Promise<Route[]> {
    return this.find({ where: { active: true } })
  },

  async findByIdAndUser(id: string, userId: string): Promise<Route | null> {
    return this.findOne({ where: { id, userId } })
  },
})
