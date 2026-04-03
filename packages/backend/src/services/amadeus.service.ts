import type { INormalizedFlight } from '@flightprestige/shared'

interface IAmadeusTokenResponse {
  access_token: string
  expires_in: number
}

interface IAmadeusOffer {
  price: { total: string; currency: string }
  itineraries: Array<{
    segments: Array<{
      departure: { iataCode: string; at: string }
      arrival: { iataCode: string; at: string }
      carrierCode: string
      numberOfStops: number
    }>
  }>
}

export class AmadeusService {
  private readonly baseUrl: string
  private token: string | null = null
  private tokenExpiry = 0

  constructor() {
    this.baseUrl = process.env.AMADEUS_BASE_URL ?? 'https://test.api.amadeus.com'
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) return this.token

    const res = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_API_KEY ?? '',
        client_secret: process.env.AMADEUS_API_SECRET ?? '',
      }),
    })

    if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`)
    const data: IAmadeusTokenResponse = await res.json() as IAmadeusTokenResponse
    this.token = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return this.token
  }

  async searchFlights(
    origin: string,
    destination: string,
    departureDate: string,
    cabinClass: 'ECONOMY' | 'BUSINESS',
  ): Promise<INormalizedFlight[]> {
    const token = await this.getToken()

    const params = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults: '1',
      travelClass: cabinClass,
      max: '10',
      currencyCode: 'EUR',
    })

    const res = await fetch(`${this.baseUrl}/v2/shopping/flight-offers?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      console.error(`Amadeus search failed: ${res.status}`)
      return []
    }

    const data = await res.json() as { data: IAmadeusOffer[] }
    return (data.data ?? []).map((offer) => this.normalize(offer, origin, destination, departureDate, cabinClass))
  }

  private normalize(
    offer: IAmadeusOffer,
    origin: string,
    destination: string,
    departureDate: string,
    cabinClass: 'ECONOMY' | 'BUSINESS',
  ): INormalizedFlight {
    const itinerary = offer.itineraries[0]
    const first = itinerary.segments[0]
    const last = itinerary.segments[itinerary.segments.length - 1]
    const durationMs = new Date(last.arrival.at).getTime() - new Date(first.departure.at).getTime()

    return {
      origin,
      destination,
      departureDate,
      returnDate: null,
      cabinClass: cabinClass === 'ECONOMY' ? 'economy' : 'business',
      price: parseFloat(offer.price.total),
      currency: offer.price.currency,
      airline: first.carrierCode,
      stops: itinerary.segments.length - 1,
      durationMinutes: Math.round(durationMs / 60_000),
      rawPayload: offer as unknown as Record<string, unknown>,
    }
  }
}

export const amadeusService = new AmadeusService()
