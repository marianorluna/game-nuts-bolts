import es from './locales/es.json'

export type Locale = 'es' | 'en'
export type LocalePreference = 'auto' | Locale

export type TranslationCatalog = typeof es

type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], Prefix extends '' ? K : `${Prefix}.${K}`> | (Prefix extends '' ? K : `${Prefix}.${K}`)
        : Prefix extends '' ? K : `${Prefix}.${K}`
    }[keyof T & string]
  : never

export type TranslationKey = NestedKeyOf<TranslationCatalog>

export type TranslateParams = Record<string, string | number>

export type Translator = (key: TranslationKey | string, params?: TranslateParams) => string
