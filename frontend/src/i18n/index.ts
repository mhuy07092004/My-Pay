import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  applyDocumentLanguage,
  FALLBACK_LANGUAGE,
  isAppLanguage,
  persistLanguage,
  readStoredLanguage,
} from './config'
import en from './locales/en.json'
import vn from './locales/vn.json'

const initialLanguage = readStoredLanguage()

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vn: { translation: vn },
  },
  lng: initialLanguage,
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
})

applyDocumentLanguage(initialLanguage)

i18n.on('languageChanged', (language) => {
  if (!isAppLanguage(language)) {
    return
  }

  persistLanguage(language)
  applyDocumentLanguage(language)
})

export default i18n
