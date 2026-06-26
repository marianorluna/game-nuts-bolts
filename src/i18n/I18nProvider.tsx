import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useGameStore } from '../store/gameStore'
import { detectLocale } from './detectLocale'
import { createTranslator } from './translate'
import type { Locale, LocalePreference, Translator } from './types'

interface I18nContextValue {
  locale: Locale
  localePreference: LocalePreference
  t: Translator
  setLocalePreference: (preference: LocalePreference) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function resolveLocale(preference: LocalePreference): Locale {
  return preference === 'auto' ? detectLocale() : preference
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const localePreference = useGameStore((s) => s.settings.locale)
  const setLocalePreference = useGameStore((s) => s.setLocalePreference)

  const locale = useMemo(() => resolveLocale(localePreference), [localePreference])
  const t = useMemo(() => createTranslator(locale), [locale])

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = t('common.appName')
  }, [locale, t])

  const value = useMemo(
    () => ({ locale, localePreference, t, setLocalePreference }),
    [locale, localePreference, t, setLocalePreference],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18nContext(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18nContext must be used within I18nProvider')
  }
  return ctx
}
