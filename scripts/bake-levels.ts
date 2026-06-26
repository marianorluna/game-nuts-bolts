import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { enrichLevelMetadata } from '../src/domain/content/campaignStructure'
import {
  generateLevelBatch,
  LEVEL_SPECS,
} from '../src/domain/levelGenerator'
import { getPlayContext } from '../src/domain/gameEngine'
import {
  getMinSolutionMoves,
} from '../src/domain/levelValidator'
import type { LevelDefinition } from '../src/domain/types'

const MAX_STATES: Record<string, number> = {
  easy: 200_000,
  medium: 1_000_000,
  hard: 5_000_000,
}

function serializeBolts(bolts: LevelDefinition['bolts']): string {
  return bolts.map((b) => b.join(',')).join('|')
}

function parseFromArg(): number {
  const fromFlag = process.argv.find((arg) => arg.startsWith('--from='))
  if (fromFlag) {
    const value = Number.parseInt(fromFlag.split('=')[1] ?? '', 10)
    if (!Number.isNaN(value) && value >= 1) return value
  }
  return 1
}

function loadFrozenLevels(fromId: number): LevelDefinition[] {
  if (fromId <= 1) return []

  const bakedPath = resolve('src/domain/levels/bakedLevels.ts')
  const source = readFileSync(bakedPath, 'utf8')
  const match = source.match(
    /export const BAKED_LEVELS: LevelDefinition\[\] = (\[[\s\S]*\]) as LevelDefinition\[\]/,
  )
  if (!match) {
    throw new Error('No se pudo leer BAKED_LEVELS del archivo hornado existente')
  }

  const existing = JSON.parse(match[1]) as LevelDefinition[]
  const frozen = existing.filter((level) => level.id < fromId)

  if (frozen.length !== fromId - 1) {
    throw new Error(
      `Se esperaban ${fromId - 1} niveles congelados (ids < ${fromId}), encontrados ${frozen.length}`,
    )
  }

  for (let id = 1; id < fromId; id += 1) {
    if (frozen[id - 1]?.id !== id) {
      throw new Error(`Hueco o desorden en niveles congelados cerca del id ${id}`)
    }
  }

  return frozen
}

function verifyFrozenUnchanged(
  before: LevelDefinition[],
  after: LevelDefinition[],
): void {
  for (const level of before) {
    const next = after.find((l) => l.id === level.id)
    if (!next) {
      throw new Error(`Nivel congelado ${level.id} desapareció del output`)
    }
    if (serializeBolts(level.bolts) !== serializeBolts(next.bolts)) {
      throw new Error(`Layout del nivel ${level.id} cambió — abortando hornado`)
    }
    if (level.minMoves !== next.minMoves) {
      throw new Error(`minMoves del nivel ${level.id} cambió — abortando hornado`)
    }
  }
}

const fromId = parseFromArg()
const frozenLevels = loadFrozenLevels(fromId)
const specsToBake = LEVEL_SPECS.filter((spec) => spec.id >= fromId)

if (specsToBake.length === 0) {
  console.log(`No hay specs con id >= ${fromId}. Nada que hornear.`)
  process.exit(0)
}

console.log(
  `Horneando niveles ${specsToBake[0]?.id}–${specsToBake[specsToBake.length - 1]?.id}` +
    (frozenLevels.length > 0 ? ` (preservando 1–${fromId - 1})` : '') +
    '...',
)

const usedLayouts = new Set(frozenLevels.map((level) => serializeBolts(level.bolts)))
const generated: LevelDefinition[] = []

for (const spec of specsToBake) {
  process.stdout.write(`  Generando nivel ${spec.id}...`)
  const [level] = generateLevelBatch([spec], usedLayouts)
  const maxStates = MAX_STATES[level.difficulty] ?? 2_000_000
  const enrichedBase = enrichLevelMetadata({
    ...level,
    minMoves: 0,
    parMoves: level.parMoves,
  })
  const ctx = getPlayContext(enrichedBase)
  const minMoves = getMinSolutionMoves(
    level.bolts,
    level.capacity,
    maxStates,
    ctx,
  )
  if (minMoves === null) {
    throw new Error(`Nivel ${level.id}: sin solución con las reglas del nivel`)
  }
  const enriched = { ...enrichedBase, minMoves, parMoves: minMoves }
  generated.push(enriched)
  usedLayouts.add(serializeBolts(level.bolts))
  console.log(` min ${minMoves}`)
}

const levels: LevelDefinition[] = [
  ...frozenLevels.map(enrichLevelMetadata),
  ...generated,
]
verifyFrozenUnchanged(frozenLevels, levels)

const output = `import type { LevelDefinition } from '../types'

/** Niveles pre-generados: mezclados y verificados como solubles. */
export const BAKED_LEVELS: LevelDefinition[] = ${JSON.stringify(levels, null, 2)} as LevelDefinition[]
`

const outPath = resolve('src/domain/levels/bakedLevels.ts')
writeFileSync(outPath, output, 'utf8')

console.log(`✓ ${levels.length} niveles guardados en ${outPath}`)
