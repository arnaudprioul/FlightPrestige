import type { TCabinClass } from '../types/index'

export interface IPrice {
  id: string
  origin: string
  destination: string
  departureDate: string
  returnDate: string | null
  cabinClass: TCabinClass
  price: number
  currency: string
  airline: string
  stops: number
  durationMinutes: number
  createdAt: Date | string
}

export interface IPriceBaseline {
  economyAvg30d: number
  economyP25: number
  economyP50: number
  economyP75: number
  currency: string
  computedAt: string
}

export interface INormalizedFlight {
  origin: string
  destination: string
  departureDate: string
  returnDate: string | null
  cabinClass: TCabinClass
  price: number
  currency: string
  airline: string
  stops: number
  durationMinutes: number
  rawPayload: Record<string, unknown>
}
