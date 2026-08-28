import type {
  BoltConfig,
  LevelDefinition,
  MechanicId,
  NutColor,
} from './types'
import type { GenerateLevelParams } from './levelGenerator'
import type { LevelQualityCriteria } from './levelValidator'

const C7: NutColor[] = [
  'orange',
  'blue',
  'pink',
  'green',
  'yellow',
  'red',
  'purple',
]
const C6 = C7.slice(0, 6)

function q(
  minSolutionMoves: number,
  minSplitColors: number,
  maxCompleteBolts: number,
): LevelQualityCriteria {
  return { minSolutionMoves, minSplitColors, maxCompleteBolts }
}

type WaveSlot = {
  difficulty: LevelDefinition['difficulty']
  emptyBolts: 1 | 2
  minMoves: number
  colors: NutColor[]
  lockedBolt?: { boltIndex: number; unlockWhenColor: NutColor }
  boltConfigs?: BoltConfig[]
  filledCapacities?: number[]
  handCraftedId?: number
}

function specFromSlot(
  id: number,
  slot: WaveSlot,
  seed: number,
  mechanics: MechanicId[],
): GenerateLevelParams {
  const qualityMinMoves = slot.handCraftedId
    ? slot.minMoves
    : Math.min(slot.minMoves, 6 + slot.colors.length)
  return {
    id,
    difficulty: slot.difficulty,
    colors: slot.colors,
    capacity: 4,
    emptyBolts: slot.emptyBolts,
    shuffleMoves: 0,
    parMoves: slot.minMoves + 2,
    seed,
    scrambleMethod: 'random',
    quality: q(qualityMinMoves, slot.handCraftedId ? 2 : Math.min(6, slot.colors.length), 0),
    mechanics,
    lockedBolt: slot.lockedBolt,
    boltConfigs: slot.boltConfigs,
    filledCapacities: slot.filledCapacities,
    handCraftedId: slot.handCraftedId,
  }
}

function buildWave(
  fromId: number,
  slots: WaveSlot[],
  seedBase: number,
  mechanics: MechanicId[],
): GenerateLevelParams[] {
  return slots.map((slot, index) =>
    specFromSlot(fromId + index, slot, seedBase + index * 17, mechanics),
  )
}

const STAGE_4_WAVE: WaveSlot[] = [
  { difficulty: 'easy', emptyBolts: 2, minMoves: 20, colors: C6 },
  { difficulty: 'easy', emptyBolts: 2, minMoves: 21, colors: C6 },
  { difficulty: 'easy', emptyBolts: 2, minMoves: 22, colors: C7 },
  { difficulty: 'easy', emptyBolts: 2, minMoves: 23, colors: C7 },
  { difficulty: 'easy', emptyBolts: 2, minMoves: 24, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 25, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 26, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 27, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 28, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 29, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 30, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 31, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 32,
    colors: C7,
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'orange' },
  },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 33,
    colors: C7,
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'blue' },
  },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 34,
    colors: C7,
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'pink' },
  },
  { difficulty: 'easy', emptyBolts: 2, minMoves: 22, colors: C6 },
  { difficulty: 'easy', emptyBolts: 2, minMoves: 23, colors: C6 },
  { difficulty: 'easy', emptyBolts: 2, minMoves: 24, colors: C7 },
  {
    difficulty: 'easy',
    emptyBolts: 2,
    minMoves: 24,
    colors: C7,
    lockedBolt: { boltIndex: 6, unlockWhenColor: 'yellow' },
  },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 30, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 31, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 32, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 34, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 35, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 36,
    colors: C7,
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'red' },
  },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 36, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 37, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 38,
    colors: C7,
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'purple' },
  },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 38, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 38,
    colors: C7,
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'purple' },
  },
]

