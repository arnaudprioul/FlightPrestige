export interface IUser {
  id: string
  email: string
  phone: string | null
  notifyEmail: boolean
  notifySms: boolean
  createdAt: Date | string
}

export interface IUserPublic extends Omit<IUser, 'createdAt'> {
  createdAt: string
}
