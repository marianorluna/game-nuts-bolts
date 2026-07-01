import { describe, expect, it } from 'vitest'
import { buildUpsertOptions, shouldSyncProgress } from './syncProgress'
import type { PlayerProgress } from '../domain/types'

const base: PlayerProgress = {
  unlockedLevel: 3,
  levels: {
    1: { stars: 2, bestMoves: 10, completed: true },
    2: { stars: 1, bestMoves: 12, completed: true },
  },
}

describe('shouldSyncProgress', () => {
  it('no sincroniza si el ranking no cambió', () => {
    expect(shouldSyncProgress(base, base)).toBe(false)
  })

  it('sincroniza al mejorar estrellas sin subir unlockedLevel', () => {
    const after: PlayerProgress = {
      ...base,
      levels: {
        ...base.levels,
        1: { stars: 3, bestMoves: 8, completed: true },
      },
    }
    expect(shouldSyncProgress(base, after)).toBe(true)
  })

  it('sincroniza al completar un nivel nuevo', () => {
    const after: PlayerProgress = {
      unlockedLevel: 4,
      levels: {
        ...base.levels,
        3: { stars: 1, bestMoves: 15, completed: true },
      },
    }
    expect(shouldSyncProgress(base, after)).toBe(true)
  })
})

describe('buildUpsertOptions', () => {
  it('no toca rank_snapshot_at si solo mejoran estrellas', () => {
    const after: PlayerProgress = {
      ...base,
      levels: {
        ...base.levels,
        1: { stars: 3, bestMoves: 8, completed: true },
      },
    }
    expect(buildUpsertOptions(base, after)).toBeUndefined()
  })

  it('fija rank_snapshot_at al subir unlockedLevel', () => {
    const after: PlayerProgress = {
      unlockedLevel: 4,
      levels: {
        ...base.levels,
        3: { stars: 1, bestMoves: 15, completed: true },
      },
    }
    const options = buildUpsertOptions(base, after)
    expect(options?.rankSnapshotAt).toBeTypeOf('string')
    expect(Number.isNaN(Date.parse(options!.rankSnapshotAt!))).toBe(false)
  })
})
