export const LANGUAGE_STORAGE_KEY = 'my-pay-language'
export const FALLBACK_LANGUAGE = 'en'
export const SUPPORTED_LANGUAGES = ['en', 'vn'] as const

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const HTML_LANG: Record<AppLanguage, string> = {
  en: 'en',
  vn: 'vi',
}

export function isAppLanguage(value: unknown): value is AppLanguage {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  )
}

export function readStoredLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isAppLanguage(stored)) {
      return stored
    }
  } catch {
    // Ignore storage access errors and fall back to English.
  }

  return FALLBACK_LANGUAGE
}

export function persistLanguage(language: AppLanguage): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Ignore storage write errors.
  }
}

export function applyDocumentLanguage(language: AppLanguage): void {
  document.documentElement.lang = HTML_LANG[language]
}
