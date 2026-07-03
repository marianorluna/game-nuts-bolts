import { describe, expect, it } from 'vitest'
import { CHALLENGE_MAX_ATTEMPTS, CHALLENGE_REGEN_MS } from './challengeConstants'
import {
  canStartChallenge,
  consumeChallengeAttempt,
  createInitialChallenge,
  getChallengeMapState,
  getNextAttemptAt,
  isChallengeMastered,
  mergeChallengeProgress,
  migrateChallengeFromLevelProgress,
  onChallengeVictory,
  shouldBlockUnlockAfterCycle,
  shouldUnlockNextOnChallenge,
  tickChallengeRegen,
} from './challengeProgress'

const t0 = new Date('2026-07-01T12:00:00.000Z')
const t8h = new Date(t0.getTime() + CHALLENGE_REGEN_MS)
const t16h = new Date(t0.getTime() + CHALLENGE_REGEN_MS * 2)
const t24h = new Date(t0.getTime() + CHALLENGE_REGEN_MS * 3)
const t60h = new Date(t0.getTime() + CHALLENGE_REGEN_MS * 7.5)

describe('createInitialChallenge', () => {
  it('starts with 3 attempts and no outcome', () => {
    const c = createInitialChallenge()
    expect(c.attemptsAvailable).toBe(3)
    expect(c.outcome).toBe('none')
    expect(c.regenDueAt).toEqual([])
  })
})

describe('consumeChallengeAttempt', () => {
  it('decrements attempts and schedules regen', () => {
    let c = createInitialChallenge()
    c = consumeChallengeAttempt(c, t0)
    expect(c.attemptsAvailable).toBe(2)
    expect(c.regenDueAt).toHaveLength(1)
  })

  it('does not consume when mastered', () => {
    let c = createInitialChallenge()
    c = onChallengeVictory(c, 3, t0)
    const before = { ...c, attemptsAvailable: c.attemptsAvailable }
    c = consumeChallengeAttempt(c, t0)
    expect(c.attemptsAvailable).toBe(before.attemptsAvailable)
  })
})

describe('tickChallengeRegen', () => {
  it('restores 1 attempt after 8h', () => {
    let c = consumeChallengeAttempt(createInitialChallenge(), t0)
    c = tickChallengeRegen(c, t8h)
    expect(c.attemptsAvailable).toBe(3)
    expect(c.regenDueAt).toHaveLength(0)
  })

  it('restores 2 after 16h when 2 consumed', () => {
    let c = createInitialChallenge()
    c = consumeChallengeAttempt(c, t0)
    c = consumeChallengeAttempt(c, t0)
    expect(c.attemptsAvailable).toBe(1)
    c = tickChallengeRegen(c, t16h)
    expect(c.attemptsAvailable).toBe(3)
  })

  it('caps at 3 attempts after 60h', () => {
    let c = createInitialChallenge()
    c = consumeChallengeAttempt(c, t0)
    c = consumeChallengeAttempt(c, t0)
    c = consumeChallengeAttempt(c, t0)
    expect(c.attemptsAvailable).toBe(0)
    c = tickChallengeRegen(c, t60h)
    expect(c.attemptsAvailable).toBe(3)
    expect(c.regenDueAt).toHaveLength(0)
  })
})

describe('onChallengeVictory', () => {
  it('masters on 3 stars and clears attempt limits', () => {
    let c = createInitialChallenge()
    c = consumeChallengeAttempt(c, t0)
    c = onChallengeVictory(c, 3, t0)
    expect(c.outcome).toBe('mastered')
    expect(c.medalEarnedAt).toBeDefined()
    expect(c.attemptsAvailable).toBe(CHALLENGE_MAX_ATTEMPTS)
    expect(isChallengeMastered(c)).toBe(true)
  })

  it('approves on 1-2 stars without medal', () => {
    let c = createInitialChallenge()
    c = onChallengeVictory(c, 2, t0)
    expect(c.outcome).toBe('approved')
    expect(c.medalEarnedAt).toBeUndefined()
    expect(shouldUnlockNextOnChallenge(2)).toBe(true)
  })

  it('case C: 1 star on attempt 3 leaves approved and exhausted pool', () => {
    let c = createInitialChallenge()
    c = consumeChallengeAttempt(c, t0)
    c = consumeChallengeAttempt(c, t0)
    c = consumeChallengeAttempt(c, t0)
    c = onChallengeVictory(c, 1, t0)
    expect(c.outcome).toBe('approved')
    expect(c.attemptsAvailable).toBe(0)
    expect(c.regenDueAt.length).toBeGreaterThan(0)
    expect(getNextAttemptAt(c, t0)).not.toBeNull()
  })
})

