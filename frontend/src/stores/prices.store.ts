import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IPrice, IPriceBaseline } from '@/types/price.type'

export const usePricesStore = defineStore('prices', () => {
  const prices = ref<IPrice[]>([])
  const baseline = ref<IPriceBaseline | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPricesForRoute(routeId: string) {
    isLoading.value = true
    error.value = null
    try {
      const [pricesRes, baselineRes] = await Promise.all([
        fetch(`/api/routes/${routeId}/prices`),
        fetch(`/api/routes/${routeId}/baseline`),
      ])
      if (!pricesRes.ok || !baselineRes.ok) throw new Error('Failed to fetch price data')
      prices.value = await pricesRes.json()
      baseline.value = await baselineRes.json()
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
