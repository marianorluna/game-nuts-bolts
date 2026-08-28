import type {
  Bolt,
  BoltConfig,
  GamePlayContext,
  LevelDefinition,
  MoveRecord,
  NutColor,
} from './types'

export const CLASSIC_PLAY_CONTEXT: GamePlayContext = {
  multiNut: false,
  boltConfigs: [],
}

export function getPlayContext(level: LevelDefinition): GamePlayContext {
  return {
    multiNut: level.mechanics?.includes('multiNut') ?? false,
    boltConfigs: level.boltConfigs ?? [],
  }
}

export function cloneBolts(bolts: Bolt[]): Bolt[] {
  return bolts.map((bolt) => [...bolt])
}

export function getTopColor(bolt: Bolt): NutColor | null {
  if (bolt.length === 0) return null
  return bolt[bolt.length - 1]
}

export function getBoltCapacity(
  boltIndex: number,
  defaultCapacity: number,
  ctx: GamePlayContext,
): number {
  return ctx.boltConfigs[boltIndex]?.maxCapacity ?? defaultCapacity
}

export function getMaxBoardCapacity(
  boltCount: number,
  defaultCapacity: number,
  ctx: GamePlayContext,
): number {
  let max = defaultCapacity
  for (let i = 0; i < boltCount; i += 1) {
    max = Math.max(max, getBoltCapacity(i, defaultCapacity, ctx))
  }
  return max
}

export function hasCompletedColor(
  bolts: Bolt[],
  defaultCapacity: number,
  color: NutColor,
  ctx: GamePlayContext = CLASSIC_PLAY_CONTEXT,
): boolean {
  return bolts.some((bolt, index) => {
    const cap = getBoltCapacity(index, defaultCapacity, ctx)
    return (
      bolt.length === cap &&
      bolt.length > 0 &&
      bolt.every((nut) => nut === color)
    )
  })
}

export function isBoltUsable(
  boltIndex: number,
  bolts: Bolt[],
  defaultCapacity: number,
  ctx: GamePlayContext,
): boolean {
  const config = ctx.boltConfigs[boltIndex]
  if (!config?.locked) return true
  if (!config.unlockWhenColor) return false
  return hasCompletedColor(bolts, defaultCapacity, config.unlockWhenColor, ctx)
}

export function getMovableCount(bolt: Bolt, multiNut: boolean): number {
  if (bolt.length === 0) return 0
  if (!multiNut) return 1

  const topColor = bolt[bolt.length - 1]
  let count = 0
  for (let i = bolt.length - 1; i >= 0; i -= 1) {
    if (bolt[i] !== topColor) break
    count += 1
  }
  return count
}

function acceptsNutOnBolt(
  target: Bolt,
  topColor: NutColor,
  boltIndex: number,
  _defaultCapacity: number,
  ctx: GamePlayContext,
): boolean {
  const targetTop = getTopColor(target)
  const fixedColor = ctx.boltConfigs[boltIndex]?.fixedColor
  if (fixedColor !== undefined) {
    if (target.length === 0) return topColor === fixedColor
    return targetTop === topColor
  }
  if (targetTop !== null && targetTop !== topColor) return false
  return true
}

export function canMove(
  bolts: Bolt[],
  fromIndex: number,
  toIndex: number,
  defaultCapacity: number,
  ctx: GamePlayContext = CLASSIC_PLAY_CONTEXT,
): boolean {
  if (fromIndex === toIndex) return false
  if (fromIndex < 0 || toIndex < 0) return false
  if (fromIndex >= bolts.length || toIndex >= bolts.length) return false

  if (!isBoltUsable(fromIndex, bolts, defaultCapacity, ctx)) return false
  if (!isBoltUsable(toIndex, bolts, defaultCapacity, ctx)) return false

  const source = bolts[fromIndex]
  const target = bolts[toIndex]

  if (source.length === 0) return false

  const movableCount = getMovableCount(source, ctx.multiNut)
  const topColor = source[source.length - 1]
  const destCapacity = getBoltCapacity(toIndex, defaultCapacity, ctx)

  if (target.length + movableCount > destCapacity) return false
  if (!acceptsNutOnBolt(target, topColor, toIndex, defaultCapacity, ctx)) {
    return false
  }

  return true
}

export function moveNuts(
  bolts: Bolt[],
  fromIndex: number,
  toIndex: number,
  defaultCapacity: number,
  ctx: GamePlayContext = CLASSIC_PLAY_CONTEXT,
): { bolts: Bolt[]; record: MoveRecord } | null {
  if (!canMove(bolts, fromIndex, toIndex, defaultCapacity, ctx)) return null

  const nextBolts = cloneBolts(bolts)
  const movableCount = getMovableCount(nextBolts[fromIndex], ctx.multiNut)

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

export function isBoltComplete(bolt: Bolt, boltCapacity: number): boolean {
  if (bolt.length === 0) return true
  if (bolt.length !== boltCapacity) return false
  const first = bolt[0]
  return bolt.every((nut) => nut === first)
}

export function isSolved(
  bolts: Bolt[],
  defaultCapacity: number,
  ctx: GamePlayContext = CLASSIC_PLAY_CONTEXT,
): boolean {
  return bolts.every((bolt, index) =>
    isBoltComplete(bolt, getBoltCapacity(index, defaultCapacity, ctx)),
  )
}

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
    playContext: getPlayContext(level),
    challengeAttemptPending: true,
    challengeAttemptCharged: false,
  }
}

export function countColors(bolts: Bolt[]): number {
  const colors = new Set<NutColor>()
  bolts.forEach((bolt) => bolt.forEach((nut) => colors.add(nut)))
  return colors.size
}

export function isBoltLocked(
  boltIndex: number,
  bolts: Bolt[],
  defaultCapacity: number,
  ctx: GamePlayContext,
): boolean {
  const config = ctx.boltConfigs[boltIndex]
  if (!config?.locked) return false
  return !isBoltUsable(boltIndex, bolts, defaultCapacity, ctx)
}

export function buildBoltConfigs(
  boltCount: number,
  locks: Array<{ boltIndex: number; unlockWhenColor: NutColor }>,
): BoltConfig[] {
  const configs: BoltConfig[] = Array.from({ length: boltCount }, () => ({}))
  for (const lock of locks) {
    if (lock.boltIndex >= 0 && lock.boltIndex < boltCount) {
      configs[lock.boltIndex] = {
        ...configs[lock.boltIndex],
        locked: true,
        unlockWhenColor: lock.unlockWhenColor,
      }
    }
  }
  return configs
}
