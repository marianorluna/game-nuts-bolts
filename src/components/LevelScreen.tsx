import { useState } from 'react'
import { useGameLogic } from '../hooks/useGameLogic'
import { useGameStore } from '../store/gameStore'
import { GameBoard } from './GameBoard'
import { WinModal } from './WinModal'
import { SettingsModal } from './SettingsModal'
import { MAX_LEVEL_ID } from '../domain/levels'
import { DIFFICULTY_LABELS, MAX_UNDOS } from '../domain/types'

export function LevelScreen() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const soundEnabled = useGameStore((s) => s.settings.soundEnabled)
  const { session, level, selectBolt, undo, resetLevel, startLevel, setScreen } =
    useGameLogic()

  if (!session || !level) return null

  const maxUndos = MAX_UNDOS[level.difficulty]
  const undosRemaining = maxUndos - session.undosUsed
  const canUndo =
    session.history.length > 0 && !session.isWon && undosRemaining > 0

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-3 pt-safe">
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white"
          aria-label="Volver"
        >
          ←
        </button>

        <div className="text-center">
          <p className="text-sm font-black tracking-[0.22em] text-amber-300 uppercase">
            {DIFFICULTY_LABELS[level.difficulty]}
          </p>
          <h1
            className="text-4xl font-black text-white"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.45)' }}
          >
            Nivel {level.id}
          </h1>
        </div>

        <button
          type="button"
          onClick={resetLevel}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white"
          aria-label="Reiniciar"
        >
          ↺
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center py-4">
        <GameBoard session={session} onSelectBolt={selectBolt} />
      </div>

      <footer
        className="flex items-center justify-between px-6 py-3 pt-safe"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
      >
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className="rounded-2xl bg-white/15 px-4 py-3 text-base font-bold text-white disabled:opacity-30"
        >
          Deshacer
          <span className="ml-1 text-sm font-semibold text-purple-200">
            ({undosRemaining})
          </span>
        </button>

        <div className="text-center">
          <p className="text-sm font-bold text-purple-300 tracking-widest">Movimientos</p>
          <p
            className="text-5xl font-black text-white"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
          >
            {session.moves}
          </p>
        </div>

        <div className="w-[88px] flex justify-end">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-xl text-white"
            aria-label="Configuración"
          >
            {soundEnabled ? '⚙️' : '🔇'}
          </button>
        </div>
      </footer>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

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
          onHome={() => setScreen('home')}
        />
      )}
    </div>
  )
}
