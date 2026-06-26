import { useEffect, useRef, useState } from 'react'
import type { BoardBounds } from '../hooks/useResponsiveBoardScale'
import { useGameLogic } from '../hooks/useGameLogic'
import { useGameStore } from '../store/gameStore'
import { GameBoard } from './GameBoard'
import { WinModal } from './WinModal'
import { MovesInfoModal } from './MovesInfoModal'
import { MovesCoachMark } from './MovesCoachMark'
import { SettingsModal } from './SettingsModal'
import { BackArrowIcon, UndoArrowIcon, LevelHomeIcon } from './icons/GameIcons'
import { getStarThresholds } from '../domain/gameEngine'
import { MAX_LEVEL_ID } from '../domain/levels'
import { getStageForLevel } from '../domain/content/campaignStructure'
import { DIFFICULTY_LABELS, MAX_UNDOS } from '../domain/types'
import {
  hasSeenMovesCoachMark,
  markMovesCoachMarkSeen,
} from '../services/onboardingService'

export function LevelScreen() {
  const boardAreaRef = useRef<HTMLDivElement>(null)
  const [boardBounds, setBoardBounds] = useState<BoardBounds | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [movesInfoOpen, setMovesInfoOpen] = useState(false)
  const [coachMarkVisible, setCoachMarkVisible] = useState(false)
  const soundEnabled = useGameStore((s) => s.settings.soundEnabled)
  const { session, level, selectBolt, undo, resetLevel, startLevel, setScreen } =
    useGameLogic()

  useEffect(() => {
    setCoachMarkVisible(!hasSeenMovesCoachMark())
  }, [])

  useEffect(() => {
    const node = boardAreaRef.current
    if (!node) return

    const measure = () => {
      setBoardBounds({
        width: node.clientWidth,
        height: node.clientHeight,
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const dismissCoachMark = () => {
    markMovesCoachMarkSeen()
    setCoachMarkVisible(false)
  }

  const openMovesInfo = () => {
    dismissCoachMark()
    setMovesInfoOpen(true)
  }

  if (!session || !level) return null

  const maxUndos = MAX_UNDOS[level.difficulty]
  const undosRemaining = maxUndos - session.undosUsed
  const stage = getStageForLevel(level.id)
  const canUndo =
    session.history.length > 0 && !session.isWon && undosRemaining > 0
  const { threeStars } = getStarThresholds(level.minMoves)
  const onTrackForThreeStars = session.moves <= threeStars

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between px-4 py-3 pt-safe sm:px-6 md:px-8">
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95 hover:bg-white/25 md:h-14 md:w-14"
          aria-label="Volver"
        >
          <BackArrowIcon className="h-6 w-6 md:h-7 md:w-7" />
        </button>

        <div className="text-center">
          <p className="text-sm font-black tracking-[0.22em] text-amber-300 uppercase md:text-base">
            {stage?.name ?? DIFFICULTY_LABELS[level.difficulty]}
          </p>
          <h1
            className="text-4xl font-black text-white md:text-5xl"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.45)' }}
          >
            Nivel {level.id}
          </h1>
        </div>

        <button
          type="button"
          onClick={resetLevel}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95 hover:bg-white/25 md:h-14 md:w-14"
          aria-label="Volver al inicio del nivel"
        >
          <LevelHomeIcon className="h-6 w-6 md:h-7 md:w-7" />
        </button>
      </header>

      <div
        ref={boardAreaRef}
        className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden py-4 md:py-6"
      >
        <GameBoard
          session={session}
          onSelectBolt={selectBolt}
          boardBounds={boardBounds}
        />
      </div>

      <footer
        className="flex shrink-0 items-center justify-between px-6 py-3 sm:px-8 md:px-10"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
      >
        <div className="flex w-[4.5rem] justify-start md:w-[5.5rem]">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95 hover:bg-white/25 disabled:opacity-30 md:h-14 md:w-14"
            aria-label={`Deshacer (${undosRemaining} restantes)`}
          >
            <UndoArrowIcon className="h-5 w-5 md:h-6 md:w-6" />
            <span className="mt-0.5 text-[11px] font-bold leading-none md:text-xs">
              {undosRemaining}
            </span>
          </button>
        </div>

        <div className="relative overflow-visible">
          {coachMarkVisible && <MovesCoachMark onDismiss={dismissCoachMark} />}

          <button
            type="button"
            onClick={openMovesInfo}
            className="relative min-h-12 min-w-[4.5rem] rounded-2xl bg-white/15 px-5 py-3 text-center transition active:scale-95 hover:bg-white/25 md:min-h-14 md:min-w-[5.5rem] md:px-6"
            aria-label={`${session.moves} movimientos. Toca para ver cómo ganar estrellas.`}
          >
            <span
              className="absolute top-1.5 right-2 text-[11px] font-bold leading-none text-purple-200 md:text-xs"
              aria-hidden="true"
            >
              ⓘ
            </span>
            <span
              className={`block text-5xl font-black md:text-6xl ${onTrackForThreeStars ? 'text-white' : 'text-amber-300'}`}
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
            >
              {session.moves}
            </span>
          </button>
        </div>

        <div className="flex w-[4.5rem] justify-end md:w-[5.5rem]">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-xl text-white transition active:scale-95 hover:bg-white/25 md:h-14 md:w-14 md:text-2xl"
            aria-label="Configuración"
          >
            {soundEnabled ? '⚙️' : '🔇'}
          </button>
        </div>
      </footer>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <MovesInfoModal
        open={movesInfoOpen}
        onClose={() => setMovesInfoOpen(false)}
        minMoves={level.minMoves}
        currentMoves={session.moves}
      />

      {session.isWon && (
        <WinModal
          levelId={session.levelId}
          moves={session.moves}
          onNext={() => {
            const nextId = session.levelId + 1
            if (nextId <= MAX_LEVEL_ID) {
              startLevel(nextId)
            } else {
              setScreen('home')
            }
          }}
          onReplay={resetLevel}
          onHome={() => setScreen('home')}
        />
      )}
    </div>
  )
}
