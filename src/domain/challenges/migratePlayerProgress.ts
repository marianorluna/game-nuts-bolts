import { CHALLENGE_LEVEL_IDS } from '../content/campaignStructure'
import type { PlayerProgress } from '../types'
import { migrateChallengeFromLevelProgress } from './challengeProgress'

/** Rellena `challenges` desde niveles completados (idempotente). */
export function migratePlayerProgressChallenges(
  progress: PlayerProgress,
): PlayerProgress {
  const existing = progress.challenges ?? {}
  const challenges = { ...existing }
  let changed = false

  for (const levelId of CHALLENGE_LEVEL_IDS) {
    if (challenges[levelId]) continue
    const migrated = migrateChallengeFromLevelProgress(progress.levels[levelId])
    challenges[levelId] = migrated
    changed = true
  }

  if (!changed && progress.challenges) {
    return progress
  }

  return { ...progress, challenges }
}
