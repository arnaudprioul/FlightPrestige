import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { User } from './user.entity'
import { Alert } from './alert.entity'

@Entity('routes')
@Unique(['userId', 'origin', 'destination'])
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @ManyToOne(() => User, (user) => user.routes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User

  @Column({ length: 3 })
  origin: string

  @Column({ length: 3 })
  destination: string

  @Column({ default: false })
  flexibleDates: boolean

  @Column({ default: true })
  active: boolean

  @CreateDateColumn()
  createdAt: Date

  @OneToMany(() => Alert, (alert) => alert.route)
  alerts: Alert[]
}
