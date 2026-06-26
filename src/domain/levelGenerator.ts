import type { Bolt, BoltConfig, LevelDefinition, MechanicId, NutColor } from './types'
import { buildBoltConfigs, canMove, cloneBolts, getTopColor, moveNuts } from './gameEngine'
import type { GamePlayContext } from './types'
import {
  getHandCraftedLevel,
} from './handCraftedLevels'
import {
  meetsLevelQualityForGeneration,
  type LevelQualityCriteria,
} from './levelValidator'

function createSolvedBolts(
  colors: NutColor[],
  capacity: number,
  emptyBolts: number,
): Bolt[] {
  const filled = colors.map((color) =>
    Array.from({ length: capacity }, () => color),
  )
  const empty = Array.from({ length: emptyBolts }, () => [] as Bolt)
  return [...filled, ...empty]
}

function createSeededRandom(seed: number) {
  let random = seed
  return () => {
    random = (random * 1664525 + 1013904223) % 4294967296
    return random / 4294967296
  }
}

function serializeBolts(bolts: Bolt[]): string {
  return bolts.map((b) => b.join(',')).join('|')
}

/**
 * Reparte tuercas aleatoriamente entre bulones (Fisher-Yates).
 * Permite bulones multicolor y reparte todos los colores — necesario
 * para niveles con pocos bulones vacíos.
 */
export function fisherYatesScramble(
  bolts: Bolt[],
  capacity: number,
  seed: number,
): Bolt[] {
  const allNuts: NutColor[] = []
  for (const bolt of bolts) {
    for (const nut of bolt) allNuts.push(nut)
  }

  const emptyCount = bolts.filter((b) => b.length === 0).length
  const filledCount = bolts.length - emptyCount
  const nextRandom = createSeededRandom(seed)

  const shuffled = [...allNuts]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRandom() * (i + 1))
    const tmp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = tmp
  }

  const result: Bolt[] = []
  let idx = 0
  for (let i = 0; i < filledCount; i += 1) {
    result.push(shuffled.slice(idx, idx + capacity))
    idx += capacity
  }
  for (let i = 0; i < emptyCount; i += 1) {
    result.push([])
  }

  const boltsWithIndex = result.map((bolt, i) => ({ bolt, i }))
  for (let i = boltsWithIndex.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRandom() * (i + 1))
    const tmp = boltsWithIndex[i]
    boltsWithIndex[i] = boltsWithIndex[j]
    boltsWithIndex[j] = tmp
  }

  return boltsWithIndex.map(({ bolt }) => bolt)
}

function scoreScrambleMove(
  bolts: Bolt[],
  from: number,
  to: number,
  capacity: number,
): number {
  const source = bolts[from]
  const target = bolts[to]
  const topColor = source[source.length - 1]
  const targetTop = getTopColor(target)

  let score = 1
  if (target.length === 0) score += 4
  score += source.length * 0.6

  if (targetTop === topColor) {
    if (target.length + 1 === capacity) score -= 6
    else score += 0.5
  }

  return Math.max(0.1, score)
}

function pickWeightedMove(
  bolts: Bolt[],
  moves: { from: number; to: number }[],
  capacity: number,
  nextRandom: () => number,
): { from: number; to: number } {
  const weights = moves.map((m) =>
    scoreScrambleMove(bolts, m.from, m.to, capacity),
  )
  const total = weights.reduce((sum, w) => sum + w, 0)
  let roll = nextRandom() * total

  for (let i = 0; i < moves.length; i += 1) {
    roll -= weights[i]
    if (roll <= 0) return moves[i]
  }

  return moves[moves.length - 1]
}

/** Scramble inverso: ideal para tutorial con varios bulones vacíos. */
export function reverseScramble(
  bolts: Bolt[],
  capacity: number,
  numMoves: number,
  seed: number,
): Bolt[] {
  const nextRandom = createSeededRandom(seed)
  let current = cloneBolts(bolts)
  let lastMove: { from: number; to: number } | null = null

  for (let move = 0; move < numMoves; move += 1) {
    const validMoves: { from: number; to: number }[] = []
    for (let from = 0; from < current.length; from += 1) {
      for (let to = 0; to < current.length; to += 1) {
        if (!canMove(current, from, to, capacity)) continue
        if (lastMove && from === lastMove.to && to === lastMove.from) continue
        validMoves.push({ from, to })
      }
    }
    if (validMoves.length === 0) break

    const pick =
      validMoves.length === 1
        ? validMoves[0]
        : pickWeightedMove(current, validMoves, capacity, nextRandom)

    const result = moveNuts(current, pick.from, pick.to, capacity)
    if (!result) break
    current = result.bolts
    lastMove = pick
  }

  return current
}

