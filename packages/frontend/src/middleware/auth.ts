export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()

  if (!userStore.user) {
    try {
      await userStore.fetchUser()
    } catch {
      return navigateTo('/auth/login')
    }
  }

  if (!userStore.user) {
    return navigateTo('/auth/login')
  }
})
