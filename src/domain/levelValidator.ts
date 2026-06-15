import type { Bolt, NutColor } from './types'
import { canMove, cloneBolts, isSolved, moveNuts } from './gameEngine'

function serializeBolts(bolts: Bolt[]): string {
  return bolts.map((b) => b.join(',')).join('|')
}

export function validateLevelStructure(
  bolts: Bolt[],
  capacity: number,
): { valid: boolean; error?: string } {
  const colorCounts = new Map<string, number>()

  for (const bolt of bolts) {
    if (bolt.length > capacity) {
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

  const expected = capacity
  if (!counts.every((c) => c === expected)) {
    return {
      valid: false,
      error: `Invalid color distribution: ${JSON.stringify(Object.fromEntries(colorCounts))}`,
    }
  }

  return { valid: true }
}

/** Mínimo de colores repartidas en 2+ bulones según cantidad de colores del nivel. */
export function minSplitColorsForLevel(colorCount: number): number {
  return Math.max(1, Math.ceil(colorCount * 0.25))
}

/**
 * El nivel debe estar mezclado: no resuelto y con variación real en la
 * distribución (bulones multicolor, colores repartidos o bulones parciales).
 */
export function isLevelScrambled(
  bolts: Bolt[],
  capacity: number,
): boolean {
  if (isSolved(bolts, capacity)) return false

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

  const hasPartialBolt = bolts.some(
    (bolt) => bolt.length > 0 && bolt.length < capacity,
  )

  return splitColors >= 1 && hasPartialBolt
}

/**
 * ¿Existe solución en `maxMoves` movimientos o menos?
 * Más rápido que calcular el mínimo exacto cuando solo hay que rechazar niveles triviales.
 */
export function hasSolutionWithin(
  bolts: Bolt[],
  capacity: number,
  maxMoves: number,
  maxStates = 2_000_000,
): boolean {
  if (maxMoves < 0) return false
  const start = cloneBolts(bolts)
  if (isSolved(start, capacity)) return true

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
        if (!canMove(current, from, to, capacity)) continue

        const result = moveNuts(current, from, to, capacity)
        if (!result) continue

        if (isSolved(result.bolts, capacity)) return true

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
  capacity: number,
  maxStates = 2_000_000,
): boolean {
  const start = cloneBolts(bolts)
  if (isSolved(start, capacity)) return true

  const queue: Bolt[][] = [start]
  const visited = new Set<string>([serializeBolts(start)])

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    for (let from = 0; from < current.length; from += 1) {
      for (let to = 0; to < current.length; to += 1) {
        if (!canMove(current, from, to, capacity)) continue

        const result = moveNuts(current, from, to, capacity)
        if (!result) continue

        if (isSolved(result.bolts, capacity)) return true

        const key = serializeBolts(result.bolts)
        if (visited.has(key) || visited.size >= maxStates) continue

        visited.add(key)
        queue.push(result.bolts)
      }
    }
  }

  return false
}

/** Colores que aparecen en 2 o más bulones (repartidos = más difícil). */
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

/** Bulones ya completos (un solo color lleno) — demasiados = nivel trivial. */
export function countCompleteBolts(bolts: Bolt[], capacity: number): number {
  return bolts.filter(
    (bolt) =>
      bolt.length === capacity &&
      bolt.length > 0 &&
      bolt.every((nut) => nut === bolt[0]),
  ).length
}

/**
 * BFS: devuelve la longitud mínima de solución, o null si no se encuentra
 * dentro del límite de estados explorados.
 */
export function getMinSolutionMoves(
  bolts: Bolt[],
  capacity: number,
  maxStates = 2_000_000,
): number | null {
  const start = cloneBolts(bolts)
  if (isSolved(start, capacity)) return 0

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
        if (!canMove(current, from, to, capacity)) continue

        const result = moveNuts(current, from, to, capacity)
        if (!result) continue

        if (isSolved(result.bolts, capacity)) return depth + 1

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
  capacity: number,
  criteria: LevelQualityCriteria,
  maxStates = 2_000_000,
): { ok: boolean; reason?: string } {
  if (!isLevelScrambled(bolts, capacity)) {
    return { ok: false, reason: 'not scrambled' }
  }

  const splitColors = countSplitColors(bolts)
  if (splitColors < criteria.minSplitColors) {
    return {
      ok: false,
      reason: `split colors ${splitColors} < ${criteria.minSplitColors}`,
    }
  }

  const completeBolts = countCompleteBolts(bolts, capacity)
  if (completeBolts > criteria.maxCompleteBolts) {
    return {
      ok: false,
      reason: `complete bolts ${completeBolts} > ${criteria.maxCompleteBolts}`,
    }
  }

  const minMoves = criteria.minSolutionMoves
  if (
    minMoves > 1 &&
    hasSolutionWithin(bolts, capacity, minMoves - 1, maxStates)
  ) {
    return {
      ok: false,
      reason: `solved in fewer than ${minMoves} moves`,
    }
  }

  if (getMinSolutionMoves(bolts, capacity, maxStates) === null) {
    return { ok: false, reason: 'not solvable within limit' }
  }

  return { ok: true }
}

/** Versión rápida para generación: sin calcular el mínimo exacto. */
export function meetsLevelQualityForGeneration(
  bolts: Bolt[],
  capacity: number,
  criteria: LevelQualityCriteria,
  maxStates = 2_000_000,
): { ok: boolean; reason?: string } {
  if (!isLevelScrambled(bolts, capacity)) {
    return { ok: false, reason: 'not scrambled' }
  }

  const splitColors = countSplitColors(bolts)
  if (splitColors < criteria.minSplitColors) {
    return {
      ok: false,
      reason: `split colors ${splitColors} < ${criteria.minSplitColors}`,
    }
  }

  const completeBolts = countCompleteBolts(bolts, capacity)
  if (completeBolts > criteria.maxCompleteBolts) {
    return {
      ok: false,
      reason: `complete bolts ${completeBolts} > ${criteria.maxCompleteBolts}`,
    }
  }

  const minMoves = criteria.minSolutionMoves
  if (
    minMoves > 1 &&
    hasSolutionWithin(bolts, capacity, minMoves - 1, maxStates)
  ) {
    return {
      ok: false,
      reason: `solved in fewer than ${minMoves} moves`,
    }
  }

  if (!isLevelSolvable(bolts, capacity, maxStates)) {
    return { ok: false, reason: 'not solvable within limit' }
  }

  return { ok: true }
}
