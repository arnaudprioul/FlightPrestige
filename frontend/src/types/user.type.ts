export interface IUser {
  id: string
  email: string
  phone?: string
  notifyEmail: boolean
  notifySms: boolean
  createdAt: string
}
