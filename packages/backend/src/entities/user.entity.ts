import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Route } from './route.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, length: 255 })
  email: string

  @Column({ type: 'varchar', select: false, nullable: true })
  password: string | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null

  @Column({ default: true })
  notifyEmail: boolean

  @Column({ default: false })
  notifySms: boolean

  @CreateDateColumn()
  createdAt: Date

  @OneToMany(() => Route, (route) => route.user)
  routes: Route[]
}