const STAGE_5_WAVE: WaveSlot[] = [
  {
    difficulty: 'easy',
    emptyBolts: 2,
    minMoves: 6,
    colors: ['orange', 'blue', 'pink'],
    handCraftedId: 131,
  },
  {
    difficulty: 'easy',
    emptyBolts: 2,
    minMoves: 8,
    colors: ['orange', 'blue', 'pink'],
    boltConfigs: [{ maxCapacity: 3 }, { maxCapacity: 4 }, { maxCapacity: 5 }, {}],
    filledCapacities: [3, 4, 5],
  },
  {
    difficulty: 'easy',
    emptyBolts: 2,
    minMoves: 8,
    colors: ['green', 'yellow', 'red'],
    boltConfigs: [{ maxCapacity: 3 }, { maxCapacity: 4 }, { maxCapacity: 3 }, {}],
    filledCapacities: [3, 4, 3],
  },
  {
    difficulty: 'medium',
    emptyBolts: 2,
    minMoves: 10,
    colors: ['orange', 'blue', 'pink', 'green'],
    boltConfigs: [
      { maxCapacity: 3 },
      { maxCapacity: 4 },
      { maxCapacity: 5 },
      { maxCapacity: 3 },
      {},
    ],
    filledCapacities: [3, 4, 5, 3],
  },
  {
    difficulty: 'easy',
    emptyBolts: 2,
    minMoves: 24,
    colors: C6,
    boltConfigs: [{ maxCapacity: 3 }, {}, {}, {}, {}, {}, {}, {}],
    filledCapacities: [3, 4, 4, 4, 4, 4],
  },
  {
    difficulty: 'easy',
    emptyBolts: 2,
    minMoves: 25,
    colors: C6,
    boltConfigs: [{}, { maxCapacity: 5 }, {}, {}, {}, {}, {}, {}],
    filledCapacities: [4, 5, 4, 4, 4, 4],
  },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 26, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 27, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 28, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 29, colors: C7 },
  {
    difficulty: 'medium',
    emptyBolts: 1,
    minMoves: 28,
    colors: C7,
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'green' },
  },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 30, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 31, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 32, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 32,
    colors: C7,
    boltConfigs: [{ maxCapacity: 3 }, {}, {}, {}, {}, {}, {}, {}],
    filledCapacities: [3, 4, 4, 4, 4, 4, 4],
  },
  { difficulty: 'easy', emptyBolts: 2, minMoves: 24, colors: C6 },
  { difficulty: 'easy', emptyBolts: 2, minMoves: 25, colors: C7 },
  { difficulty: 'easy', emptyBolts: 2, minMoves: 26, colors: C7 },
  {
    difficulty: 'easy',
    emptyBolts: 2,
    minMoves: 26,
    colors: C7,
    lockedBolt: { boltIndex: 6, unlockWhenColor: 'red' },
  },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 30, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 31, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 32, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 33, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 34, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 34,
    colors: C7,
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'yellow' },
  },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 35, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 36, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 36,
    colors: C7,
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'purple' },
  },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 33, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 34, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 35, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 36, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 37, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 38,
    colors: C7,
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'orange' },
  },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 39, colors: C7 },
]

