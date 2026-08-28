import releaseNotesJson from '../data/release-notes.json'
import { APP_VERSION } from '../config/version'
import type { Locale } from '../i18n/types'
import type { ReleaseNote, ReleaseNotesCatalog } from '../domain/releases/releaseNotes'
import {
  getLocalizedTitle,
  resolveWhatsNewSummary,
  shouldShowReleaseWhatsNew,
} from '../domain/releases/releaseNotes'

const SEEN_KEY_PREFIX = 'nuts-bolts-release-notes-seen-'

const catalog = releaseNotesJson as ReleaseNotesCatalog

export function getAllReleases(): ReleaseNote[] {
  return catalog.releases
}

export function getPublishedReleases(): ReleaseNote[] {
  return catalog.releases.filter((release) => release.published)
}

export function getReleaseByVersion(version: string): ReleaseNote | undefined {
  return catalog.releases.find((release) => release.version === version)
}

export function getReleaseByVersionCode(
  versionCode: number | string,
  options?: { publishedOnly?: boolean },
): ReleaseNote | undefined {
  const code = Number(versionCode)
  if (!Number.isFinite(code)) return undefined
  return catalog.releases.find(
    (release) =>
      release.versionCode === code &&
      (!options?.publishedOnly || release.published),
  )
}

export function getCurrentReleaseNotes(): ReleaseNote | undefined {
  return getReleaseByVersion(APP_VERSION)
}

export function hasSeenReleaseNotes(version: string): boolean {
  try {
    return localStorage.getItem(`${SEEN_KEY_PREFIX}${version}`) === '1'
  } catch {
    return true
  }
}

export function markReleaseNotesSeen(version: string): void {
  try {
    localStorage.setItem(`${SEEN_KEY_PREFIX}${version}`, '1')
  } catch {
    // ignore quota / private mode
  }
}

export function shouldShowWhatsNewForVersion(version: string): boolean {
  const release = getReleaseByVersion(version)
  if (!release || !shouldShowReleaseWhatsNew(release)) return false
  return !hasSeenReleaseNotes(version)
}

export function shouldShowWhatsNew(): boolean {
  return shouldShowWhatsNewForVersion(APP_VERSION)
}

export interface WhatsNewContent {
  version: string
  title: string
  summaryKey: string
  summaryParams: Record<string, number>
}

export function getWhatsNewContent(locale: Locale): WhatsNewContent | null {
  const release = getCurrentReleaseNotes()
  if (!release || !shouldShowReleaseWhatsNew(release)) return null

  const summary = resolveWhatsNewSummary(release.userSummary)
  if (!summary) return null

  return {
    version: release.version,
    title: getLocalizedTitle(release.title, locale),
    summaryKey: summary.key,
    summaryParams: summary.params,
  }
}

export function dismissWhatsNew(): void {
  markReleaseNotesSeen(APP_VERSION)
}
