import type { IRoute, ICreateRoutePayload } from '@flightprestige/shared'

export function useRouteService() {
  const api = useApi()

  return {
    getAll: () => api<{ data: IRoute[] }>('/routes').then((r) => r.data),
    create: (payload: ICreateRoutePayload) =>
      api<{ data: IRoute }>('/routes', { method: 'POST', body: payload }).then((r) => r.data),
    toggle: (id: string) =>
      api<{ data: IRoute }>(`/routes/${id}/toggle`, { method: 'PATCH' }).then((r) => r.data),
    delete: (id: string) => api(`/routes/${id}`, { method: 'DELETE' }),
  }
}
