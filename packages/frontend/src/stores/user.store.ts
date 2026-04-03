import { defineStore } from 'pinia'
import type { IUser } from '@flightprestige/shared'

export const useUserStore = defineStore('user', () => {
  const user = ref<IUser | null>(null)
  const isLoading = ref(false)

  async function fetchUser() {
    isLoading.value = true
    try {
      user.value = await useUserService().getMe()
    } catch {
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  function clear() {
    user.value = null
  }

  return { user, isLoading, fetchUser, clear }
})