const SOLVABILITY_LIMIT: Record<LevelDefinition['difficulty'], number> = {
  easy: 200_000,
  medium: 1_000_000,
  hard: 5_000_000,
}

export type ScrambleMethod = 'reverse' | 'random'

export interface GenerateLevelParams {
  id: number
  difficulty: LevelDefinition['difficulty']
  colors: NutColor[]
  capacity: number
  emptyBolts: number
  shuffleMoves: number
  parMoves: number
  seed: number
  scrambleMethod: ScrambleMethod
  quality: LevelQualityCriteria
  mechanics?: MechanicId[]
  boltConfigs?: BoltConfig[]
  handCraftedId?: number
  lockedBolt?: { boltIndex: number; unlockWhenColor: NutColor }
}

function playContextFromSpec(
  spec: GenerateLevelParams,
  boltCount: number,
): GamePlayContext {
  const multiNut = spec.mechanics?.includes('multiNut') ?? false
  let boltConfigs: BoltConfig[] = spec.boltConfigs
    ? [...spec.boltConfigs]
    : Array.from({ length: boltCount }, () => ({}))

  if (spec.lockedBolt) {
    boltConfigs = buildBoltConfigs(boltCount, [spec.lockedBolt])
    if (spec.boltConfigs?.length) {
      spec.boltConfigs.forEach((config, index) => {
        if (config.locked || config.unlockWhenColor) {
          boltConfigs[index] = { ...config }
        }
      })
    }
  }

  return { multiNut, boltConfigs }
}

const MAX_GENERATION_ATTEMPTS = 3_000

function scrambleLevel(
  solved: Bolt[],
  params: GenerateLevelParams,
  seed: number,
): Bolt[] {
  if (params.scrambleMethod === 'random') {
    return fisherYatesScramble(solved, params.capacity, seed)
  }
  return reverseScramble(
    solved,
    params.capacity,
    params.shuffleMoves,
    seed,
  )
}

export function generateLevel(
  params: GenerateLevelParams,
  usedLayouts: Set<string> = new Set(),
): LevelDefinition {
  const maxStates = SOLVABILITY_LIMIT[params.difficulty]

  if (params.handCraftedId !== undefined) {
    const crafted = getHandCraftedLevel(params.handCraftedId)
    if (!crafted) {
      throw new Error(`Nivel hand-crafted ${params.handCraftedId} no encontrado`)
    }
    const ctx = playContextFromSpec(
      {
        ...params,
        mechanics: params.mechanics ?? ['multiNut', 'lockedBolt'],
        boltConfigs: crafted.boltConfigs,
      },
      crafted.bolts.length,
    )
    const layoutKey = serializeBolts(crafted.bolts)
    if (usedLayouts.has(layoutKey)) {
      throw new Error(`Layout duplicado en nivel hand-crafted ${params.id}`)
    }
    const quality = meetsLevelQualityForGeneration(
      crafted.bolts,
      crafted.capacity,
      params.quality,
      maxStates,
      ctx,
    )
    if (!quality.ok) {
      throw new Error(
        `Nivel hand-crafted ${params.id} no cumple calidad: ${quality.reason}`,
      )
    }
    return {
      id: params.id,
      difficulty: crafted.difficulty,
      capacity: crafted.capacity,
      minMoves: 0,
      parMoves: params.parMoves,
      bolts: crafted.bolts,
      mechanics: params.mechanics ?? ['multiNut', 'lockedBolt'],
      boltConfigs: ctx.boltConfigs,
    }
  }

  const solved = createSolvedBolts(
    params.colors,
    params.capacity,
    params.emptyBolts,
  )
  const solvedBoltCount = solved.length
  const ctx = playContextFromSpec(params, solvedBoltCount)

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const seed = params.seed + attempt * 17
    const bolts = scrambleLevel(solved, params, seed)

    const layoutKey = serializeBolts(bolts)
    if (usedLayouts.has(layoutKey)) continue

    const quality = meetsLevelQualityForGeneration(
      bolts,
      params.capacity,
      params.quality,
      maxStates,
      ctx,
    )
    if (!quality.ok) continue

    return {
      id: params.id,
      difficulty: params.difficulty,
      capacity: params.capacity,
      minMoves: 0,
      parMoves: params.parMoves,
      bolts,
      mechanics: params.mechanics,
      boltConfigs: ctx.boltConfigs.length > 0 ? ctx.boltConfigs : undefined,
    }
  }

  throw new Error(
    `No se pudo generar nivel ${params.id} tras ${MAX_GENERATION_ATTEMPTS} intentos`,
  )
}

