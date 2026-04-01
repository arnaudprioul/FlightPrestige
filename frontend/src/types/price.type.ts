export type TCabinClass = 'economy' | 'business'

export type TAlertLevel = 'INSANE' | 'GOOD'

export interface IPrice {
  id: string
  origin: string
  destination: string
  departureDate: string       // ISO date 'YYYY-MM-DD'
  returnDate: string | null
  cabinClass: TCabinClass
  price: number
  currency: string
  airline: string
  stops: number
  durationMinutes: number
  createdAt: string
}

export interface IPriceBaseline {
  economyAvg30d: number
  economyP25: number
  economyP50: number
  economyP75: number
  currency: string
  computedAt: string
}
