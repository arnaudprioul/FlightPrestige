import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IUser } from '@/types/user.type'

export const useUserStore = defineStore('user', () => {
  const user = ref<IUser | null>(null)
  const isLoading = ref(false)

  async function fetchUser() {
    isLoading.value = true
    try {
      const res = await fetch('/api/user/me')
      if (!res.ok) return
      user.value = await res.json()
    } finally {
      isLoading.value = false
    }
  }

  function clear() {
    user.value = null
  }

  return { user, isLoading, fetchUser, clear }
})
