export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, _vm, info) => {
    console.error('[Vue Error]', error, info)
  }

  nuxtApp.hook('vue:error', (error) => {
    console.error('[Nuxt Hook Error]', error)
  })
})
