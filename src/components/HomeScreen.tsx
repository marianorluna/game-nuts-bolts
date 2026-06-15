import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { ALL_LEVELS } from '../domain/levels'
import { DIFFICULTY_LABELS } from '../domain/types'
import { SettingsModal } from './SettingsModal'
import { CreditsModal } from './CreditsModal'
import { AUTHOR } from '../config/author'

export function HomeScreen() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [creditsOpen, setCreditsOpen] = useState(false)
  const startLevel = useGameStore((s) => s.startLevel)
  const isLevelUnlocked = useGameStore((s) => s.isLevelUnlocked)
  const getLevelStars = useGameStore((s) => s.getLevelStars)
  const progress = useGameStore((s) => s.progress)
  const soundEnabled = useGameStore((s) => s.settings.soundEnabled)

  const sections = [
    { label: DIFFICULTY_LABELS.easy, levels: ALL_LEVELS.filter((l) => l.difficulty === 'easy') },
    { label: DIFFICULTY_LABELS.medium, levels: ALL_LEVELS.filter((l) => l.difficulty === 'medium') },
    { label: DIFFICULTY_LABELS.hard, levels: ALL_LEVELS.filter((l) => l.difficulty === 'hard') },
  ]

  const totalLevels = ALL_LEVELS.length
  const allCompleted = progress.unlockedLevel > totalLevels

  const getContinueLevel = (): number => {
    if (!allCompleted) return progress.unlockedLevel

    let target = 1
    let minStars = getLevelStars(1)
    for (let id = 2; id <= totalLevels; id++) {
      const stars = getLevelStars(id)
      if (stars < minStars) {
        minStars = stars
        target = id
      }
    }
    if (minStars < 3) return target
    return Math.floor(Math.random() * totalLevels) + 1
  }

  const hasImprovableStars = ALL_LEVELS.some((l) => getLevelStars(l.id) < 3)

  const continueLabel = allCompleted
    ? hasImprovableStars
      ? 'Mejorar estrellas'
      : '¡Seguir jugando!'
    : `Jugar Nivel ${progress.unlockedLevel}`

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-8 pt-safe">
      <header className="relative py-6 text-center">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="absolute right-0 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-xl text-white"
          aria-label="Configuración"
        >
          {soundEnabled ? '⚙️' : '🔇'}
        </button>
        <div className="mb-2 text-5xl">🔩</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Nuts & Bolts
        </h1>
        <p className="mt-1 text-sm text-purple-200">
          Ordena las tuercas por color
        </p>
      </header>

      {allCompleted && (
        <p className="mx-auto mb-3 max-w-xs text-center text-sm font-medium text-amber-200">
          ¡Completaste los {totalLevels} niveles! 🎉
        </p>
      )}

      <button
        type="button"
        onClick={() => startLevel(getContinueLevel())}
        className="mx-auto mb-8 w-full max-w-xs rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-lg font-bold text-white shadow-lg transition active:scale-95"
      >
        {continueLabel}
      </button>

      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <section key={section.label}>
            <h2 className="mb-3 text-xs font-bold tracking-widest text-purple-300">
              {section.label}
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {section.levels.map((level) => {
                const unlocked = isLevelUnlocked(level.id)
                const stars = getLevelStars(level.id)

                return (
                  <button
                    key={level.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => startLevel(level.id)}
                    className={`
                      relative flex aspect-square flex-col items-center justify-center
                      rounded-xl text-sm font-bold transition active:scale-95
                      ${
                        unlocked
                          ? 'bg-white/15 text-white hover:bg-white/25'
                          : 'bg-white/5 text-white/30'
                      }
                    `}
                  >
                    {!unlocked ? (
                      <span className="text-lg">🔒</span>
                    ) : (
                      <>
                        <span>{level.id}</span>
                        {stars > 0 && (
                          <span className="absolute bottom-1 text-[10px] text-amber-300">
                            {'⭐'.repeat(stars)}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-auto pt-8 text-center">
        <button
          type="button"
          onClick={() => setCreditsOpen(true)}
          className="text-xs text-purple-300/80 transition hover:text-purple-200"
        >
          {AUTHOR.name} © {new Date().getFullYear()}
        </button>
      </footer>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenCredits={() => {
          setSettingsOpen(false)
          setCreditsOpen(true)
        }}
      />
      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </div>
  )
}
