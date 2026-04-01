import type { TAlertLevel, IPrice } from './price.type'
import type { IRoute } from './route.type'

export interface IAlert {
  id: string
  routeId: string
  priceId: string
  score: number
  level: TAlertLevel
  sentAt: string | null
  createdAt: string
  // Populated via join
  price?: IPrice
  route?: IRoute
}
