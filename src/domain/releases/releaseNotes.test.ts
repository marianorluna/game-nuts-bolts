import { describe, expect, it } from 'vitest'
import {
  getLocalizedList,
  getLocalizedTitle,
  resolveWhatsNewSummary,
  shouldShowReleaseWhatsNew,
} from './releaseNotes'
import type { ReleaseNote } from './releaseNotes'

describe('releaseNotes domain', () => {
  it('getLocalizedList returns locale-specific bullets', () => {
    const strings = { es: ['Hola'], en: ['Hello'] }
    expect(getLocalizedList(strings, 'es')).toEqual(['Hola'])
    expect(getLocalizedList(strings, 'en')).toEqual(['Hello'])
  })

  it('getLocalizedList returns empty array when undefined', () => {
    expect(getLocalizedList(undefined, 'es')).toEqual([])
  })

  it('getLocalizedTitle picks locale title', () => {
    const title = { es: 'Título', en: 'Title' }
    expect(getLocalizedTitle(title, 'es')).toBe('Título')
    expect(getLocalizedTitle(title, 'en')).toBe('Title')
  })

  it('resolveWhatsNewSummary builds level/stage keys', () => {
    expect(resolveWhatsNewSummary({ newLevels: 100, newStages: 3 })).toEqual({
      key: 'summaryLevelsAndStages',
      params: { countLevels: 100, countStages: 3 },
    })
    expect(resolveWhatsNewSummary({ newLevels: 30 })).toEqual({
      key: 'summaryLevelsOnly',
      params: { count: 30 },
    })
    expect(resolveWhatsNewSummary(undefined)).toBeNull()
  })

  it('shouldShowReleaseWhatsNew skips hotfixes and requires userSummary', () => {
    const contentRelease = {
      published: true,
      userSummary: { newLevels: 10 },
    } as ReleaseNote
    const hotfix = {
      published: true,
      showWhatsNew: false,
      highlights: { es: ['x'], en: ['x'] },
    } as ReleaseNote

    expect(shouldShowReleaseWhatsNew(contentRelease)).toBe(true)
    expect(shouldShowReleaseWhatsNew(hotfix)).toBe(false)
  })
})
