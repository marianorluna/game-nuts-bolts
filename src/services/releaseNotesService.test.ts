import { describe, expect, it } from 'vitest'
import { getReleaseByVersionCode } from './releaseNotesService'

describe('getReleaseByVersionCode', () => {
  it('maps published versionCode to semver', () => {
    expect(getReleaseByVersionCode(9)?.version).toBe('1.5.2')
    expect(getReleaseByVersionCode(9, { publishedOnly: true })?.version).toBe(
      '1.5.2',
    )
  })

  it('ignores unpublished scaffolds when publishedOnly', () => {
    expect(getReleaseByVersionCode(10)?.version).toBe('1.6.0')
    expect(getReleaseByVersionCode(10, { publishedOnly: true })).toBeUndefined()
  })
})
