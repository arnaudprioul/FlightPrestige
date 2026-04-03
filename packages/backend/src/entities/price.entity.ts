import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'
import type { TCabinClass } from '@flightprestige/shared'

@Entity('prices')
@Index(['origin', 'destination', 'cabinClass', 'createdAt'])
export class Price {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 3 })
  origin: string

  @Column({ length: 3 })
  destination: string

  @Column({ type: 'date' })
  departureDate: string

  @Column({ type: 'date', nullable: true })
  returnDate: string | null

  @Column({ type: 'enum', enum: ['economy', 'business'] })
  cabinClass: TCabinClass

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number

  @Column({ length: 3, default: 'EUR' })
  currency: string

  @Column({ length: 10 })
  airline: string

  @Column({ type: 'smallint', default: 0 })
  stops: number

  @Column({ type: 'int' })
  durationMinutes: number

  @Column({ type: 'json', nullable: true })
  rawPayload: Record<string, unknown> | null

  @CreateDateColumn()
  createdAt: Date
}
