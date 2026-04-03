import type { TAlertLevel } from '../types/index'
import type { IPrice } from './price'
import type { IRoute } from './route'

export interface IAlert {
  id: string
  routeId: string
  priceId: string
  score: number
  level: TAlertLevel
  sentAt: Date | string | null
  createdAt: Date | string
  price?: IPrice
  route?: IRoute
}
