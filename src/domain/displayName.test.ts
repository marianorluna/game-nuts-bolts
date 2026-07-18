import { describe, expect, it } from 'vitest'
import {
  containsBlockedWord,
  generateProvisionalDisplayName,
  isBlankDisplayName,
  normalizeDisplayName,
  validateDisplayName,
} from './displayName'

describe('normalizeDisplayName', () => {
  it('trims and collapses spaces', () => {
    expect(normalizeDisplayName('  Foo   Bar  ')).toBe('Foo Bar')
  })
})

describe('validateDisplayName', () => {
  it('accepts a valid nick', () => {
    expect(validateDisplayName('BoltMaster')).toEqual({
      ok: true,
      normalized: 'BoltMaster',
    })
  })

  it('rejects too short', () => {
    expect(validateDisplayName('ab')).toEqual({ ok: false, error: 'too_short' })
  })

  it('rejects too long', () => {
    expect(validateDisplayName('a'.repeat(21))).toEqual({
      ok: false,
      error: 'too_long',
    })
  })

  it('rejects invalid chars', () => {
    expect(validateDisplayName('hola!')).toEqual({
      ok: false,
      error: 'invalid_chars',
    })
  })

  it('rejects blocked words', () => {
    expect(validateDisplayName('puto123')).toEqual({
      ok: false,
      error: 'blocked',
    })
    expect(validateDisplayName('f0ck_you')).toEqual({
      ok: false,
      error: 'blocked',
    })
  })

  it('allows underscore and spaces', () => {
    expect(validateDisplayName('Nut_Bolt 1')).toEqual({
      ok: true,
      normalized: 'Nut_Bolt 1',
    })
  })
})

describe('containsBlockedWord', () => {
  it('matches embedded blocked tokens', () => {
    expect(containsBlockedWord('xxshitxx')).toBe(true)
    expect(containsBlockedWord('BoltKing')).toBe(false)
  })
})

describe('generateProvisionalDisplayName', () => {
  it('builds Player_XXXXX from uuid seed', () => {
    expect(
      generateProvisionalDisplayName('a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ).toBe('Player_A1B2C')
  })

  it('pads short seeds', () => {
    expect(generateProvisionalDisplayName('ab')).toBe('Player_AB000')
  })
})

describe('isBlankDisplayName', () => {
  it('detects null empty and whitespace', () => {
    expect(isBlankDisplayName(null)).toBe(true)
    expect(isBlankDisplayName('')).toBe(true)
    expect(isBlankDisplayName('  ')).toBe(true)
    expect(isBlankDisplayName('Ada')).toBe(false)
  })
})
