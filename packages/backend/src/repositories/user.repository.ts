import { AppDataSource } from '../configs/database.config'
import { User } from '../entities/user.entity'

export const UserRepository = AppDataSource.getRepository(User).extend({
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } })
  },

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne()
  },

  async findById(id: string): Promise<User | null> {
    return this.findOne({ where: { id } })
  },
})
