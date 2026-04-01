export type TCabinClass = 'economy' | 'business'
export type TAlertLevel = 'INSANE' | 'GOOD'

export interface IPrice {
  id: string
  origin: string
  destination: string
  departure_date: string
  return_date: string | null
  class: TCabinClass
  price: number
  currency: string
  airline: string
  stops: number
  duration_minutes: number
  raw_payload: Record<string, unknown>
  created_at: Date
}

export interface IRoute {
  id: string
  user_id: string
  origin: string
  destination: string
  flexible_dates: boolean
  active: boolean
  created_at: Date
}

export interface IAlert {
  id: string
  route_id: string
  price_id: string
  score: number
  level: TAlertLevel
  sent_at: Date | null
  created_at: Date
}

export interface IUser {
  id: string
  email: string
  phone: string | null
  notify_email: boolean
  notify_sms: boolean
  created_at: Date
}

export interface IPriceBaseline {
  economy_avg_30d: number
  economy_p25: number
  economy_p50: number
  economy_p75: number
  currency: string
  computed_at: string
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
