import { defineStore } from 'pinia'
import type { IAlert } from '@flightprestige/shared'

export const useAlertsStore = defineStore('alerts', () => {
  const alerts = ref<IAlert[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const insaneAlerts = computed(() => alerts.value.filter((a) => a.level === 'INSANE'))
  const goodAlerts = computed(() => alerts.value.filter((a) => a.level === 'GOOD'))
  const latestAlert = computed(() => alerts.value[0] ?? null)

  const service = useAlertService()

  async function fetchAlerts() {
    isLoading.value = true
    error.value = null
    try {
      alerts.value = await service.getAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAlertsForRoute(routeId: string) {
    isLoading.value = true
    error.value = null
    try {
      alerts.value = await service.getByRoute(routeId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  return { alerts, isLoading, error, insaneAlerts, goodAlerts, latestAlert, fetchAlerts, fetchAlertsForRoute }
})
