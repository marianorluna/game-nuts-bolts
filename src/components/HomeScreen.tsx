import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { ALL_LEVELS } from '../domain/levels'
import {
  countCompletedInRange,
  getChallengeLabel,
  getLevelsByStage,
  SECTION_1_FUNDAMENTOS,
  type StageMeta,
} from '../domain/content/campaignStructure'
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

  const section = SECTION_1_FUNDAMENTOS
  const publishedLevels = ALL_LEVELS.filter(
    (l) => l.id >= section.levelFrom && l.id <= section.levelTo,
  )
  const publishedCount = publishedLevels.length

  const isCompleted = (id: number) => (progress.levels[id]?.completed ?? false)
  const sectionCompleted = countCompletedInRange(
    publishedLevels,
    section.levelFrom,
    section.levelTo,
    isCompleted,
  )

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

  const getStageProgress = (stage: StageMeta, stageLevels: typeof publishedLevels) => {
    const total = stageLevels.length
    const completed = countCompletedInRange(
      stageLevels,
      stage.levelFrom,
      stage.levelTo,
      isCompleted,
    )
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0
    return { completed, total, percent }
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-8 pt-safe sm:px-6 md:px-8">
      <header className="relative py-6 text-center md:py-8">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="absolute right-0 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-xl text-white md:h-14 md:w-14 md:text-2xl"
          aria-label="Configuración"
        >
          {soundEnabled ? '⚙️' : '🔇'}
        </button>
        <div className="mb-2 text-5xl md:text-6xl">🔩</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Nuts & Bolts
        </h1>
        <p className="mt-1 text-sm text-purple-200 md:text-base">
          {section.name} · {sectionCompleted}/{publishedCount}
        </p>
      </header>

      {allCompleted && (
        <p className="mx-auto mb-3 max-w-xs text-center text-sm font-medium text-amber-200 sm:max-w-md md:text-base">
          ¡Completaste los {totalLevels} niveles publicados! 🎉
        </p>
      )}

      <button
        type="button"
        onClick={() => startLevel(getContinueLevel())}
        className="mx-auto mb-8 w-full max-w-sm rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-lg font-bold text-white shadow-lg transition active:scale-95 sm:max-w-md md:max-w-lg md:py-5 md:text-xl"
      >
        {continueLabel}
      </button>

      <div className="flex w-full flex-col gap-6 md:gap-8">
        {section.stages.map((stage) => {
          const stageLevels = getLevelsByStage(ALL_LEVELS, stage)
          if (stageLevels.length === 0) return null

          const { completed, total, percent } = getStageProgress(stage, stageLevels)

          return (
            <section key={stage.id}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h2 className="text-xs font-bold tracking-widest text-purple-300 md:text-sm">
                  {stage.name.toUpperCase()}
                </h2>
                <span className="text-[10px] font-medium text-purple-300/70 md:text-xs">
                  {stage.levelFrom}–{stage.levelTo}
                </span>
              </div>
              <p className="mb-2 text-[11px] leading-snug text-purple-200/80 md:text-xs">
                {stage.blurb}
              </p>
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-[10px] font-medium text-purple-200 md:text-xs">
                  <span>
                    {completed}/{total}
                  </span>
                  <span>{percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10 md:h-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 md:gap-3">
                {stageLevels.map((level) => {
                  const unlocked = isLevelUnlocked(level.id)
                  const stars = getLevelStars(level.id)
                  const isChallenge = level.isChallenge ?? false
                  const challengeLabel = isChallenge ? getChallengeLabel(level.id) : undefined

                  return (
                    <button
                      key={level.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => startLevel(level.id)}
                      aria-label={
                        unlocked
                          ? isChallenge
                            ? challengeLabel ?? `Reto nivel ${level.id}`
                            : `Nivel ${level.id}`
                          : `Nivel ${level.id} bloqueado`
                      }
                      className={`
                        relative flex aspect-square flex-col items-center justify-center
                        rounded-xl text-sm font-bold transition active:scale-95
                        md:text-base
                        ${
                          unlocked
                            ? isChallenge
                              ? 'bg-amber-500/25 text-amber-100 ring-1 ring-amber-400/40 hover:bg-amber-500/35'
                              : 'bg-white/15 text-white hover:bg-white/25'
                            : 'bg-white/5 text-white/30'
                        }
                      `}
                    >
                      {!unlocked ? (
                        <span className="text-lg">🔒</span>
                      ) : isChallenge ? (
                        <>
                          <span className="text-2xl leading-none md:text-3xl" aria-hidden="true">
                            ⚡
                          </span>
                          {stars > 0 && (
                            <span className="absolute bottom-1 text-[10px] text-amber-300">
                              {'⭐'.repeat(stars)}
                            </span>
                          )}
                        </>
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
          )
        })}
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
