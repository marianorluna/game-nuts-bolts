import { BoltStack } from './BoltStack'
import type { GameSession } from '../domain/types'

interface GameBoardProps {
  session: GameSession
  onSelectBolt: (index: number) => void
}

export function GameBoard({ session, onSelectBolt }: GameBoardProps) {
  const { bolts, capacity, selectedBoltIndex, shakeBoltIndex } = session

  const rows: number[][] = []
  // 2 filas a partir de 5 bulones; 4 o menos caben en una sola fila
  if (bolts.length <= 4) {
    rows.push(bolts.map((_, i) => i))
  } else {
    const mid = Math.ceil(bolts.length / 2)
    rows.push(bolts.slice(0, mid).map((_, i) => i))
    rows.push(bolts.slice(mid).map((_, i) => i + mid))
  }

  return (
    <div className="flex flex-col items-center gap-8 px-2">
      {rows.map((row, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex flex-wrap items-end justify-center gap-2 sm:gap-3"
        >
          {row.map((boltIndex) => (
            <BoltStack
              key={boltIndex}
              index={boltIndex}
              bolt={bolts[boltIndex]}
              capacity={capacity}
              isSelected={selectedBoltIndex === boltIndex}
              isShaking={shakeBoltIndex === boltIndex}
              onSelect={onSelectBolt}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
