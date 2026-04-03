import type { IUser } from '@flightprestige/shared'

export function useAuthService() {
  const api = useApi()

  return {
    register: (email: string, password: string) =>
      api<{ data: IUser }>('/auth/register', { method: 'POST', body: { email, password } }).then((r) => r.data),
    login: (email: string, password: string) =>
      api<{ data: IUser }>('/auth/login', { method: 'POST', body: { email, password } }).then((r) => r.data),
    logout: () => api('/auth/logout', { method: 'POST' }),
    me: () => api<{ data: IUser }>('/auth/me').then((r) => r.data),
  }
}
