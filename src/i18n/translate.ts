import en from './locales/en.json'
import es from './locales/es.json'
import type { Locale, TranslateParams, TranslationCatalog, TranslationKey, Translator } from './types'

const catalogs: Record<Locale, TranslationCatalog> = { es, en }

function getNestedValue(catalog: TranslationCatalog, key: string): string | undefined {
  const parts = key.split('.')
  let current: unknown = catalog
  for (const part of parts) {
    if (current === null || typeof current !== 'object' || !(part in current)) {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = params[name]
    return value !== undefined ? String(value) : `{{${name}}}`
  })
}

export function createTranslator(locale: Locale): Translator {
  const catalog = catalogs[locale]
  return (key: TranslationKey | string, params?: TranslateParams) => {
    const value = getNestedValue(catalog, key)
    if (value === undefined) {
      const fallback = getNestedValue(es, key)
      return interpolate(fallback ?? key, params)
    }
    return interpolate(value, params)
  }
}

export function getCatalog(locale: Locale): TranslationCatalog {
  return catalogs[locale]
}
