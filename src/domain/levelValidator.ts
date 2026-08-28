import type { Bolt, GamePlayContext, NutColor } from './types'
import {
  canMove,
  CLASSIC_PLAY_CONTEXT,
  cloneBolts,
  getBoltCapacity,
  isSolved,
  moveNuts,
} from './gameEngine'

function serializeBolts(bolts: Bolt[]): string {
  return bolts.map((b) => b.join(',')).join('|')
}

export function validateLevelStructure(
  bolts: Bolt[],
  defaultCapacity: number,
  ctx: GamePlayContext = CLASSIC_PLAY_CONTEXT,
): { valid: boolean; error?: string } {
  const colorCounts = new Map<string, number>()

  for (let i = 0; i < bolts.length; i += 1) {
    const bolt = bolts[i]
    const cap = getBoltCapacity(i, defaultCapacity, ctx)
    if (bolt.length > cap) {
      return { valid: false, error: 'Bolt exceeds capacity' }
    }
    for (const color of bolt) {
      colorCounts.set(color, (colorCounts.get(color) ?? 0) + 1)
    }
  }

  const counts = [...colorCounts.values()]
  if (counts.length === 0) {
    return { valid: false, error: 'No colors found' }
  }

  const hasVariableCapacity = ctx.boltConfigs.some(
    (config) => config.maxCapacity !== undefined,
  )
  if (!hasVariableCapacity) {
    const expected = counts[0]
    if (!counts.every((c) => c === expected)) {
      return {
        valid: false,
        error: `Invalid color distribution: ${JSON.stringify(Object.fromEntries(colorCounts))}`,
      }
    }
  }

  return { valid: true }
}

export function minSplitColorsForLevel(colorCount: number): number {
  return Math.max(1, Math.ceil(colorCount * 0.25))
}

export function isLevelScrambled(
  bolts: Bolt[],
  defaultCapacity: number,
  ctx: GamePlayContext = CLASSIC_PLAY_CONTEXT,
): boolean {
  if (isSolved(bolts, defaultCapacity, ctx)) return false

  const hasMixedBolt = bolts.some(
    (bolt) => bolt.length > 1 && new Set(bolt).size > 1,
  )
  if (hasMixedBolt) return true

  const colors = new Set<NutColor>()
  for (const bolt of bolts) {
    for (const color of bolt) colors.add(color)
  }

  let splitColors = 0
  for (const color of colors) {
    let boltsWithColor = 0
    for (const bolt of bolts) {
      if (bolt.includes(color)) boltsWithColor += 1
    }
    if (boltsWithColor >= 2) splitColors += 1
  }

  const hasPartialBolt = bolts.some((bolt, index) => {
    const cap = getBoltCapacity(index, defaultCapacity, ctx)
    return bolt.length > 0 && bolt.length < cap
  })

  return splitColors >= 1 && hasPartialBolt
}

export function hasSolutionWithin(
  bolts: Bolt[],
  defaultCapacity: number,
  maxMoves: number,
  maxStates = 2_000_000,
  ctx: GamePlayContext = CLASSIC_PLAY_CONTEXT,
): boolean {
  if (maxMoves < 0) return false
  const start = cloneBolts(bolts)
  if (isSolved(start, defaultCapacity, ctx)) return true

  const queue: { bolts: Bolt[]; depth: number }[] = [
    { bolts: start, depth: 0 },
  ]
  const visited = new Set<string>([serializeBolts(start)])

  while (queue.length > 0) {
    const item = queue.shift()
    if (!item) break
    const { bolts: current, depth } = item
    if (depth >= maxMoves) continue

    for (let from = 0; from < current.length; from += 1) {
      for (let to = 0; to < current.length; to += 1) {
        if (!canMove(current, from, to, defaultCapacity, ctx)) continue

        const result = moveNuts(current, from, to, defaultCapacity, ctx)
        if (!result) continue

        if (isSolved(result.bolts, defaultCapacity, ctx)) return true

        const key = serializeBolts(result.bolts)
        if (visited.has(key) || visited.size >= maxStates) continue

        visited.add(key)
        queue.push({ bolts: result.bolts, depth: depth + 1 })
      }
    }
  }

  return false
}

export function isLevelSolvable(
  bolts: Bolt[],
  defaultCapacity: number,
  maxStates = 2_000_000,
  ctx: GamePlayContext = CLASSIC_PLAY_CONTEXT,
): boolean {
  const start = cloneBolts(bolts)
  if (isSolved(start, defaultCapacity, ctx)) return true

  const queue: Bolt[][] = [start]
  const visited = new Set<string>([serializeBolts(start)])

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    for (let from = 0; from < current.length; from += 1) {
      for (let to = 0; to < current.length; to += 1) {
        if (!canMove(current, from, to, defaultCapacity, ctx)) continue

        const result = moveNuts(current, from, to, defaultCapacity, ctx)
        if (!result) continue

        if (isSolved(result.bolts, defaultCapacity, ctx)) return true

        const key = serializeBolts(result.bolts)
        if (visited.has(key) || visited.size >= maxStates) continue

        visited.add(key)
        queue.push(result.bolts)
      }
    }
  }

  return false
}

