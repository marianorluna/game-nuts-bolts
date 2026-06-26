import { HAND_CRAFTED_LEVELS } from '../src/domain/handCraftedLevels'
import { getPlayContext } from '../src/domain/gameEngine'
import { enrichLevelMetadata } from '../src/domain/content/campaignStructure'
import { isLevelSolvable, getMinSolutionMoves } from '../src/domain/levelValidator'

for (const crafted of HAND_CRAFTED_LEVELS) {
  const level = enrichLevelMetadata({
    ...crafted,
    id: crafted.id,
    minMoves: 0,
    parMoves: 0,
    mechanics: ['multiNut', 'lockedBolt'],
    boltConfigs: crafted.boltConfigs,
  })
  const ctx = getPlayContext(level)
  const ok = isLevelSolvable(crafted.bolts, crafted.capacity, 1_000_000, ctx)
  const min = getMinSolutionMoves(crafted.bolts, crafted.capacity, 1_000_000, ctx)
  console.log(`Level ${crafted.id}: ${ok ? 'OK' : 'FAIL'} min=${min}`)
  if (!ok) process.exit(1)
}
