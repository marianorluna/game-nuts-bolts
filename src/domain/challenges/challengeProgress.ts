import type { ChallengeProgress, ChallengeOutcome, LevelProgress } from '../types'
import { CHALLENGE_MAX_ATTEMPTS, CHALLENGE_REGEN_MS } from './challengeConstants'

export type ChallengeMapState = 'mastered' | 'approved' | 'active' | 'cooldown'

export function createInitialChallenge(): ChallengeProgress {
  return {
    outcome: 'none',
    bestStars: 0,
    attemptsAvailable: CHALLENGE_MAX_ATTEMPTS,
    regenDueAt: [],
  }
}

function cloneChallenge(state: ChallengeProgress): ChallengeProgress {
  return {
    ...state,
    regenDueAt: [...state.regenDueAt],
  }
}

export function isChallengeMastered(state: ChallengeProgress): boolean {
  return state.outcome === 'mastered'
}

export function tickChallengeRegen(
  state: ChallengeProgress,
  now: Date,
): ChallengeProgress {
  if (isChallengeMastered(state)) return state

  const next = cloneChallenge(state)
  const nowMs = now.getTime()
  const remaining: string[] = []

  for (const iso of next.regenDueAt.sort()) {
    if (new Date(iso).getTime() <= nowMs) {
      if (next.attemptsAvailable < CHALLENGE_MAX_ATTEMPTS) {
        next.attemptsAvailable += 1
      }
    } else {
      remaining.push(iso)
    }
  }

  next.regenDueAt = remaining
  return next
}

export function canStartChallenge(
  state: ChallengeProgress,
  now: Date,
): boolean {
  if (isChallengeMastered(state)) return true
  const ticked = tickChallengeRegen(state, now)
  return ticked.attemptsAvailable > 0
}

export function consumeChallengeAttempt(
  state: ChallengeProgress,
  now: Date,
): ChallengeProgress {
  if (isChallengeMastered(state)) return state

  const ticked = tickChallengeRegen(state, now)
  const next = cloneChallenge(ticked)

  if (next.attemptsAvailable > 0) {
    next.attemptsAvailable -= 1
  }

  const slotsInFlight = next.regenDueAt.length
  const totalRecoverable =
    next.attemptsAvailable + slotsInFlight

  if (totalRecoverable < CHALLENGE_MAX_ATTEMPTS) {
    const dueAt = new Date(now.getTime() + CHALLENGE_REGEN_MS).toISOString()
    next.regenDueAt = [...next.regenDueAt, dueAt].sort()
  }

  return next
}

export function shouldUnlockNextOnChallenge(stars: number): boolean {
  return stars >= 1
}

export function shouldBlockUnlockAfterCycle(state: ChallengeProgress): boolean {
  if (isChallengeMastered(state)) return false
  return state.outcome === 'none' && state.attemptsAvailable === 0
}

export function onChallengeVictory(
  state: ChallengeProgress,
  stars: number,
  now: Date,
): ChallengeProgress {
  const ticked = tickChallengeRegen(state, now)
  const next = cloneChallenge(ticked)

  next.bestStars = Math.max(next.bestStars, stars)

  if (stars >= 3) {
    next.outcome = 'mastered'
    next.medalEarnedAt = next.medalEarnedAt ?? now.toISOString()
    next.attemptsAvailable = CHALLENGE_MAX_ATTEMPTS
    next.regenDueAt = []
    return next
  }

  if (stars >= 1 && next.outcome === 'none') {
    next.outcome = 'approved'
  }

  return next
}

export function getChallengeMapState(
  state: ChallengeProgress | undefined,
  now: Date,
): ChallengeMapState {
  if (!state) return 'active'
  if (isChallengeMastered(state)) return 'mastered'

  const ticked = tickChallengeRegen(state, now)
  if (ticked.outcome === 'approved') {
    return ticked.attemptsAvailable > 0 ? 'approved' : 'cooldown'
  }

  return ticked.attemptsAvailable > 0 ? 'active' : 'cooldown'
}

export function getNextAttemptAt(
  state: ChallengeProgress | undefined,
  now: Date,
): Date | null {
  if (!state || isChallengeMastered(state)) return null

  const ticked = tickChallengeRegen(state, now)
  if (ticked.attemptsAvailable > 0) return null
  if (ticked.regenDueAt.length === 0) return null

  const earliest = ticked.regenDueAt.sort()[0]
  return earliest ? new Date(earliest) : null
}

