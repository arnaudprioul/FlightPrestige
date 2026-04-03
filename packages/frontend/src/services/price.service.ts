import type { IPrice, IPriceBaseline } from '@flightprestige/shared'

export function usePriceService() {
  const api = useApi()

  return {
    getByRoute: (routeId: string) =>
      api<{ data: IPrice[] }>(`/routes/${routeId}/prices`).then((r) => r.data),
    getBaseline: (routeId: string) =>
      api<{ data: IPriceBaseline }>(`/routes/${routeId}/baseline`).then((r) => r.data),
  }
}
