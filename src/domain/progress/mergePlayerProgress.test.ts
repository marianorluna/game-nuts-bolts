import { describe, expect, it } from 'vitest'
import { mergePlayerProgress } from './mergePlayerProgress'
import type { PlayerProgress } from '../types'

const level = (
  stars: number,
  bestMoves: number,
  completed = true,
): PlayerProgress['levels'][number] => ({
  stars,
  bestMoves,
  completed,
})

describe('mergePlayerProgress', () => {
  it('conserva el mejor progreso local cuando local es superior', () => {
    const local: PlayerProgress = {
      unlockedLevel: 31,
      levels: {
        1: level(3, 4),
        30: level(2, 8),
      },
    }
    const remote: PlayerProgress = {
      unlockedLevel: 15,
      levels: {
        1: level(2, 6),
        10: level(1, 12),
      },
    }

    const merged = mergePlayerProgress(local, remote)

    expect(merged.unlockedLevel).toBe(31)
    expect(merged.levels[1]).toEqual({ stars: 3, bestMoves: 4, completed: true })
    expect(merged.levels[10]).toEqual({ stars: 1, bestMoves: 12, completed: true })
    expect(merged.levels[30]).toEqual({ stars: 2, bestMoves: 8, completed: true })
  })

  it('conserva el mejor progreso remoto cuando remoto es superior', () => {
    const local: PlayerProgress = {
      unlockedLevel: 10,
      levels: {
        5: level(1, 15),
      },
    }
    const remote: PlayerProgress = {
      unlockedLevel: 50,
      levels: {
        5: level(3, 5),
        49: level(2, 10),
      },
    }

    const merged = mergePlayerProgress(local, remote)

    expect(merged.unlockedLevel).toBe(50)
    expect(merged.levels[5]).toEqual({ stars: 3, bestMoves: 5, completed: true })
    expect(merged.levels[49]).toEqual({ stars: 2, bestMoves: 10, completed: true })
  })

  it('empata tomando max estrellas y min movimientos cuando ambos tienen el nivel', () => {
    const local: PlayerProgress = {
      unlockedLevel: 20,
      levels: {
        7: level(3, 10),
      },
    }
    const remote: PlayerProgress = {
      unlockedLevel: 20,
      levels: {
        7: level(2, 6),
      },
    }

    const merged = mergePlayerProgress(local, remote)

    expect(merged.unlockedLevel).toBe(20)
    expect(merged.levels[7]).toEqual({ stars: 3, bestMoves: 6, completed: true })
  })

  it('fusiona nivel presente solo en un lado', () => {
    const local: PlayerProgress = {
      unlockedLevel: 25,
      levels: {
        24: level(3, 5),
      },
    }
    const remote: PlayerProgress = {
      unlockedLevel: 25,
      levels: {
        20: level(1, 14),
      },
    }

    const merged = mergePlayerProgress(local, remote)

    expect(merged.levels[24]).toEqual({ stars: 3, bestMoves: 5, completed: true })
    expect(merged.levels[20]).toEqual({ stars: 1, bestMoves: 14, completed: true })
  })

  it('marca completed si cualquiera de los dos lo completó', () => {
    const local: PlayerProgress = {
      unlockedLevel: 8,
      levels: {
        7: { stars: 0, bestMoves: 0, completed: true },
      },
    }
    const remote: PlayerProgress = {
      unlockedLevel: 7,
      levels: {
        7: { stars: 2, bestMoves: 9, completed: false },
      },
    }

    const merged = mergePlayerProgress(local, remote)

    expect(merged.levels[7]).toEqual({ stars: 2, bestMoves: 9, completed: true })
  })
})
