export interface IRoute {
  id: string
  userId: string
  origin: string              // IATA code e.g. 'CDG'
  destination: string         // IATA code e.g. 'JFK'
  flexibleDates: boolean
  active: boolean
  createdAt: string
}

export interface ICreateRoutePayload {
  origin: string
  destination: string
  flexibleDates: boolean
}
