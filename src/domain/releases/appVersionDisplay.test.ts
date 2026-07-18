import { describe, expect, it } from 'vitest'
import {
  isDisplayableAppVersion,
  pickDisplayVersion,
} from './appVersionDisplay'

describe('appVersionDisplay', () => {
  it('rejects bare versionCode and empty values', () => {
    expect(isDisplayableAppVersion(undefined)).toBe(false)
    expect(isDisplayableAppVersion('')).toBe(false)
    expect(isDisplayableAppVersion('8')).toBe(false)
    expect(isDisplayableAppVersion('v8')).toBe(false)
    expect(isDisplayableAppVersion('V12')).toBe(false)
  })

  it('accepts semver-like names', () => {
    expect(isDisplayableAppVersion('1.5.0')).toBe(true)
    expect(isDisplayableAppVersion('1.5.2')).toBe(true)
    expect(isDisplayableAppVersion(' 1.5.1 ')).toBe(true)
  })

  it('pickDisplayVersion prefers name then mapped semver', () => {
    expect(pickDisplayVersion('1.5.0', '9.9.9')).toBe('1.5.0')
    expect(pickDisplayVersion(undefined, '1.5.2')).toBe('1.5.2')
    expect(pickDisplayVersion('8', '1.5.2')).toBe('1.5.2')
    expect(pickDisplayVersion('8', '9')).toBe('')
    expect(pickDisplayVersion(undefined, undefined)).toBe('')
  })
})
