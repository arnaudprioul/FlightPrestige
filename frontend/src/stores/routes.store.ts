import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IRoute, ICreateRoutePayload } from '@/types/route.type'

export const useRoutesStore = defineStore('routes', () => {
  const routes = ref<IRoute[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRoutes() {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch('/api/routes')
      if (!res.ok) throw new Error('Failed to fetch routes')
      routes.value = await res.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }

  async function createRoute(payload: ICreateRoutePayload): Promise<IRoute | null> {
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create route')
      const route: IRoute = await res.json()
      routes.value.push(route)
      return route
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return null
    }
  }

  async function deleteRoute(id: string) {
    try {
      const res = await fetch(`/api/routes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete route')
      routes.value = routes.value.filter(r => r.id !== id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  async function toggleRoute(id: string) {
    const route = routes.value.find(r => r.id === id)
    if (!route) return
    try {
      const res = await fetch(`/api/routes/${id}/toggle`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to toggle route')
      route.active = !route.active
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    }
  }

  return { routes, isLoading, error, fetchRoutes, createRoute, deleteRoute, toggleRoute }
})
