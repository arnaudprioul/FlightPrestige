import type { IAlert } from '@flightprestige/shared'

export function useAlertService() {
  const api = useApi()

  return {
    getAll: () => api<{ data: IAlert[] }>('/alerts').then((r) => r.data),
    getByRoute: (routeId: string) =>
      api<{ data: IAlert[] }>(`/routes/${routeId}/alerts`).then((r) => r.data),
  }
}
