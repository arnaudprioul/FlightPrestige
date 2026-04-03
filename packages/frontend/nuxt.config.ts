export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,

  srcDir: 'src/',

  css: ['~/assets/scss/main.scss'],

  modules: ['@pinia/nuxt', '@nuxtjs/i18n'],

  imports: {
    dirs: ['services', 'stores'],
  },

  i18n: {
    restructureDir: false,
    locales: [
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'fr', file: 'fr.json', name: 'Français' },
    ],
    langDir: 'assets/locales/',
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'flightprestige_locale',
      redirectOn: 'root',
    },
    strategy: 'no_prefix',
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1',
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
  },

  typescript: {
    strict: true,
  },

  compatibilityDate: '2024-11-01',
})
