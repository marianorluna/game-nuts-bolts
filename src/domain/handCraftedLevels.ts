import type { Bolt, BoltConfig } from './types'

export interface HandCraftedLevel {
  id: number
  difficulty: 'easy' | 'medium' | 'hard'
  capacity: 4
  bolts: Bolt[]
  boltConfigs: BoltConfig[]
  mechanics?: import('./types').MechanicId[]
}

/**
 * Tutoriales hand-crafted validados con BFS.
 */
export const HAND_CRAFTED_LEVELS: HandCraftedLevel[] = [
  {
    id: 81,
    difficulty: 'easy',
    capacity: 4,
    bolts: [
      ['blue', 'orange', 'blue', 'orange'],
      ['orange', 'blue', 'orange', 'blue'],
      [],
      [],
    ],
    boltConfigs: [
      {},
      {},
      {},
      { locked: true, unlockWhenColor: 'orange' },
    ],
  },
  {
    id: 82,
    difficulty: 'easy',
    capacity: 4,
    bolts: [
      ['pink', 'green', 'pink', 'green'],
      ['green', 'pink', 'green', 'pink'],
      [],
      [],
    ],
    boltConfigs: [
      {},
      {},
      {},
      { locked: true, unlockWhenColor: 'green' },
    ],
  },
  {
    id: 83,
    difficulty: 'medium',
    capacity: 4,
    bolts: [
      ['yellow', 'red', 'blue', 'yellow'],
      ['blue', 'red', 'yellow', 'blue'],
      ['red', 'blue', 'yellow', 'red'],
      [],
      [],
    ],
    boltConfigs: [
      {},
      {},
      {},
      {},
      { locked: true, unlockWhenColor: 'blue' },
      { locked: true, unlockWhenColor: 'red' },
    ],
  },
  {
    id: 84,
    difficulty: 'medium',
    capacity: 4,
    bolts: [
      ['orange', 'purple', 'orange', 'purple'],
      ['purple', 'orange', 'purple', 'orange'],
      [],
      [],
    ],
    boltConfigs: [
      {},
      {},
      {},
      { locked: true, unlockWhenColor: 'purple' },
    ],
  },
  {
    id: 131,
    difficulty: 'easy',
    capacity: 4,
    mechanics: ['multiNut', 'lockedBolt', 'variableCapacity'],
    bolts: [
      ['blue', 'orange', 'blue'],
      ['orange', 'blue', 'orange', 'blue'],
      [],
    ],
    boltConfigs: [{ maxCapacity: 3 }, { maxCapacity: 4 }, {}],
  },
  {
    id: 132,
    difficulty: 'easy',
    capacity: 4,
    mechanics: ['multiNut', 'lockedBolt', 'variableCapacity'],
    bolts: [
      ['pink', 'orange', 'pink'],
      ['blue', 'blue', 'orange', 'pink'],
      ['orange', 'blue', 'blue', 'blue'],
      [],
    ],
    boltConfigs: [{ maxCapacity: 3 }, { maxCapacity: 4 }, { maxCapacity: 5 }, {}],
  },
  {
    id: 133,
    difficulty: 'easy',
    capacity: 4,
    mechanics: ['multiNut', 'lockedBolt', 'variableCapacity'],
    bolts: [
      ['green', 'yellow', 'green'],
      ['red', 'green', 'yellow', 'green'],
      ['yellow', 'red', 'red'],
      [],
    ],
    boltConfigs: [{ maxCapacity: 3 }, { maxCapacity: 4 }, { maxCapacity: 3 }, {}],
  },
  {
    id: 134,
    difficulty: 'medium',
    capacity: 4,
    mechanics: ['multiNut', 'lockedBolt', 'variableCapacity'],
    bolts: [
      ['blue', 'orange', 'blue'],
      ['pink', 'green', 'orange', 'blue'],
      ['green', 'pink', 'pink', 'pink'],
      ['orange', 'green', 'green'],
      [],
    ],
    boltConfigs: [
      { maxCapacity: 3 },
      { maxCapacity: 4 },
      { maxCapacity: 5 },
      { maxCapacity: 3 },
      {},
    ],
  },
  {
    id: 166,
    difficulty: 'easy',
    capacity: 4,
    mechanics: ['multiNut', 'lockedBolt', 'variableCapacity', 'fixedColorBolt'],
    bolts: [
      ['pink', 'orange'],
      ['blue', 'pink'],
      [],
      [],
    ],
    boltConfigs: [{}, { fixedColor: 'blue' }, {}, {}],
  },
  {
    id: 167,
    difficulty: 'easy',
    capacity: 4,
    mechanics: ['multiNut', 'lockedBolt', 'variableCapacity', 'fixedColorBolt'],
    bolts: [
      ['green', 'yellow'],
      ['yellow', 'green'],
      ['pink', 'orange', 'orange', 'orange'],
      [],
    ],
    boltConfigs: [{}, {}, { fixedColor: 'orange' }, {}],
  },
  {
    id: 168,
    difficulty: 'medium',
    capacity: 4,
    mechanics: ['multiNut', 'lockedBolt', 'variableCapacity', 'fixedColorBolt'],
    bolts: [
      ['blue', 'pink', 'blue'],
      ['pink', 'blue', 'pink'],
      ['red', 'red', 'red', 'red'],
      ['yellow', 'yellow', 'yellow', 'yellow'],
      [],
    ],
    boltConfigs: [
      { maxCapacity: 3 },
      { maxCapacity: 3 },
      { fixedColor: 'red' },
      { fixedColor: 'yellow' },
      {},
    ],
  },
  {
    id: 169,
    difficulty: 'medium',
    capacity: 4,
    mechanics: ['multiNut', 'lockedBolt', 'variableCapacity', 'fixedColorBolt'],
    bolts: [
      ['purple', 'green', 'purple'],
      ['green', 'purple', 'green'],
      ['orange', 'orange', 'orange', 'orange'],
      [],
      [],
    ],
    boltConfigs: [
      { maxCapacity: 3 },
      { maxCapacity: 3 },
      { fixedColor: 'orange' },
      {},
      {},
    ],
  },
]

export function getHandCraftedLevel(id: number): HandCraftedLevel | undefined {
  return HAND_CRAFTED_LEVELS.find((level) => level.id === id)
}
