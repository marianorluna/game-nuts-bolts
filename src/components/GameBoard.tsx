import { getBoltCapacity, getMaxBoardCapacity, isBoltLocked } from '../domain/gameEngine'
import { BoltStack } from './BoltStack'
import type { GameSession } from '../domain/types'
import {
  type BoardBounds,
  useBoardLayout,
} from '../hooks/useResponsiveBoardScale'

interface GameBoardProps {
  session: GameSession
  onSelectBolt: (index: number) => void
  boardBounds?: BoardBounds | null
}

export function GameBoard({ session, onSelectBolt, boardBounds }: GameBoardProps) {
  const { bolts, capacity, selectedBoltIndex, shakeBoltIndex, playContext } =
    session
  const displayCapacity = getMaxBoardCapacity(
    bolts.length,
    capacity,
    playContext,
  )
  const { rows, scale, width, height } = useBoardLayout(
    bolts.length,
    displayCapacity,
    boardBounds,
  )

  return (
    <div
      className="mx-auto"
      style={{
        width: width * scale,
        height: height * scale,
      }}
    >
      <div
        className="flex flex-col items-center gap-10 px-2"
        style={{
          width,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >      {rows.map((row, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex flex-wrap items-end justify-center gap-2 sm:gap-3"
        >
          {row.map((boltIndex) => (
            <BoltStack
              key={boltIndex}
              index={boltIndex}
              bolt={bolts[boltIndex]}
              boltCapacity={getBoltCapacity(boltIndex, capacity, playContext)}
              isSelected={selectedBoltIndex === boltIndex}
              isShaking={shakeBoltIndex === boltIndex}
              isLocked={isBoltLocked(
                boltIndex,
                bolts,
                capacity,
                playContext,
              )}
              fixedColor={playContext.boltConfigs[boltIndex]?.fixedColor}
              multiNut={playContext.multiNut}
              onSelect={onSelectBolt}
            />
          ))}
        </div>
      ))}
      </div>
    </div>
  )
}