export function getAttemptsDisplay(
  state: ChallengeProgress | undefined,
  now: Date,
): { available: number; max: number } {
  if (!state || isChallengeMastered(state)) {
    return { available: CHALLENGE_MAX_ATTEMPTS, max: CHALLENGE_MAX_ATTEMPTS }
  }
  const ticked = tickChallengeRegen(state, now)
  return {
    available: ticked.attemptsAvailable,
    max: CHALLENGE_MAX_ATTEMPTS,
  }
}

export function countEarnedMedals(
  challenges: Record<number, ChallengeProgress> | undefined,
): number {
  if (!challenges) return 0
  return Object.values(challenges).filter((c) => c.outcome === 'mastered').length
}

export function migrateChallengeFromLevelProgress(
  levelProgress: LevelProgress | undefined,
): ChallengeProgress {
  if (!levelProgress?.completed) {
    return createInitialChallenge()
  }

  if (levelProgress.stars >= 3) {
    return {
      outcome: 'mastered',
      bestStars: levelProgress.stars,
      attemptsAvailable: CHALLENGE_MAX_ATTEMPTS,
      regenDueAt: [],
      medalEarnedAt: new Date(0).toISOString(),
    }
  }

  return {
    outcome: 'approved',
    bestStars: levelProgress.stars,
    attemptsAvailable: CHALLENGE_MAX_ATTEMPTS,
    regenDueAt: [],
  }
}

const OUTCOME_RANK: Record<ChallengeOutcome, number> = {
  none: 0,
  approved: 1,
  mastered: 2,
}

export function mergeChallengeProgress(
  local: ChallengeProgress | undefined,
  remote: ChallengeProgress | undefined,
): ChallengeProgress | undefined {
  if (!local && !remote) return undefined
  if (!local) return cloneChallenge(remote!)
  if (!remote) return cloneChallenge(local)

  const outcome =
    OUTCOME_RANK[local.outcome] >= OUTCOME_RANK[remote.outcome]
      ? local.outcome
      : remote.outcome

  const bestStars = Math.max(local.bestStars, remote.bestStars)

  const attemptsAvailable = Math.min(
    local.attemptsAvailable,
    remote.attemptsAvailable,
  )

  const regenDueAt = mergeRegenDueAt(local.regenDueAt, remote.regenDueAt)

  let medalEarnedAt: string | undefined
  if (local.medalEarnedAt && remote.medalEarnedAt) {
    medalEarnedAt =
      new Date(local.medalEarnedAt).getTime() <=
      new Date(remote.medalEarnedAt).getTime()
        ? local.medalEarnedAt
        : remote.medalEarnedAt
  } else {
    medalEarnedAt = local.medalEarnedAt ?? remote.medalEarnedAt
  }

  const merged: ChallengeProgress = {
    outcome,
    bestStars,
    attemptsAvailable: outcome === 'mastered' ? CHALLENGE_MAX_ATTEMPTS : attemptsAvailable,
    regenDueAt: outcome === 'mastered' ? [] : regenDueAt,
    medalEarnedAt,
    introSeen: local.introSeen || remote.introSeen,
  }

  return merged
}

function mergeRegenDueAt(local: string[], remote: string[]): string[] {
  const maxLen = Math.max(local.length, remote.length)
  if (maxLen === 0) return []

  const localSorted = [...local].sort()
  const remoteSorted = [...remote].sort()
  const merged: string[] = []

  for (let i = 0; i < maxLen; i++) {
    const l = localSorted[i]
    const r = remoteSorted[i]
    if (l && r) {
      merged.push(
        new Date(l).getTime() >= new Date(r).getTime() ? l : r,
      )
    } else if (l) {
      merged.push(l)
    } else if (r) {
      merged.push(r)
    }
  }

  return merged.sort()
}

export function challengesEqual(
  a: Record<number, ChallengeProgress> | undefined,
  b: Record<number, ChallengeProgress> | undefined,
): boolean {
  const ids = new Set([
    ...Object.keys(a ?? {}).map(Number),
    ...Object.keys(b ?? {}).map(Number),
  ])

  for (const id of ids) {
    const left = a?.[id]
    const right = b?.[id]
    if (!left && !right) continue
    if (!left || !right) return false
    if (
      left.outcome !== right.outcome
      || left.bestStars !== right.bestStars
      || left.attemptsAvailable !== right.attemptsAvailable
      || left.introSeen !== right.introSeen
      || left.medalEarnedAt !== right.medalEarnedAt
      || left.regenDueAt.length !== right.regenDueAt.length
      || left.regenDueAt.some((t, i) => t !== right.regenDueAt[i])
    ) {
      return false
    }
  }

  return true
}
