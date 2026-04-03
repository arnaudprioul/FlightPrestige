import { $fetch } from 'ofetch'

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string

  return $fetch.create({
    baseURL,
    credentials: 'include',
    onResponseError({ response }) {
      if (response.status === 401) {
        navigateTo('/auth/login')
      }
    },
  })
}
