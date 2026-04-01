import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IAlert } from '@/types/alert.type'

export const useAlertsStore = defineStore('alerts', () => {
  const alerts = ref<IAlert[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const insaneAlerts = computed(() => alerts.value.filter(a => a.level === 'INSANE'))
  const goodAlerts = computed(() => alerts.value.filter(a => a.level === 'GOOD'))
  const latestAlert = computed(() => alerts.value[0] ?? null)

  async function fetchAlerts() {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch('/api/alerts')
      if (!res.ok) throw new Error('Failed to fetch alerts')
      alerts.value = await res.json()
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
      const res = await fetch(`/api/routes/${routeId}/alerts`)
      if (!res.ok) throw new Error('Failed to fetch alerts')
      alerts.value = await res.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  return {
    alerts,
    isLoading,
    error,
    insaneAlerts,
    goodAlerts,
    latestAlert,
    fetchAlerts,
    fetchAlertsForRoute,
  }
})
