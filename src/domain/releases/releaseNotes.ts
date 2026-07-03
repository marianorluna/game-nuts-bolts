import type { Locale } from '../../i18n/types'

export interface LocalizedStrings {
  es: string[]
  en: string[]
}

export interface LocalizedText {
  es: string
  en: string
}

export interface ReleaseNote {
  version: string
  versionCode: number
  date: string | null
  published: boolean
  mergedInto?: string
  title: LocalizedText
  highlights: LocalizedStrings
  playStoreNotes?: LocalizedStrings
  added?: LocalizedStrings
  changed?: LocalizedStrings
  fixed?: LocalizedStrings
  compatibility?: LocalizedStrings
}

export interface ReleaseNotesCatalog {
  releases: ReleaseNote[]
}

export function getLocalizedList(
  strings: LocalizedStrings | undefined,
  locale: Locale,
): string[] {
  if (!strings) return []
  return strings[locale]
}

export function getLocalizedTitle(title: LocalizedText, locale: Locale): string {
  return title[locale]
}
