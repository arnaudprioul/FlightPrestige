export interface IRoute {
  id: string
  userId: string
  origin: string
  destination: string
  flexibleDates: boolean
  active: boolean
  createdAt: Date | string
}

export interface ICreateRoutePayload {
  origin: string
  destination: string
  flexibleDates?: boolean
}
