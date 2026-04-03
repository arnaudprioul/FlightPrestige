import { defineStore } from 'pinia'
import type { IPrice, IPriceBaseline } from '@flightprestige/shared'

export const usePricesStore = defineStore('prices', () => {
  const prices = ref<IPrice[]>([])
  const baseline = ref<IPriceBaseline | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const service = usePriceService()

  async function fetchPricesForRoute(routeId: string) {
    isLoading.value = true
    error.value = null
    try {
      const [priceData, baselineData] = await Promise.all([
        service.getByRoute(routeId),
        service.getBaseline(routeId),
      ])
      prices.value = priceData
      baseline.value = baselineData
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  function clear() {
    prices.value = []
    baseline.value = null
  }

  return { prices, baseline, isLoading, error, fetchPricesForRoute, clear }
})
