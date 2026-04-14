import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslations from './en.json'
import heTranslations from './he.json'

const resources = {
  en: { translation: enTranslations },
  he: { translation: heTranslations },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes output
    },
  })

export default i18n
