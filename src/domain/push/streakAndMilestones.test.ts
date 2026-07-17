import { describe, expect, it } from 'vitest'
import { nextDailyStreak, crossedMilestonePercents } from './streakAndMilestones'

describe('nextDailyStreak', () => {
  it('starts at 1 when no previous date', () => {
    expect(nextDailyStreak(0, null, '2026-07-17')).toEqual({
      currentStreak: 1,
      lastStreakDate: '2026-07-17',
    })
  })

  it('keeps streak on same day', () => {
    expect(nextDailyStreak(5, '2026-07-17', '2026-07-17')).toEqual({
      currentStreak: 5,
      lastStreakDate: '2026-07-17',
    })
  })

  it('increments when yesterday', () => {
    expect(nextDailyStreak(5, '2026-07-16', '2026-07-17')).toEqual({
      currentStreak: 6,
      lastStreakDate: '2026-07-17',
    })
  })

  it('resets after a gap', () => {
    expect(nextDailyStreak(5, '2026-07-14', '2026-07-17')).toEqual({
      currentStreak: 1,
      lastStreakDate: '2026-07-17',
    })
  })
})

describe('crossedMilestonePercents', () => {
  it('detects 50 and 80 crossings', () => {
    expect(crossedMilestonePercents(40, 80, 100)).toEqual([50, 80])
  })

  it('returns empty when no progress', () => {
    expect(crossedMilestonePercents(50, 50, 100)).toEqual([])
  })

  it('detects 100%', () => {
    expect(crossedMilestonePercents(99, 100, 100)).toEqual([100])
  })
})
