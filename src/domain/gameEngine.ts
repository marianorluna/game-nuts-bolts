import type { Bolt, LevelDefinition, MoveRecord, NutColor } from './types'

export function cloneBolts(bolts: Bolt[]): Bolt[] {
  return bolts.map((bolt) => [...bolt])
}

export function getTopColor(bolt: Bolt): NutColor | null {
  if (bolt.length === 0) return null
  return bolt[bolt.length - 1]
}

export function getMovableCount(bolt: Bolt): number {
  // Siempre se mueve una sola tuerca a la vez
  return bolt.length > 0 ? 1 : 0
}

export function canMove(
  bolts: Bolt[],
  fromIndex: number,
  toIndex: number,
  capacity: number,
): boolean {
  if (fromIndex === toIndex) return false
  if (fromIndex < 0 || toIndex < 0) return false
  if (fromIndex >= bolts.length || toIndex >= bolts.length) return false

  const source = bolts[fromIndex]
  const target = bolts[toIndex]

  if (source.length === 0) return false

  const movableCount = getMovableCount(source)
  const topColor = source[source.length - 1]
  const targetTop = getTopColor(target)

  if (target.length + movableCount > capacity) return false
  if (targetTop !== null && targetTop !== topColor) return false

  return true
}

export function moveNuts(
  bolts: Bolt[],
  fromIndex: number,
  toIndex: number,
  capacity: number,
): { bolts: Bolt[]; record: MoveRecord } | null {
  if (!canMove(bolts, fromIndex, toIndex, capacity)) return null

  const nextBolts = cloneBolts(bolts)
  const movableCount = getMovableCount(nextBolts[fromIndex])

  for (let i = 0; i < movableCount; i += 1) {
    const nut = nextBolts[fromIndex].pop()
    if (!nut) break
    nextBolts[toIndex].push(nut)
  }

  return {
    bolts: nextBolts,
    record: { fromIndex, toIndex, count: movableCount },
  }
}

export function undoMove(bolts: Bolt[], record: MoveRecord): Bolt[] {
  const nextBolts = cloneBolts(bolts)
  for (let i = 0; i < record.count; i += 1) {
    const nut = nextBolts[record.toIndex].pop()
    if (!nut) break
    nextBolts[record.fromIndex].push(nut)
  }
  return nextBolts
}

export function isBoltComplete(bolt: Bolt, capacity: number): boolean {
  if (bolt.length === 0) return true
  if (bolt.length !== capacity) return false
  const first = bolt[0]
  return bolt.every((nut) => nut === first)
}

export function isSolved(bolts: Bolt[], capacity: number): boolean {
  return bolts.every((bolt) => isBoltComplete(bolt, capacity))
}

/** Umbrales de estrellas respecto al mínimo óptimo (BFS). */
export function getStarThresholds(minMoves: number): {
  threeStars: number
  twoStars: number
} {
  return {
    threeStars: minMoves,
    twoStars: Math.ceil(minMoves * 1.5),
  }
}

export function calculateStars(moves: number, minMoves: number): number {
  const { threeStars, twoStars } = getStarThresholds(minMoves)
  if (moves <= threeStars) return 3
  if (moves <= twoStars) return 2
  return 1
}

export function createSessionFromLevel(level: LevelDefinition) {
  return {
    levelId: level.id,
    bolts: cloneBolts(level.bolts),
    capacity: level.capacity,
    moves: 0,
    history: [] as MoveRecord[],
    undosUsed: 0,
    selectedBoltIndex: null as number | null,
    isWon: false,
    shakeBoltIndex: null as number | null,
  }
}

export function countColors(bolts: Bolt[]): number {
  const colors = new Set<NutColor>()
  bolts.forEach((bolt) => bolt.forEach((nut) => colors.add(nut)))
  return colors.size
}
