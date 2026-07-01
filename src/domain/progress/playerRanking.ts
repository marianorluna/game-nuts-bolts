import { MAX_LEVEL_ID } from '../levels'
import type { PlayerProgress, PlayerRankingEntry } from '../types'

/** Criterio 1: 1 punto por cada nivel completado. */
export function countCompletedLevels(progress: PlayerProgress): number {
  return Object.values(progress.levels).filter((level) => level.completed).length
}

/** Criterio 2: 1 punto por cada estrella obtenida. */
export function countTotalStars(progress: PlayerProgress): number {
  return Object.values(progress.levels).reduce((sum, level) => sum + level.stars, 0)
}

/** Criterio 3: 3 pts por nivel 3★, 2 por 2★, 1 por 1★. */
export function sumWeightedStarTierPoints(progress: PlayerProgress): number {
  return Object.values(progress.levels).reduce((sum, level) => {
    if (level.stars === 3) return sum + 3
    if (level.stars === 2) return sum + 2
    if (level.stars === 1) return sum + 1
    return sum
  }, 0)
}

/** Criterio 5: suma de bestMoves en completados (menor es mejor). */
export function sumTotalBestMoves(progress: PlayerProgress): number {
  return Object.values(progress.levels).reduce((sum, level) => {
    if (level.completed && level.bestMoves > 0) {
      return sum + level.bestMoves
    }
    return sum
  }, 0)
}

export interface RankingPointsBreakdown {
  /** Criterio 1 */
  completedLevels: number
  /** Criterio 2 */
  starPoints: number
  /** Criterio 3 */
  weightedTierPoints: number
  /** Suma acumulada 1 + 2 + 3 (visible en UI como “puntos” hasta el 3.er criterio) */
  cumulativeThrough3: number
}

export function computeRankingPointsThrough3(
  progress: PlayerProgress,
): RankingPointsBreakdown {
  const completedLevels = countCompletedLevels(progress)
  const starPoints = countTotalStars(progress)
  const weightedTierPoints = sumWeightedStarTierPoints(progress)
  return {
    completedLevels,
    starPoints,
    weightedTierPoints,
    cumulativeThrough3: completedLevels + starPoints + weightedTierPoints,
  }
}

export interface RankingStats {
  unlockedLevel: number
  completedLevels: number
  totalStars: number
  weightedTierPoints: number
  totalBestMoves: number
  cumulativePointsThrough3: number
}

export function deriveRankingStats(progress: PlayerProgress): RankingStats {
  const points = computeRankingPointsThrough3(progress)
  return {
    unlockedLevel: progress.unlockedLevel,
    completedLevels: points.completedLevels,
    totalStars: points.starPoints,
    weightedTierPoints: points.weightedTierPoints,
    totalBestMoves: sumTotalBestMoves(progress),
    cumulativePointsThrough3: points.cumulativeThrough3,
  }
}

/**
 * Criterio 4 — clave lexicográfica para ORDER BY en Supabase.
 * bestMoves por nivel completado, id alto→bajo, zero-padded. Menor clave = mejor.
 */
export function buildMovesTiebreakKey(
  progress: PlayerProgress,
  maxLevelId: number = MAX_LEVEL_ID,
): string {
  const parts: string[] = []
  for (let id = maxLevelId; id >= 1; id -= 1) {
    const level = progress.levels[id]
    if (!level?.completed || level.bestMoves <= 0) continue
    parts.push(String(level.bestMoves).padStart(6, '0'))
  }
  return parts.join('')
}

/** Criterio 4: bestMoves por nivel completado, del id más alto al más bajo (menor gana). */
function compareMovesLevelByLevel(
  a: PlayerProgress,
  b: PlayerProgress,
  maxLevelId: number = MAX_LEVEL_ID,
): number | null {
  for (let id = maxLevelId; id >= 1; id -= 1) {
    const aLevel = a.levels[id]
    const bLevel = b.levels[id]
    if (!aLevel?.completed || !bLevel?.completed) continue
    if (aLevel.bestMoves <= 0 || bLevel.bestMoves <= 0) continue
    const diff = aLevel.bestMoves - bLevel.bestMoves
    if (diff !== 0) return diff
  }
  return null
}

function compareHigherBetter(a: number, b: number): number | null {
  if (a === b) return null
  return a > b ? -1 : 1
}

function compareLowerBetter(a: number, b: number): number | null {
  if (a === b) return null
  return a < b ? -1 : 1
}

/**
 * Compara dos entradas de ranking (desempate secuencial por criterios 1→6).
 * Retorno negativo → `a` queda más arriba; positivo → `b`; 0 → empate total.
 *
 * Ver docs/RANKING_RULES.md — cada criterio solo aplica si los anteriores empatan.
 */
export function comparePlayerRank(
  a: PlayerRankingEntry,
  b: PlayerRankingEntry,
): number {
  const ap = a.progress
  const bp = b.progress

  const byCompleted = compareHigherBetter(
    countCompletedLevels(ap),
    countCompletedLevels(bp),
  )
  if (byCompleted !== null) return byCompleted

  const byStars = compareHigherBetter(countTotalStars(ap), countTotalStars(bp))
  if (byStars !== null) return byStars

  const byWeightedTiers = compareHigherBetter(
    sumWeightedStarTierPoints(ap),
    sumWeightedStarTierPoints(bp),
  )
  if (byWeightedTiers !== null) return byWeightedTiers

  const byMovesPerLevel = compareMovesLevelByLevel(ap, bp)
  if (byMovesPerLevel !== null) return byMovesPerLevel

  const byTotalMoves = compareLowerBetter(
    sumTotalBestMoves(ap),
    sumTotalBestMoves(bp),
  )
  if (byTotalMoves !== null) return byTotalMoves

  const timeA = Date.parse(a.meta.rankSnapshotAt)
  const timeB = Date.parse(b.meta.rankSnapshotAt)
  if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
    return timeA < timeB ? -1 : 1
  }

  return 0
}

export function sortRankingEntries(
  entries: PlayerRankingEntry[],
): PlayerRankingEntry[] {
  return [...entries].sort(comparePlayerRank)
}

/**
 * Actualiza rankSnapshotAt al completar un nivel que sube unlockedLevel
 * (llegar antes al techo actual de avance — criterio 6).
 */
export function shouldUpdateRankSnapshot(
  before: PlayerProgress,
  after: PlayerProgress,
): boolean {
  return after.unlockedLevel > before.unlockedLevel
}

/** Cambió algo que afecta criterios 1–5 (sync a nube). */
export function hasRankingStatsChanged(
  before: PlayerProgress,
  after: PlayerProgress,
): boolean {
  return (
    countCompletedLevels(before) !== countCompletedLevels(after)
    || countTotalStars(before) !== countTotalStars(after)
    || sumWeightedStarTierPoints(before) !== sumWeightedStarTierPoints(after)
    || sumTotalBestMoves(before) !== sumTotalBestMoves(after)
    || compareMovesLevelByLevel(before, after) !== null
  )
}
