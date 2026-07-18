import { describe, expect, it } from 'vitest'
import {
  comparePlayerRank,
  computeRankingPointsThrough3,
  countCompletedLevels,
  countTotalStars,
  deriveRankingStats,
  shouldUpdateRankSnapshot,
  sortRankingEntries,
  sumTotalBestMoves,
  sumWeightedStarTierPoints,
} from './playerRanking'
import type { PlayerProgress, PlayerRankingEntry } from '../types'

const level = (
  stars: number,
  bestMoves: number,
  completed = true,
): PlayerProgress['levels'][number] => ({
  stars,
  bestMoves,
  completed,
})

function entry(
  progress: PlayerProgress,
  rankSnapshotAt: string,
): PlayerRankingEntry {
  return { progress, meta: { rankSnapshotAt } }
}

function buildCompletedLevels(
  count: number,
  starsPerLevel: number,
  bestMoves = 10,
): Record<number, PlayerProgress['levels'][number]> {
  const levels: Record<number, PlayerProgress['levels'][number]> = {}
  for (let id = 1; id <= count; id += 1) {
    levels[id] = level(starsPerLevel, bestMoves)
  }
  return levels
}

describe('ranking points (criterios 1–3)', () => {
  it('acumula puntos como en el ejemplo del diseño', () => {
    const progress: PlayerProgress = {
      unlockedLevel: 101,
      levels: buildCompletedLevels(100, 3),
    }

    // 95 niveles normales × 3 pts + 5 retos × 30 pts = 285 + 150
    const points = computeRankingPointsThrough3(progress)
    expect(points.completedLevels).toBe(100)
    expect(points.starPoints).toBe(300)
    expect(points.weightedTierPoints).toBe(435)
    expect(points.cumulativeThrough3).toBe(835)
  })

  it('pondera 3★/2★/1★ en el criterio 3', () => {
    const progress: PlayerProgress = {
      unlockedLevel: 4,
      levels: {
        1: level(3, 4),
        2: level(2, 6),
        3: level(1, 8),
      },
    }

    expect(sumWeightedStarTierPoints(progress)).toBe(6)
    expect(deriveRankingStats(progress).cumulativePointsThrough3).toBe(3 + 6 + 6)
  })

  it('retos suman 10 pts por estrella (10 / 20 / 30)', () => {
    const progress: PlayerProgress = {
      unlockedLevel: 101,
      levels: {
        20: level(1, 12),
        40: level(2, 14),
        60: level(3, 10),
      },
    }

    expect(sumWeightedStarTierPoints(progress)).toBe(10 + 20 + 30)
    expect(deriveRankingStats(progress).cumulativePointsThrough3).toBe(
      3 + (1 + 2 + 3) + (10 + 20 + 30),
    )
  })
})

