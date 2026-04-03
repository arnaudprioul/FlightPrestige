import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import type { TAlertLevel } from '@flightprestige/shared'
import { Route } from './route.entity'
import { Price } from './price.entity'

@Entity('alerts')
@Index(['routeId', 'createdAt'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  routeId: string

  @ManyToOne(() => Route, (route) => route.alerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routeId' })
  route: Route

  @Column()
  priceId: string

  @ManyToOne(() => Price, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'priceId' })
  price: Price

  @Column({ type: 'decimal', precision: 4, scale: 3 })
  score: number

  @Column({ type: 'enum', enum: ['INSANE', 'GOOD'] })
  level: TAlertLevel

  @Column({ type: 'datetime', nullable: true, default: null })
  sentAt: Date | null

  @CreateDateColumn()
  createdAt: Date
}
