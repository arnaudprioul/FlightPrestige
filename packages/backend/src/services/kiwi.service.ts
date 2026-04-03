import type { INormalizedFlight } from '@flightprestige/shared'

interface IKiwiItinerary {
  price: number
  currency: string
  airlines: string[]
  route: Array<{ flyFrom: string; flyTo: string }>
  fly_duration: string
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
    const params = new URLSearchParams({
      fly_from: origin,
      fly_to: destination,
      date_from: departureDate,
      date_to: departureDate,
      selected_cabins: cabinClass === 'business' ? 'C' : 'M',
      limit: '10',
      curr: 'EUR',
    })

    const res = await fetch(`${this.baseUrl}/v2/search?${params}`, {
      headers: { apikey: this.apiKey, 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      console.error(`Kiwi search failed: ${res.status}`)
      return []
    }

    const data = await res.json() as { data: IKiwiItinerary[] }
    return (data.data ?? []).map((it) => this.normalize(it, origin, destination, departureDate, cabinClass))
  }

  private normalize(
    it: IKiwiItinerary,
    origin: string,
    destination: string,
    departureDate: string,
    cabinClass: 'economy' | 'business',
  ): INormalizedFlight {
    const match = it.fly_duration.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/)
    const durationMinutes = parseInt(match?.[1] ?? '0') * 60 + parseInt(match?.[2] ?? '0')

    return {
      origin,
      destination,
      departureDate,
      returnDate: null,
      cabinClass,
      price: it.price,
      currency: it.currency,
      airline: it.airlines[0] ?? 'UNKNOWN',
      stops: it.route.length - 1,
      durationMinutes,
      rawPayload: it as unknown as Record<string, unknown>,
    }
  }
}

export const kiwiService = new KiwiService()
