import { BAKED_LEVELS } from './bakedLevels'
import type { LevelDefinition } from '../types'

export const ALL_LEVELS: LevelDefinition[] = BAKED_LEVELS

export const TOTAL_LEVEL_COUNT = ALL_LEVELS.length

export const MAX_LEVEL_ID = ALL_LEVELS[ALL_LEVELS.length - 1]?.id ?? 0
export function getLevelById(id: number): LevelDefinition | undefined {
  return ALL_LEVELS.find((level) => level.id === id)
}

export const easyLevels = ALL_LEVELS.filter((l) => l.difficulty === 'easy')
export const mediumLevels = ALL_LEVELS.filter((l) => l.difficulty === 'medium')
export const hardLevels = ALL_LEVELS.filter((l) => l.difficulty === 'hard')
