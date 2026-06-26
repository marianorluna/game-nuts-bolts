import type { Bolt, BoltConfig } from './types'

export interface HandCraftedLevel {
  id: number
  difficulty: 'easy' | 'medium' | 'hard'
  capacity: 4
  bolts: Bolt[]
  boltConfigs: BoltConfig[]
}

/**
 * Tutoriales de bulones bloqueados (81–84).
 * Layouts compactos validados con BFS (multiNut + lockedBolt).
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
]

export function getHandCraftedLevel(id: number): HandCraftedLevel | undefined {
  return HAND_CRAFTED_LEVELS.find((level) => level.id === id)
}