describe('shouldBlockUnlockAfterCycle', () => {
  it('blocks when no victory and no attempts left', () => {
    let c = createInitialChallenge()
    c = consumeChallengeAttempt(c, t0)
    c = consumeChallengeAttempt(c, t0)
    c = consumeChallengeAttempt(c, t0)
    expect(shouldBlockUnlockAfterCycle(c)).toBe(true)
  })

  it('does not block after approved with 1 star', () => {
    let c = onChallengeVictory(createInitialChallenge(), 1, t0)
    expect(shouldBlockUnlockAfterCycle(c)).toBe(false)
  })
})

describe('getChallengeMapState', () => {
  it('returns mastered for 3 stars', () => {
    const c = onChallengeVictory(createInitialChallenge(), 3, t0)
    expect(getChallengeMapState(c, t0)).toBe('mastered')
  })

  it('returns cooldown when approved and no attempts', () => {
    let c = createInitialChallenge()
    c = consumeChallengeAttempt(c, t0)
    c = consumeChallengeAttempt(c, t0)
    c = consumeChallengeAttempt(c, t0)
    c = onChallengeVictory(c, 2, t0)
    expect(getChallengeMapState(c, t0)).toBe('cooldown')
  })
})

describe('migrateChallengeFromLevelProgress', () => {
  it('masters when 3 stars', () => {
    const c = migrateChallengeFromLevelProgress({
      stars: 3,
      bestMoves: 10,
      completed: true,
    })
    expect(c.outcome).toBe('mastered')
  })

  it('approves with fresh attempts when 1-2 stars', () => {
    const c = migrateChallengeFromLevelProgress({
      stars: 2,
      bestMoves: 15,
      completed: true,
    })
    expect(c.outcome).toBe('approved')
    expect(c.attemptsAvailable).toBe(3)
  })

  it('fresh challenge when not completed', () => {
    const c = migrateChallengeFromLevelProgress(undefined)
    expect(c.outcome).toBe('none')
    expect(c.attemptsAvailable).toBe(3)
  })
})

describe('mergeChallengeProgress', () => {
  it('takes mastered outcome over approved', () => {
    const local = migrateChallengeFromLevelProgress({
      stars: 2,
      bestMoves: 10,
      completed: true,
    })
    const remote = migrateChallengeFromLevelProgress({
      stars: 3,
      bestMoves: 8,
      completed: true,
    })
    const merged = mergeChallengeProgress(local, remote)!
    expect(merged.outcome).toBe('mastered')
  })

  it('takes minimum attempts available', () => {
    const local = createInitialChallenge()
    const remote = { ...createInitialChallenge(), attemptsAvailable: 1 }
    const merged = mergeChallengeProgress(local, remote)!
    expect(merged.attemptsAvailable).toBe(1)
  })
})

describe('canStartChallenge', () => {
  it('allows start when mastered regardless of attempts', () => {
    const c = onChallengeVictory(createInitialChallenge(), 3, t0)
    expect(canStartChallenge(c, t0)).toBe(true)
  })

  it('denies when no attempts and regen pending', () => {
    let c = createInitialChallenge()
    c = consumeChallengeAttempt(c, t0)
    c = consumeChallengeAttempt(c, t0)
    c = consumeChallengeAttempt(c, t0)
    expect(canStartChallenge(c, t0)).toBe(false)
    expect(canStartChallenge(c, t8h)).toBe(true)
  })
})
