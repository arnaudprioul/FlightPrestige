import type { IUser } from '@flightprestige/shared'

export function useUserService() {
  const api = useApi()

  return {
    getMe: () => api<{ data: IUser }>('/user/me').then((r) => r.data),
    updateMe: (payload: Partial<Pick<IUser, 'email' | 'phone' | 'notifyEmail' | 'notifySms'>>) =>
      api<{ data: IUser }>('/user/me', { method: 'PATCH', body: payload }).then((r) => r.data),
  }
}
