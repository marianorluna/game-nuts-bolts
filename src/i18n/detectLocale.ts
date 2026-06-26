import type { Locale } from './types'

export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'es'
  const lang = navigator.language.toLowerCase()
  return lang.startsWith('en') ? 'en' : 'es'
}