describe('comparePlayerRank', () => {
  it('criterio 1: más niveles completados queda arriba', () => {
    const ahead = entry(
      {
        unlockedLevel: 31,
        levels: buildCompletedLevels(30, 2),
      },
      '2026-01-01T00:00:00Z',
    )
    const behind = entry(
      {
        unlockedLevel: 30,
        levels: buildCompletedLevels(29, 3),
      },
      '2026-01-01T00:00:00Z',
    )

    expect(comparePlayerRank(ahead, behind)).toBeLessThan(0)
  })

  it('criterio 2: desempata con estrellas totales (1 pt por estrella)', () => {
    const a = entry(
      {
        unlockedLevel: 3,
        levels: { 1: level(3, 4), 2: level(3, 5) },
      },
      '2026-01-01T00:00:00Z',
    )
    const b = entry(
      {
        unlockedLevel: 3,
        levels: { 1: level(3, 4), 2: level(1, 8) },
      },
      '2026-01-01T00:00:00Z',
    )

    expect(comparePlayerRank(a, b)).toBeLessThan(0)
  })

  it('criterio 3: desempata con puntos ponderados por tipo de estrella', () => {
    const a = entry(
      {
        unlockedLevel: 4,
        levels: { 1: level(3, 4), 2: level(3, 5), 3: level(2, 8) },
      },
      '2026-01-01T00:00:00Z',
    )
    const b = entry(
      {
        unlockedLevel: 4,
        levels: { 1: level(3, 4), 2: level(2, 6), 3: level(2, 7) },
      },
      '2026-01-01T00:00:00Z',
    )

    expect(comparePlayerRank(a, b)).toBeLessThan(0)
  })

  it('criterio 3: un reto a 3★ gana a otro a 1★ a igualdad de estrellas totales', () => {
    const masteredChallenge = entry(
      {
        unlockedLevel: 21,
        levels: {
          ...buildCompletedLevels(19, 1, 10),
          20: level(3, 8),
        },
      },
      '2026-01-01T00:00:00Z',
    )
    const approvedChallenge = entry(
      {
        unlockedLevel: 21,
        levels: {
          ...buildCompletedLevels(19, 1, 10),
          20: level(1, 8),
          // +2★ en nivel normal para empatar estrellas totales (22)
          19: level(3, 10),
        },
      },
      '2026-01-01T00:00:00Z',
    )

    expect(countTotalStars(masteredChallenge.progress)).toBe(
      countTotalStars(approvedChallenge.progress),
    )
    expect(comparePlayerRank(masteredChallenge, approvedChallenge)).toBeLessThan(0)
  })

  it('criterio 4: compara movimientos del nivel más alto hacia abajo', () => {
    const a = entry(
      {
        unlockedLevel: 101,
        levels: {
          ...buildCompletedLevels(98, 2, 10),
          99: level(2, 10),
          100: level(2, 32),
        },
      },
      '2026-01-01T00:00:00Z',
    )
    const b = entry(
      {
        unlockedLevel: 101,
        levels: {
          ...buildCompletedLevels(98, 2, 10),
          99: level(2, 10),
          100: level(2, 31),
        },
      },
      '2026-01-01T00:00:00Z',
    )

    expect(computeRankingPointsThrough3(a.progress).cumulativeThrough3).toBe(
      computeRankingPointsThrough3(b.progress).cumulativeThrough3,
    )
    expect(comparePlayerRank(a, b)).toBeGreaterThan(0)
  })

  it('criterio 4: si empatan en un nivel, sigue con el siguiente más bajo', () => {
    const a = entry(
      {
        unlockedLevel: 11,
        levels: {
          9: level(2, 8),
          10: level(2, 5),
        },
      },
      '2026-01-01T00:00:00Z',
    )
    const b = entry(
      {
        unlockedLevel: 11,
        levels: {
          9: level(2, 7),
          10: level(2, 5),
        },
      },
      '2026-01-01T00:00:00Z',
    )

    expect(comparePlayerRank(a, b)).toBeGreaterThan(0)
  })

  it('criterio 5: desempata con suma total de movimientos', () => {
    const a = entry(
      {
        unlockedLevel: 3,
        levels: { 1: level(2, 5), 2: level(2, 5) },
      },
      '2026-01-02T00:00:00Z',
    )
    const b = entry(
      {
        unlockedLevel: 3,
        levels: { 1: level(2, 6), 2: level(2, 6) },
      },
      '2026-01-01T00:00:00Z',
    )

    expect(sumTotalBestMoves(a.progress)).toBe(10)
    expect(sumTotalBestMoves(b.progress)).toBe(12)
    expect(comparePlayerRank(a, b)).toBeLessThan(0)
  })

  it('criterio 6: gana quien alcanzó antes el techo de avance (rankSnapshotAt)', () => {
    const earlier = entry(
      {
        unlockedLevel: 3,
        levels: { 1: level(2, 6), 2: level(2, 6) },
      },
      '2026-01-01T10:00:00Z',
    )
    const later = entry(
      {
        unlockedLevel: 3,
        levels: { 1: level(2, 6), 2: level(2, 6) },
      },
      '2026-01-02T10:00:00Z',
    )

    expect(comparePlayerRank(earlier, later)).toBeLessThan(0)
  })

  it('ejemplo narrativo: 690 pts acumulados y desempate en nivel 100 por movimientos', () => {
    const player1 = entry(
      {
        unlockedLevel: 101,
        levels: {
          ...buildCompletedLevels(98, 2, 10),
          99: level(2, 10),
          100: level(2, 32),
        },
      },
      '2026-01-02T00:00:00Z',
    )
    const player2 = entry(
      {
        unlockedLevel: 101,
        levels: {
          ...buildCompletedLevels(98, 2, 10),
          99: level(2, 10),
          100: level(2, 31),
        },
      },
      '2026-01-03T00:00:00Z',
    )

    const p1 = computeRankingPointsThrough3(player1.progress)
    const p2 = computeRankingPointsThrough3(player2.progress)
    expect(p1.completedLevels).toBe(100)
    expect(p2.completedLevels).toBe(100)
    expect(p1.cumulativeThrough3).toBe(p2.cumulativeThrough3)
    expect(comparePlayerRank(player2, player1)).toBeLessThan(0)
  })

  it('ordena una lista completa con sortRankingEntries', () => {
    const entries = [
      entry({ unlockedLevel: 2, levels: { 1: level(1, 4) } }, '2026-01-01T00:00:00Z'),
      entry(
        { unlockedLevel: 3, levels: { 1: level(3, 4), 2: level(2, 5) } },
        '2026-01-01T00:00:00Z',
      ),
      entry({ unlockedLevel: 3, levels: { 1: level(2, 4), 2: level(2, 5) } }, '2026-01-01T00:00:00Z'),
    ]

    const sorted = sortRankingEntries(entries)
    expect(countCompletedLevels(sorted[0]!.progress)).toBe(2)
    expect(sorted[0]!.progress.levels[1]!.stars).toBe(3)
    expect(countCompletedLevels(sorted[2]!.progress)).toBe(1)
  })
})

describe('shouldUpdateRankSnapshot', () => {
  it('solo actualiza al subir unlockedLevel', () => {
    const before: PlayerProgress = { unlockedLevel: 10, levels: { 9: level(3, 4) } }
    const afterMoreStars: PlayerProgress = {
      unlockedLevel: 10,
      levels: { 9: level(3, 3) },
    }
    const afterNewLevel: PlayerProgress = {
      unlockedLevel: 11,
      levels: { 9: level(3, 4), 10: level(2, 8) },
    }

    expect(shouldUpdateRankSnapshot(before, afterMoreStars)).toBe(false)
    expect(shouldUpdateRankSnapshot(before, afterNewLevel)).toBe(true)
  })
})
