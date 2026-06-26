import { ALL_LEVELS } from '../src/domain/levels'
import { getPlayContext } from '../src/domain/gameEngine'
import { LEVEL_SPECS } from '../src/domain/levelGenerator'
import {
  countCompleteBolts,
  countSplitColors,
  getMinSolutionMoves,
  isLevelScrambled,
  isLevelSolvable,
  meetsLevelQuality,
  validateLevelStructure,
} from '../src/domain/levelValidator'

const MAX_STATES: Record<string, number> = {
  easy: 200_000,
  medium: 1_000_000,
  hard: 5_000_000,
}

let failed = 0
const seenLayouts = new Map<string, number>()

function serializeBolts(bolts: typeof ALL_LEVELS[number]['bolts']): string {
  return bolts.map((b) => b.join(',')).join('|')
}

for (const level of ALL_LEVELS) {
  const layoutKey = serializeBolts(level.bolts)
  const duplicateOf = seenLayouts.get(layoutKey)
  if (duplicateOf !== undefined) {
    console.error(`Level ${level.id}: DUPLICATE of level ${duplicateOf}`)
    failed += 1
    continue
  }
  seenLayouts.set(layoutKey, level.id)

  const structure = validateLevelStructure(level.bolts, level.capacity)
  if (!structure.valid) {
    console.error(`Level ${level.id}: STRUCTURE FAIL - ${structure.error}`)
    failed += 1
    continue
  }

  const scrambled = isLevelScrambled(level.bolts, level.capacity)
  if (!scrambled) {
    console.error(`Level ${level.id} (${level.difficulty}): NOT SCRAMBLED`)
    failed += 1
    continue
  }

  const maxStates = MAX_STATES[level.difficulty] ?? 2_000_000
  const ctx = getPlayContext(level)
  const solvable = isLevelSolvable(level.bolts, level.capacity, maxStates, ctx)
  if (!solvable) {
    console.error(`Level ${level.id} (${level.difficulty}): NOT SOLVABLE`)
    failed += 1
    continue
  }

  const spec = LEVEL_SPECS.find((s) => s.id === level.id)
  if (spec) {
    const quality = meetsLevelQuality(
      level.bolts,
      level.capacity,
      spec.quality,
      maxStates,
      ctx,
    )
    if (!quality.ok) {
      console.error(
        `Level ${level.id} (${level.difficulty}): QUALITY FAIL - ${quality.reason}`,
      )
      failed += 1
      continue
    }
  }

  const minMoves = getMinSolutionMoves(level.bolts, level.capacity, maxStates, ctx)
  if (minMoves === null) {
    console.error(`Level ${level.id} (${level.difficulty}): MIN MOVES UNKNOWN`)
    failed += 1
    continue
  }

  if (level.minMoves !== minMoves) {
    console.error(
      `Level ${level.id}: minMoves mismatch (stored ${level.minMoves}, actual ${minMoves})`,
    )
    failed += 1
    continue
  }

  if (level.parMoves !== minMoves) {
    console.error(
      `Level ${level.id}: parMoves should equal minMoves (${minMoves})`,
    )
    failed += 1
    continue
  }

  const split = countSplitColors(level.bolts)
  const complete = countCompleteBolts(level.bolts, level.capacity)
  console.log(
    `Level ${level.id} (${level.difficulty}): OK — min ${minMoves} moves, ${split} split colors, ${complete} complete bolts`,
  )
}

if (failed > 0) {
  console.error(`\n${failed} level(s) failed validation`)
  process.exit(1)
}

console.log(`\nAll ${ALL_LEVELS.length} levels validated successfully`)
