import { createI18n } from 'vue-i18n'
import en from '@/assets/locales/en.json'
import fr from '@/assets/locales/fr.json'

const LOCALE_KEY = 'flightprestige_locale'

function getDefaultLocale(): string {
  const saved = localStorage.getItem(LOCALE_KEY)
  if (saved) return saved
  const browser = navigator.language.slice(0, 2)
  return ['fr'].includes(browser) ? browser : 'en'
}

export function setLocale(locale: string) {
  i18n.global.locale.value = locale as 'en' | 'fr'
  localStorage.setItem(LOCALE_KEY, locale)
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: { en, fr },
})

export default i18n