export function countSplitColors(bolts: Bolt[]): number {
  const colors = new Set<NutColor>()
  for (const bolt of bolts) {
    for (const color of bolt) colors.add(color)
  }

  let splitColors = 0
  for (const color of colors) {
    let boltsWithColor = 0
    for (const bolt of bolts) {
      if (bolt.includes(color)) boltsWithColor += 1
    }
    if (boltsWithColor >= 2) splitColors += 1
  }
  return splitColors
}

export function countCompleteBolts(
  bolts: Bolt[],
  defaultCapacity: number,
  ctx: GamePlayContext = CLASSIC_PLAY_CONTEXT,
): number {
  return bolts.filter((bolt, index) => {
    const cap = getBoltCapacity(index, defaultCapacity, ctx)
    return (
      bolt.length === cap &&
      bolt.length > 0 &&
      bolt.every((nut) => nut === bolt[0])
    )
  }).length
}

export function getMinSolutionMoves(
  bolts: Bolt[],
  defaultCapacity: number,
  maxStates = 2_000_000,
  ctx: GamePlayContext = CLASSIC_PLAY_CONTEXT,
): number | null {
  const start = cloneBolts(bolts)
  if (isSolved(start, defaultCapacity, ctx)) return 0

  const queue: { bolts: Bolt[]; depth: number }[] = [
    { bolts: start, depth: 0 },
  ]
  const visited = new Set<string>([serializeBolts(start)])

  while (queue.length > 0) {
    const item = queue.shift()
    if (!item) break
    const { bolts: current, depth } = item

    for (let from = 0; from < current.length; from += 1) {
      for (let to = 0; to < current.length; to += 1) {
        if (!canMove(current, from, to, defaultCapacity, ctx)) continue

        const result = moveNuts(current, from, to, defaultCapacity, ctx)
        if (!result) continue

        if (isSolved(result.bolts, defaultCapacity, ctx)) return depth + 1

        const key = serializeBolts(result.bolts)
        if (visited.has(key) || visited.size >= maxStates) continue

        visited.add(key)
        queue.push({ bolts: result.bolts, depth: depth + 1 })
      }
    }
  }

  return null
}

export interface LevelQualityCriteria {
  minSolutionMoves: number
  minSplitColors: number
  maxCompleteBolts: number
}

export function meetsLevelQuality(
  bolts: Bolt[],
  defaultCapacity: number,
  criteria: LevelQualityCriteria,
  maxStates = 2_000_000,
  ctx: GamePlayContext = CLASSIC_PLAY_CONTEXT,
): { ok: boolean; reason?: string } {
  if (!isLevelScrambled(bolts, defaultCapacity, ctx)) {
    return { ok: false, reason: 'not scrambled' }
  }

  const structure = validateLevelStructure(bolts, defaultCapacity, ctx)
  if (!structure.valid) {
    return { ok: false, reason: structure.error }
  }

  const splitColors = countSplitColors(bolts)
  if (splitColors < criteria.minSplitColors) {
    return {
      ok: false,
      reason: `split colors ${splitColors} < ${criteria.minSplitColors}`,
    }
  }

  const completeBolts = countCompleteBolts(bolts, defaultCapacity, ctx)
  if (completeBolts > criteria.maxCompleteBolts) {
    return {
      ok: false,
      reason: `complete bolts ${completeBolts} > ${criteria.maxCompleteBolts}`,
    }
  }

  const minMoves = criteria.minSolutionMoves
  if (
    minMoves > 1 &&
    hasSolutionWithin(bolts, defaultCapacity, minMoves - 1, maxStates, ctx)
  ) {
    return {
      ok: false,
      reason: `solved in fewer than ${minMoves} moves`,
    }
  }

  if (getMinSolutionMoves(bolts, defaultCapacity, maxStates, ctx) === null) {
    return { ok: false, reason: 'not solvable within limit' }
  }

  return { ok: true }
}

export function meetsLevelQualityForGeneration(
  bolts: Bolt[],
  defaultCapacity: number,
  criteria: LevelQualityCriteria,
  maxStates = 2_000_000,
  ctx: GamePlayContext = CLASSIC_PLAY_CONTEXT,
): { ok: boolean; reason?: string } {
  if (!isLevelScrambled(bolts, defaultCapacity, ctx)) {
    return { ok: false, reason: 'not scrambled' }
  }

  const structure = validateLevelStructure(bolts, defaultCapacity, ctx)
  if (!structure.valid) {
    return { ok: false, reason: structure.error }
  }

  const splitColors = countSplitColors(bolts)
  if (splitColors < criteria.minSplitColors) {
    return {
      ok: false,
      reason: `split colors ${splitColors} < ${criteria.minSplitColors}`,
    }
  }

  const completeBolts = countCompleteBolts(bolts, defaultCapacity, ctx)
  if (completeBolts > criteria.maxCompleteBolts) {
    return {
      ok: false,
      reason: `complete bolts ${completeBolts} > ${criteria.maxCompleteBolts}`,
    }
  }

  const minMoves = criteria.minSolutionMoves
  if (
    minMoves > 1 &&
    hasSolutionWithin(bolts, defaultCapacity, minMoves - 1, maxStates, ctx)
  ) {
    return {
      ok: false,
      reason: `solved in fewer than ${minMoves} moves`,
    }
  }

  if (!isLevelSolvable(bolts, defaultCapacity, maxStates, ctx)) {
    return { ok: false, reason: 'not solvable within limit' }
  }

  return { ok: true }
}
