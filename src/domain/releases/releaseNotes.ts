import type { Locale } from '../../i18n/types'

export interface LocalizedStrings {
  es: string[]
  en: string[]
}

export interface LocalizedText {
  es: string
  en: string
}

/** Resumen mínimo para el modal in-app (sin spoilers de mecánicas). */
export interface ReleaseUserSummary {
  newLevels?: number
  newStages?: number
}

export type WhatsNewSummaryKey =
  | 'summaryLevelsAndStages'
  | 'summaryLevelsOnly'
  | 'summaryStagesOnly'

export interface WhatsNewSummary {
  key: WhatsNewSummaryKey
  params: Record<string, number>
}

export interface ReleaseNote {
  version: string
  versionCode: number
  date: string | null
  published: boolean
  mergedInto?: string
  title: LocalizedText
  /** Bullets detallados — changelog y Play Store, no el modal in-app. */
  highlights: LocalizedStrings
  /** Niveles/etapas nuevas para el modal «Novedades». Omitir en hotfixes. */
  userSummary?: ReleaseUserSummary
  /** false = no mostrar modal aunque haya highlights (p. ej. correcciones). */
  showWhatsNew?: boolean
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

export function resolveWhatsNewSummary(
  summary: ReleaseUserSummary | undefined,
): WhatsNewSummary | null {
  if (!summary) return null

  const levels = summary.newLevels ?? 0
  const stages = summary.newStages ?? 0

  if (levels > 0 && stages > 0) {
    return {
      key: 'summaryLevelsAndStages',
      params: { countLevels: levels, countStages: stages },
    }
  }
  if (levels > 0) {
    return { key: 'summaryLevelsOnly', params: { count: levels } }
  }
  if (stages > 0) {
    return { key: 'summaryStagesOnly', params: { count: stages } }
  }
  return null
}

export function shouldShowReleaseWhatsNew(release: ReleaseNote): boolean {
  if (!release.published) return false
  if (release.showWhatsNew === false) return false
  return resolveWhatsNewSummary(release.userSummary) !== null
}
