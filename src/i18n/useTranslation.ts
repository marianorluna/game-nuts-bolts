import { useI18nContext } from './I18nProvider'

export function useTranslation() {
  const { t, locale, localePreference, setLocalePreference } = useI18nContext()
  return { t, locale, localePreference, setLocalePreference }
}
