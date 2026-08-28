import { describe, expect, it } from 'vitest'
import { getPlayContext } from './gameEngine'
import {
  getMinSolutionMoves,
  isLevelSolvable,
  validateLevelStructure,
} from './levelValidator'
import type { LevelDefinition } from './types'

const variableCapacityTutorial: LevelDefinition = {
  id: 131,
  difficulty: 'easy',
  capacity: 4,
  bolts: [
    ['blue', 'orange', 'blue'],
    ['orange', 'blue', 'orange', 'blue'],
    [],
  ],
  minMoves: 0,
  parMoves: 0,
  mechanics: ['variableCapacity'],
  boltConfigs: [{ maxCapacity: 3 }, { maxCapacity: 4 }, {}],
}

describe('levelValidator — variableCapacity', () => {
  const ctx = getPlayContext(variableCapacityTutorial)

  it('validates structure with mixed capacities', () => {
    const result = validateLevelStructure(
      variableCapacityTutorial.bolts,
      variableCapacityTutorial.capacity,
      ctx,
    )
    expect(result.valid).toBe(true)
  })

  it('solves tutorial layout', () => {
    expect(
      isLevelSolvable(
        variableCapacityTutorial.bolts,
        variableCapacityTutorial.capacity,
        200_000,
        ctx,
      ),
    ).toBe(true)
    const minMoves = getMinSolutionMoves(
      variableCapacityTutorial.bolts,
      variableCapacityTutorial.capacity,
      200_000,
      ctx,
    )
    expect(minMoves).not.toBeNull()
    expect(minMoves!).toBeGreaterThan(0)
  })
})