const STAGE_6_WAVE: WaveSlot[] = [
  {
    difficulty: 'easy',
    emptyBolts: 2,
    minMoves: 8,
    colors: ['orange', 'blue', 'pink'],
    boltConfigs: [{}, { fixedColor: 'blue' }, {}, {}],
  },
  {
    difficulty: 'easy',
    emptyBolts: 2,
    minMoves: 8,
    colors: ['orange', 'green', 'yellow'],
    boltConfigs: [{}, {}, { fixedColor: 'orange' }, {}],
  },
  {
    difficulty: 'medium',
    emptyBolts: 2,
    minMoves: 10,
    colors: ['blue', 'pink', 'red', 'yellow'],
    boltConfigs: [
      { maxCapacity: 3 },
      { maxCapacity: 3 },
      { fixedColor: 'red' },
      { fixedColor: 'yellow' },
      {},
    ],
    filledCapacities: [3, 3, 4, 4],
  },
  {
    difficulty: 'medium',
    emptyBolts: 2,
    minMoves: 10,
    colors: ['purple', 'green', 'orange'],
    boltConfigs: [
      { maxCapacity: 3 },
      { maxCapacity: 3 },
      { fixedColor: 'orange' },
      {},
      {},
    ],
    filledCapacities: [3, 3, 4],
  },
  {
    difficulty: 'easy',
    emptyBolts: 2,
    minMoves: 26,
    colors: C6,
    boltConfigs: [{}, { fixedColor: 'blue' }, {}, {}, {}, {}, {}, {}],
  },
  {
    difficulty: 'easy',
    emptyBolts: 2,
    minMoves: 27,
    colors: C6,
    boltConfigs: [{}, {}, { fixedColor: 'green' }, {}, {}, {}, {}, {}],
  },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 28, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 29, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 30, colors: C7 },
  {
    difficulty: 'medium',
    emptyBolts: 1,
    minMoves: 30,
    colors: C7,
    boltConfigs: [{}, { fixedColor: 'pink' }, {}, {}, {}, {}, {}, {}],
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'orange' },
  },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 31, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 32, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 33, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 34, colors: C7 },
  { difficulty: 'easy', emptyBolts: 2, minMoves: 26, colors: C6 },
  { difficulty: 'easy', emptyBolts: 2, minMoves: 27, colors: C7 },
  {
    difficulty: 'easy',
    emptyBolts: 2,
    minMoves: 28,
    colors: C7,
    boltConfigs: [{ fixedColor: 'yellow' }, {}, {}, {}, {}, {}, {}, {}],
  },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 32, colors: C7 },
  { difficulty: 'medium', emptyBolts: 1, minMoves: 33, colors: C7 },
  {
    difficulty: 'medium',
    emptyBolts: 1,
    minMoves: 34,
    colors: C7,
    boltConfigs: [{}, {}, { fixedColor: 'red' }, {}, {}, {}, {}, {}],
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'blue' },
  },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 34, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 35, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 36,
    colors: C7,
    boltConfigs: [{ maxCapacity: 3 }, { fixedColor: 'purple' }, {}, {}, {}, {}, {}, {}],
  },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 36, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 28,
    colors: C7,
    boltConfigs: [{}, { fixedColor: 'orange' }, {}, {}, {}, {}, {}, {}],
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'pink' },
  },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 37, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 38, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 36,
    colors: C7,
    boltConfigs: [{}, { fixedColor: 'blue' }, {}, {}, {}, {}, {}, {}],
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'red' },
  },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 37, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 38,
    colors: C7,
    boltConfigs: [{ maxCapacity: 3 }, {}, {}, {}, {}, {}, {}, {}],
    filledCapacities: [3, 4, 4, 4, 4, 4, 4],
  },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 38, colors: C7 },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 39, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 40,
    colors: C7,
    boltConfigs: [{}, { fixedColor: 'green' }, {}, {}, {}, {}, {}, {}],
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'yellow' },
  },
  { difficulty: 'hard', emptyBolts: 1, minMoves: 40, colors: C7 },
  {
    difficulty: 'hard',
    emptyBolts: 1,
    minMoves: 28,
    colors: C7,
    boltConfigs: [{}, { fixedColor: 'blue' }, {}, {}, {}, {}, {}, {}],
    lockedBolt: { boltIndex: 7, unlockWhenColor: 'pink' },
  },
]

const MECH_STAGE_4: MechanicId[] = ['multiNut', 'lockedBolt']
const MECH_STAGE_5: MechanicId[] = ['multiNut', 'lockedBolt', 'variableCapacity']
const MECH_STAGE_6: MechanicId[] = [
  'multiNut',
  'lockedBolt',
  'variableCapacity',
  'fixedColorBolt',
]

export const SECTION_2_LEVEL_SPECS: GenerateLevelParams[] = [
  ...buildWave(101, STAGE_4_WAVE, 6001, MECH_STAGE_4),
  ...buildWave(131, STAGE_5_WAVE, 7001, MECH_STAGE_5),
  ...buildWave(166, STAGE_6_WAVE, 8001, MECH_STAGE_6),
]
