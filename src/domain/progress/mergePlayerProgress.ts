import type { LevelProgress, PlayerProgress } from '../types'

function mergeLevelProgress(
  local: LevelProgress | undefined,
  remote: LevelProgress | undefined,
): LevelProgress | undefined {
  if (!local && !remote) return undefined
  if (!local) return { ...remote! }
  if (!remote) return { ...local }

  const stars = Math.max(local.stars, remote.stars)
  const completed = local.completed || remote.completed

  const localMoves = local.bestMoves > 0 ? local.bestMoves : null
  const remoteMoves = remote.bestMoves > 0 ? remote.bestMoves : null

  let bestMoves = 0
  if (localMoves !== null && remoteMoves !== null) {
    bestMoves = Math.min(localMoves, remoteMoves)
  } else if (localMoves !== null) {
    bestMoves = localMoves
  } else if (remoteMoves !== null) {
    bestMoves = remoteMoves
  }

  return { stars, bestMoves, completed }
}

/** Fusiona progreso local y remoto sin pérdida: mejor resultado gana. */
export function mergePlayerProgress(
  local: PlayerProgress,
  remote: PlayerProgress,
): PlayerProgress {
  const levelIds = new Set([
    ...Object.keys(local.levels).map(Number),
    ...Object.keys(remote.levels).map(Number),
  ])

  const levels: Record<number, LevelProgress> = {}
  for (const id of levelIds) {
    const merged = mergeLevelProgress(local.levels[id], remote.levels[id])
    if (merged) {
      levels[id] = merged
    }
  }

  return {
    unlockedLevel: Math.max(local.unlockedLevel, remote.unlockedLevel),
    levels,
  }
}
