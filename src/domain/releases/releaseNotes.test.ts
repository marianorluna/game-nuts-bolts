import { describe, expect, it } from 'vitest'
import {
  getLocalizedList,
  getLocalizedTitle,
} from './releaseNotes'

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
})
