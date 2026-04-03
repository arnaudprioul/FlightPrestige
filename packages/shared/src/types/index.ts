import type { CABIN_CLASS, ALERT_LEVEL } from '../enums/index'

export type TCabinClass = `${CABIN_CLASS}`
export type TAlertLevel = `${ALERT_LEVEL}`

export type TPaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
