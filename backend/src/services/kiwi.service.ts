import type { INormalizedFlight } from '../types/index.js'

interface IKiwiItinerary {
  price: number
  currency: string
  airlines: string[]
  route: Array<{ flyFrom: string; flyTo: string; local_departure: string; local_arrival: string }>
  fly_duration: string
  pnr_count: number
  bags_price?: Record<string, number>
}

export class KiwiService {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor() {
    this.baseUrl = process.env.KIWI_BASE_URL ?? 'https://api.tequila.kiwi.com'
    this.apiKey = process.env.KIWI_API_KEY ?? ''
  }

  async searchFlights(
    origin: string,
    destination: string,
    departureDate: string,
    cabinClass: 'economy' | 'business',
  ): Promise<INormalizedFlight[]> {
    const dateFrom = departureDate
    const dateTo = departureDate

    const params = new URLSearchParams({
      fly_from: origin,
      fly_to: destination,
      date_from: dateFrom,
      date_to: dateTo,
      selected_cabins: cabinClass === 'business' ? 'C' : 'M',
      limit: '10',
      curr: 'EUR',
    })

    const res = await fetch(`${this.baseUrl}/v2/search?${params}`, {
      headers: {
        apikey: this.apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      console.error(`Kiwi search failed: ${res.status}`)
      return []
    }

    const data: { data: IKiwiItinerary[] } = await res.json()
    return (data.data ?? []).map(it => this.normalize(it, origin, destination, departureDate, cabinClass))
  }

  private normalize(
    it: IKiwiItinerary,
    origin: string,
    destination: string,
    departureDate: string,
    cabinClass: 'economy' | 'business',
  ): INormalizedFlight {
    const stops = it.route.length - 1

    // Parse duration string "Xh Ym" into minutes
    const durationMatch = it.fly_duration.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/)
    const hours = parseInt(durationMatch?.[1] ?? '0')
    const minutes = parseInt(durationMatch?.[2] ?? '0')
    const durationMinutes = hours * 60 + minutes

    return {
      origin,
      destination,
      departureDate,
      returnDate: null,
      cabinClass,
      price: it.price,
      currency: it.currency,
      airline: it.airlines[0] ?? 'UNKNOWN',
      stops,
      durationMinutes,
      rawPayload: it as unknown as Record<string, unknown>,
    }
  }
}

export const kiwiService = new KiwiService()
