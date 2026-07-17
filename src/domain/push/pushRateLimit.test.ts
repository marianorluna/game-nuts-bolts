import { describe, expect, it } from 'vitest'
import { evaluatePushRateLimit } from './pushRateLimit'

const NOW = Date.parse('2026-07-17T12:00:00.000Z')

describe('evaluatePushRateLimit', () => {
  it('allows rank_overtaken under daily cap', () => {
    const result = evaluatePushRateLimit({
      type: 'rank_overtaken',
      sameTypeLogs: [
        '2026-07-17T08:00:00.000Z',
        '2026-07-17T09:00:00.000Z',
      ],
      engagementWeekLogs: [],
      nowMs: NOW,
    })
    expect(result).toEqual({ allowed: true })
  })

  it('blocks rank_overtaken at 3/day', () => {
    const result = evaluatePushRateLimit({
      type: 'rank_overtaken',
      sameTypeLogs: [
        '2026-07-17T08:00:00.000Z',
        '2026-07-17T09:00:00.000Z',
        '2026-07-17T10:00:00.000Z',
      ],
      engagementWeekLogs: [],
      nowMs: NOW,
    })
    expect(result).toEqual({ allowed: false, reason: 'rate_limited' })
  })

  it('blocks engagement when weekly cap reached', () => {
    const result = evaluatePushRateLimit({
      type: 'daily_streak',
      sameTypeLogs: [],
      engagementWeekLogs: [
        '2026-07-15T10:00:00.000Z',
        '2026-07-16T10:00:00.000Z',
      ],
      nowMs: NOW,
    })
    expect(result).toEqual({ allowed: false, reason: 'rate_limited' })
  })

  it('blocks re_engagement within 3 days', () => {
    const result = evaluatePushRateLimit({
      type: 're_engagement',
      sameTypeLogs: ['2026-07-15T10:00:00.000Z'],
      engagementWeekLogs: [],
      nowMs: NOW,
    })
    expect(result).toEqual({ allowed: false, reason: 'rate_limited' })
  })

  it('blocks duplicate milestone type', () => {
    const result = evaluatePushRateLimit({
      type: 'milestone_80',
      sameTypeLogs: ['2026-01-01T00:00:00.000Z'],
      engagementWeekLogs: [],
      nowMs: NOW,
    })
    expect(result).toEqual({ allowed: false, reason: 'rate_limited' })
  })
})
