import { defineStore } from 'pinia'
import type { IRoute, ICreateRoutePayload } from '@flightprestige/shared'

export const useRoutesStore = defineStore('routes', () => {
  const routes = ref<IRoute[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const service = useRouteService()

  async function fetchRoutes() {
    isLoading.value = true
    error.value = null
    try {
      routes.value = await service.getAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  async function createRoute(payload: ICreateRoutePayload): Promise<IRoute | null> {
    try {
      const route = await service.create(payload)
      routes.value.push(route)
      return route
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return null
    }
  }

  async function deleteRoute(id: string) {
    try {
      await service.delete(id)
      routes.value = routes.value.filter((r) => r.id !== id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  async function toggleRoute(id: string) {
    const route = routes.value.find((r) => r.id === id)
    if (!route) return
    try {
      const updated = await service.toggle(id)
      Object.assign(route, updated)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  return { routes, isLoading, error, fetchRoutes, createRoute, deleteRoute, toggleRoute }
})
