import type { Bolt, LevelDefinition, NutColor } from './types'
import { canMove, cloneBolts, getTopColor, moveNuts } from './gameEngine'
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
  const solved = createSolvedBolts(
    params.colors,
    params.capacity,
    params.emptyBolts,
  )
  const maxStates = SOLVABILITY_LIMIT[params.difficulty]

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
    )
    if (!quality.ok) continue

    return {
      id: params.id,
      difficulty: params.difficulty,
      capacity: params.capacity,
      minMoves: 0,
      parMoves: params.parMoves,
      bolts,
    }
  }

  throw new Error(
    `No se pudo generar nivel ${params.id} tras ${MAX_GENERATION_ATTEMPTS} intentos`,
  )
}

export function generateLevelBatch(
  specs: GenerateLevelParams[],
): LevelDefinition[] {
  const usedLayouts = new Set<string>()
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
]