export function generateLevelBatch(
  specs: GenerateLevelParams[],
  initialLayouts: Set<string> = new Set(),
): LevelDefinition[] {
  const usedLayouts = new Set(initialLayouts)
  return specs.map((spec) => {
    const level = generateLevel(spec, usedLayouts)
    usedLayouts.add(serializeBolts(level.bolts))
    return level
  })
}

function q(
  minSolutionMoves: number,
  minSplitColors: number,
  maxCompleteBolts: number,
): LevelQualityCriteria {
  return { minSolutionMoves, minSplitColors, maxCompleteBolts }
}

/**
 * Tutorial (1-4): scramble inverso con 2 vacíos.
 * Resto: Fisher-Yates + BFS para repartir colores y evitar niveles triviales.
 */
export const LEVEL_SPECS: GenerateLevelParams[] = [
  { id: 1,  difficulty: 'easy',   colors: ['orange', 'blue'],                                              capacity: 4, emptyBolts: 2, shuffleMoves: 8,   parMoves: 4,  seed: 1001, scrambleMethod: 'reverse', quality: q(2, 1, 2) },
  { id: 2,  difficulty: 'easy',   colors: ['orange', 'blue'],                                              capacity: 4, emptyBolts: 2, shuffleMoves: 10,  parMoves: 5,  seed: 1002, scrambleMethod: 'reverse', quality: q(3, 1, 1) },
  { id: 3,  difficulty: 'easy',   colors: ['orange', 'blue', 'pink'],                                      capacity: 4, emptyBolts: 2, shuffleMoves: 12,  parMoves: 6,  seed: 1003, scrambleMethod: 'reverse', quality: q(3, 1, 1) },
  { id: 4,  difficulty: 'easy',   colors: ['orange', 'blue', 'pink'],                                      capacity: 4, emptyBolts: 2, shuffleMoves: 14,  parMoves: 7,  seed: 1004, scrambleMethod: 'reverse', quality: q(4, 2, 1) },
  { id: 5,  difficulty: 'easy',   colors: ['orange', 'blue', 'pink'],                                      capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 8,  seed: 1005, scrambleMethod: 'random',  quality: q(5, 2, 0) },
  { id: 6,  difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green'],                             capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 9,  seed: 1006, scrambleMethod: 'random',  quality: q(6, 3, 0) },
  { id: 7,  difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green'],                             capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 10, seed: 1007, scrambleMethod: 'random',  quality: q(7, 3, 0) },
  { id: 8,  difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green'],                             capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 11, seed: 1008, scrambleMethod: 'random',  quality: q(8, 3, 0) },
  { id: 9,  difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'yellow', 'green'],                 capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 12, seed: 1009, scrambleMethod: 'random',  quality: q(8, 4, 0) },
  { id: 10, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'yellow', 'green'],                   capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 13, seed: 1010, scrambleMethod: 'random',  quality: q(9, 4, 0) },
  { id: 11, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green'],                             capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 14, seed: 2001, scrambleMethod: 'random',  quality: q(10, 3, 0) },
  { id: 12, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'yellow'],                            capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 15, seed: 2002, scrambleMethod: 'random',  quality: q(10, 3, 0) },
  { id: 13, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow'],                   capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 16, seed: 2003, scrambleMethod: 'random',  quality: q(11, 4, 0) },
  { id: 14, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'red'],                      capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 17, seed: 2004, scrambleMethod: 'random',  quality: q(11, 4, 0) },
  { id: 15, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow'],                   capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 18, seed: 2005, scrambleMethod: 'random',  quality: q(12, 4, 0) },
  { id: 16, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'red'],                      capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 19, seed: 2006, scrambleMethod: 'random',  quality: q(12, 4, 0) },
  { id: 17, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 20, seed: 2007, scrambleMethod: 'random',  quality: q(13, 5, 0) },
  { id: 18, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'purple'],         capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 21, seed: 2008, scrambleMethod: 'random',  quality: q(13, 5, 0) },
  { id: 19, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 22, seed: 2009, scrambleMethod: 'random',  quality: q(14, 5, 0) },
  { id: 20, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'red', 'yellow'],          capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 23, seed: 2010, scrambleMethod: 'random',  quality: q(14, 5, 0) },
  { id: 21, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 24, seed: 3001, scrambleMethod: 'random',  quality: q(15, 5, 0) },
  { id: 22, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'purple'],         capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 25, seed: 3002, scrambleMethod: 'random',  quality: q(15, 5, 0) },
  { id: 23, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 26, seed: 3003, scrambleMethod: 'random',  quality: q(16, 6, 0) },
  { id: 24, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 27, seed: 3004, scrambleMethod: 'random',  quality: q(16, 5, 0) },
  { id: 25, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'purple', 'red'],  capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 28, seed: 3005, scrambleMethod: 'random',  quality: q(17, 6, 0) },
  { id: 26, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 29, seed: 3006, scrambleMethod: 'random',  quality: q(18, 6, 0) },
  { id: 27, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 30, seed: 3007, scrambleMethod: 'random',  quality: q(18, 6, 0) },
  { id: 28, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 31, seed: 3008, scrambleMethod: 'random',  quality: q(19, 6, 0) },
  { id: 29, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 32, seed: 3009, scrambleMethod: 'random',  quality: q(20, 6, 0) },
  { id: 30, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 34, seed: 3010, scrambleMethod: 'random',  quality: q(22, 6, 0) },

  // Etapa 2 — El garaje apretado (31–60): escalado paramétrico, patrón ola
  { id: 31, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 22, seed: 4001, scrambleMethod: 'random',  quality: q(20, 5, 0) },
  { id: 32, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'purple'],           capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 23, seed: 4002, scrambleMethod: 'random',  quality: q(21, 5, 0) },
  { id: 33, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 24, seed: 4003, scrambleMethod: 'random',  quality: q(22, 6, 0) },
  { id: 34, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 25, seed: 4004, scrambleMethod: 'random',  quality: q(23, 6, 0) },
  { id: 35, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 26, seed: 4005, scrambleMethod: 'random',  quality: q(24, 6, 0) },
  { id: 36, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 27, seed: 4006, scrambleMethod: 'random',  quality: q(24, 6, 0) },
  { id: 37, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 28, seed: 4007, scrambleMethod: 'random',  quality: q(25, 6, 0) },
  { id: 38, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 29, seed: 4008, scrambleMethod: 'random',  quality: q(26, 6, 0) },
  { id: 39, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 30, seed: 4009, scrambleMethod: 'random',  quality: q(26, 6, 0) },
  { id: 40, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 32, seed: 4010, scrambleMethod: 'random',  quality: q(28, 6, 0) },
  { id: 41, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 31, seed: 4011, scrambleMethod: 'random',  quality: q(27, 6, 0) },
  { id: 42, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 32, seed: 4012, scrambleMethod: 'random',  quality: q(28, 6, 0) },
  { id: 43, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 33, seed: 4013, scrambleMethod: 'random',  quality: q(28, 6, 0) },
  { id: 44, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 34, seed: 4014, scrambleMethod: 'random',  quality: q(29, 6, 0) },
  { id: 45, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 35, seed: 4015, scrambleMethod: 'random',  quality: q(30, 6, 0) },
  { id: 46, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 36, seed: 4016, scrambleMethod: 'random',  quality: q(31, 6, 0) },
  { id: 47, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 37, seed: 4017, scrambleMethod: 'random',  quality: q(32, 6, 0) },
  { id: 48, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 38, seed: 4018, scrambleMethod: 'random',  quality: q(33, 6, 0) },
  { id: 49, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 26, seed: 4019, scrambleMethod: 'random',  quality: q(22, 5, 0) },
  { id: 50, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'purple'],           capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 27, seed: 4020, scrambleMethod: 'random',  quality: q(23, 5, 0) },
  { id: 51, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 28, seed: 4021, scrambleMethod: 'random',  quality: q(24, 5, 0) },
  { id: 52, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 29, seed: 4022, scrambleMethod: 'random',  quality: q(25, 5, 0) },
  { id: 53, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 34, seed: 4023, scrambleMethod: 'random',  quality: q(28, 6, 0) },
  { id: 54, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 35, seed: 4024, scrambleMethod: 'random',  quality: q(29, 6, 0) },
  { id: 55, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 36, seed: 4025, scrambleMethod: 'random',  quality: q(30, 6, 0) },
  { id: 56, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 38, seed: 4026, scrambleMethod: 'random',  quality: q(32, 6, 0) },
  { id: 57, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 39, seed: 4027, scrambleMethod: 'random',  quality: q(33, 6, 0) },
  { id: 58, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 40, seed: 4028, scrambleMethod: 'random',  quality: q(34, 6, 0) },
  { id: 59, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 41, seed: 4029, scrambleMethod: 'random',  quality: q(35, 6, 0) },
  { id: 60, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 44, seed: 4030, scrambleMethod: 'random',  quality: q(34, 6, 0) },

  // Etapa 3 — Nuevas reglas (61–100): multiNut (61–80), + lockedBolt (81–100)
  { id: 61, difficulty: 'easy',   colors: ['orange', 'blue', 'pink'],                                      capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 10, seed: 5001, scrambleMethod: 'random',  quality: q(8, 2, 0),   mechanics: ['multiNut'] },
  { id: 62, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green'],                             capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 12, seed: 5002, scrambleMethod: 'random',  quality: q(9, 3, 0),   mechanics: ['multiNut'] },
  { id: 63, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green'],                             capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 14, seed: 5003, scrambleMethod: 'random',  quality: q(10, 3, 0),  mechanics: ['multiNut'] },
  { id: 64, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'yellow'],                          capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 16, seed: 5004, scrambleMethod: 'random',  quality: q(11, 3, 0),  mechanics: ['multiNut'] },
  { id: 65, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green', 'yellow'],                 capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 18, seed: 5005, scrambleMethod: 'random',  quality: q(12, 4, 0),  mechanics: ['multiNut'] },
  { id: 66, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow'],                   capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 20, seed: 5006, scrambleMethod: 'random',  quality: q(14, 4, 0),  mechanics: ['multiNut'] },
  { id: 67, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 22, seed: 5007, scrambleMethod: 'random',  quality: q(15, 5, 0),  mechanics: ['multiNut'] },
  { id: 68, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 24, seed: 5008, scrambleMethod: 'random',  quality: q(16, 5, 0),  mechanics: ['multiNut'] },
  { id: 69, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 26, seed: 5009, scrambleMethod: 'random',  quality: q(17, 5, 0),  mechanics: ['multiNut'] },
  { id: 70, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'purple'],         capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 28, seed: 5010, scrambleMethod: 'random',  quality: q(18, 5, 0),  mechanics: ['multiNut'] },
  { id: 71, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 30, seed: 5011, scrambleMethod: 'random',  quality: q(19, 5, 0),  mechanics: ['multiNut'] },
  { id: 72, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 32, seed: 5012, scrambleMethod: 'random',  quality: q(20, 6, 0),  mechanics: ['multiNut'] },
  { id: 73, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 34, seed: 5013, scrambleMethod: 'random',  quality: q(21, 6, 0),  mechanics: ['multiNut'] },
  { id: 74, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 36, seed: 5014, scrambleMethod: 'random',  quality: q(22, 6, 0),  mechanics: ['multiNut'] },
  { id: 75, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 38, seed: 5015, scrambleMethod: 'random',  quality: q(23, 6, 0),  mechanics: ['multiNut'] },
  { id: 76, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 40, seed: 5016, scrambleMethod: 'random',  quality: q(22, 6, 0),  mechanics: ['multiNut'] },
  { id: 77, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 42, seed: 5017, scrambleMethod: 'random',  quality: q(23, 6, 0),  mechanics: ['multiNut'] },
  { id: 78, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 44, seed: 5018, scrambleMethod: 'random',  quality: q(22, 6, 0),  mechanics: ['multiNut'] },
  { id: 79, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 46, seed: 5019, scrambleMethod: 'random',  quality: q(23, 6, 0),  mechanics: ['multiNut'] },
  { id: 80, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 50, seed: 5020, scrambleMethod: 'random',  quality: q(24, 6, 0),  mechanics: ['multiNut'] },

  { id: 81, difficulty: 'easy',   colors: ['orange', 'blue', 'pink'],                                      capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 12, seed: 5081, scrambleMethod: 'random',  quality: q(6, 2, 0),   handCraftedId: 81 },
  { id: 82, difficulty: 'easy',   colors: ['orange', 'blue', 'green', 'yellow'],                           capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 14, seed: 5082, scrambleMethod: 'random',  quality: q(6, 2, 0),   handCraftedId: 82 },
  { id: 83, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'red', 'purple'],                     capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 18, seed: 5083, scrambleMethod: 'random',  quality: q(8, 3, 0),   handCraftedId: 83 },
  { id: 84, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green'],                             capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 20, seed: 5084, scrambleMethod: 'random',  quality: q(6, 2, 0),   handCraftedId: 84 },

  { id: 85, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 28, seed: 5085, scrambleMethod: 'random',  quality: q(14, 5, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 6, unlockWhenColor: 'orange' } },
  { id: 86, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 30, seed: 5086, scrambleMethod: 'random',  quality: q(14, 5, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 6, unlockWhenColor: 'blue' } },
  { id: 87, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'purple'],         capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 32, seed: 5087, scrambleMethod: 'random',  quality: q(15, 5, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 6, unlockWhenColor: 'pink' } },
  { id: 88, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 34, seed: 5088, scrambleMethod: 'random',  quality: q(15, 5, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 6, unlockWhenColor: 'green' } },
  { id: 89, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 36, seed: 5089, scrambleMethod: 'random',  quality: q(16, 6, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 7, unlockWhenColor: 'orange' } },
  { id: 90, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 38, seed: 5090, scrambleMethod: 'random',  quality: q(16, 6, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 7, unlockWhenColor: 'blue' } },
  { id: 91, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 40, seed: 5091, scrambleMethod: 'random',  quality: q(17, 6, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 7, unlockWhenColor: 'pink' } },
  { id: 92, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 26, seed: 5092, scrambleMethod: 'random',  quality: q(12, 5, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 6, unlockWhenColor: 'yellow' } },
  { id: 93, difficulty: 'easy',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red'],            capacity: 4, emptyBolts: 2, shuffleMoves: 0,   parMoves: 28, seed: 5093, scrambleMethod: 'random',  quality: q(12, 5, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 6, unlockWhenColor: 'red' } },
  { id: 94, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 34, seed: 5094, scrambleMethod: 'random',  quality: q(16, 6, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 7, unlockWhenColor: 'green' } },
  { id: 95, difficulty: 'medium', colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 36, seed: 5095, scrambleMethod: 'random',  quality: q(17, 6, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 7, unlockWhenColor: 'yellow' } },
  { id: 96, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 40, seed: 5096, scrambleMethod: 'random',  quality: q(18, 6, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 7, unlockWhenColor: 'red' } },
  { id: 97, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 42, seed: 5097, scrambleMethod: 'random',  quality: q(18, 6, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 7, unlockWhenColor: 'purple' } },
  { id: 98, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 44, seed: 5098, scrambleMethod: 'random',  quality: q(19, 6, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 7, unlockWhenColor: 'orange' } },
  { id: 99, difficulty: 'hard',   colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 46, seed: 5099, scrambleMethod: 'random',  quality: q(19, 6, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 7, unlockWhenColor: 'blue' } },
  { id: 100, difficulty: 'hard',  colors: ['orange', 'blue', 'pink', 'green', 'yellow', 'red', 'purple'],  capacity: 4, emptyBolts: 1, shuffleMoves: 0,   parMoves: 52, seed: 5100, scrambleMethod: 'random',  quality: q(20, 6, 0),  mechanics: ['multiNut', 'lockedBolt'], lockedBolt: { boltIndex: 7, unlockWhenColor: 'pink' } },
]
