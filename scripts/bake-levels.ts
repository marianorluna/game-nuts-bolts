import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  generateLevelBatch,
  LEVEL_SPECS,
} from '../src/domain/levelGenerator'
import {
  countCompleteBolts,
  countSplitColors,
  getMinSolutionMoves,
} from '../src/domain/levelValidator'
import type { LevelDefinition } from '../src/domain/types'

const MAX_STATES: Record<string, number> = {
  easy: 200_000,
  medium: 1_000_000,
  hard: 5_000_000,
}

console.log('Horneando niveles (scramble + criterios de calidad)...')

const generated = generateLevelBatch(LEVEL_SPECS)

const levels: LevelDefinition[] = generated.map((level) => {
  const maxStates = MAX_STATES[level.difficulty] ?? 2_000_000
  const minMoves = getMinSolutionMoves(level.bolts, level.capacity, maxStates)
  if (minMoves === null) {
    throw new Error(`Nivel ${level.id}: no se pudo calcular minMoves`)
  }
  return { ...level, minMoves, parMoves: minMoves }
})

const output = `import type { LevelDefinition } from '../types'

/** Niveles pre-generados: mezclados y verificados como solubles. */
export const BAKED_LEVELS: LevelDefinition[] = ${JSON.stringify(levels, null, 2)} as LevelDefinition[]
`

const outPath = resolve('src/domain/levels/bakedLevels.ts')
writeFileSync(outPath, output, 'utf8')

console.log(`✓ ${levels.length} niveles guardados en ${outPath}`)

for (const level of levels) {
  const maxStates = MAX_STATES[level.difficulty] ?? 2_000_000
  const minMoves = getMinSolutionMoves(level.bolts, level.capacity, maxStates)
  const split = countSplitColors(level.bolts)
  const complete = countCompleteBolts(level.bolts, level.capacity)
  console.log(
    `  Nivel ${level.id}: min ${minMoves} movs, ${split} colores repartidos, ${complete} bulones completos`,
  )
}
