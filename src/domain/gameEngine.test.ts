import { describe, expect, it } from 'vitest'
import {
  canMove,
  getBoltCapacity,
  isSolved,
  moveNuts,
} from './gameEngine'
import type { GamePlayContext } from './types'

describe('gameEngine — variableCapacity', () => {
  const ctx: GamePlayContext = {
    multiNut: false,
    boltConfigs: [{ maxCapacity: 3 }, { maxCapacity: 5 }, {}],
  }

  it('rejects move when destination exceeds per-bolt capacity', () => {
    const bolts = [
      ['orange', 'orange', 'orange'],
      ['blue', 'blue', 'blue', 'blue'],
      [],
    ]
    expect(canMove(bolts, 0, 1, 4, ctx)).toBe(false)
    expect(getBoltCapacity(0, 4, ctx)).toBe(3)
    expect(getBoltCapacity(1, 4, ctx)).toBe(5)
  })

  it('allows move into taller bolt', () => {
    const bolts = [
      ['orange'],
      [],
      ['blue', 'blue', 'blue', 'blue'],
    ]
    expect(canMove(bolts, 0, 1, 4, ctx)).toBe(true)
    const result = moveNuts(bolts, 0, 1, 4, ctx)
    expect(result?.bolts[1]).toEqual(['orange'])
  })

  it('detects solved state with mixed capacities', () => {
    const solved = [
      ['orange', 'orange', 'orange'],
      ['blue', 'blue', 'blue', 'blue', 'blue'],
      [],
    ]
    expect(isSolved(solved, 4, ctx)).toBe(true)

    const unsolved = [
      ['orange', 'orange', 'orange'],
      ['blue', 'blue', 'blue', 'blue'],
      [],
    ]
    expect(isSolved(unsolved, 4, ctx)).toBe(false)
  })
})

describe('gameEngine — fixedColorBolt', () => {
  const ctx: GamePlayContext = {
    multiNut: false,
    boltConfigs: [{}, { fixedColor: 'blue' }, {}],
  }

  it('rejects wrong color on empty fixed bolt', () => {
    const bolts = [['orange'], [], []]
    expect(canMove(bolts, 0, 1, 4, ctx)).toBe(false)
  })

  it('allows matching color on empty fixed bolt', () => {
    const bolts = [['blue'], [], []]
    expect(canMove(bolts, 0, 1, 4, ctx)).toBe(true)
  })

  it('allows stacking same color on partial fixed bolt', () => {
    const bolts = [['blue'], ['blue'], []]
    expect(canMove(bolts, 0, 1, 4, ctx)).toBe(true)
  })
})
