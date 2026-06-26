import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { ALL_LEVELS } from '../domain/levels'
import {
  CAMPAIGN_1_TALLER,
  countCompletedInRange,
  getDefaultHomeStageId,
  getLevelsByStage,
  getStageProgressStats,
  getUnlockedStageIndices,
  SECTION_1_FUNDAMENTOS,
} from '../domain/content/campaignStructure'
import { DEV_UNLOCK_ALL_LEVELS } from '../config/dev'
import {
  getCampaignName,
  getChallengeLabel,
  getStageBlurb,
  getStageName,
} from '../i18n/campaignLabels'
import { useTranslation } from '../i18n/useTranslation'
import { BackArrowIcon, ChevronLeftIcon, ChevronRightIcon } from './icons/GameIcons'
import { SettingsModal } from './SettingsModal'
import { AppFooter } from './AppFooter'
import { EndOfContentModal } from './EndOfContentModal'
import { MAX_LEVEL_ID } from '../domain/levels'
import {
  hasSeenEndOfContentModal,
  markEndOfContentModalSeen,
} from '../services/endOfContentService'

export function CampaignScreen() {
  const { t } = useTranslation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [endOfContentOpen, setEndOfContentOpen] = useState(false)
  const startLevel = useGameStore((s) => s.startLevel)
  const goHome = useGameStore((s) => s.goHome)
  const isLevelUnlocked = useGameStore((s) => s.isLevelUnlocked)
  const getLevelStars = useGameStore((s) => s.getLevelStars)
  const progress = useGameStore((s) => s.progress)
  const homeStageId = useGameStore((s) => s.homeStageId)
  const setHomeStageId = useGameStore((s) => s.setHomeStageId)
  const soundEnabled = useGameStore((s) => s.settings.soundEnabled)

  const campaign = CAMPAIGN_1_TALLER
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

  const unlockedStageIndices = useMemo(
    () =>
      DEV_UNLOCK_ALL_LEVELS
        ? section.stages.map((_, index) => index)
        : getUnlockedStageIndices(section, isCompleted),
    [section, progress.levels],
  )

  const stage =
    section.stages.find((s) => s.id === homeStageId) ?? section.stages[0]!
  const stageIndex = section.stages.findIndex((s) => s.id === stage.id)
  const visibleStageIndex = unlockedStageIndices.includes(stageIndex)
    ? unlockedStageIndices.indexOf(stageIndex)
    : 0

  const stageName = getStageName(t, stage.id)
  const stageBlurb = getStageBlurb(t, stage.id)
  const campaignName = getCampaignName(t, campaign.id)

  useEffect(() => {
    if (unlockedStageIndices.includes(stageIndex)) return
    setHomeStageId(
      getDefaultHomeStageId(section, isCompleted, progress.unlockedLevel),
    )
  }, [progress.levels, progress.unlockedLevel, stageIndex, unlockedStageIndices, setHomeStageId, section])

  useEffect(() => {
    const justCompletedLast =
      isCompleted(MAX_LEVEL_ID) &&
      progress.unlockedLevel > MAX_LEVEL_ID &&
      !hasSeenEndOfContentModal()
    if (justCompletedLast) {
      setEndOfContentOpen(true)
    }
  }, [progress.levels, progress.unlockedLevel])

  const totalLevels = ALL_LEVELS.length
  const allCompleted = progress.unlockedLevel > totalLevels

  const getContinueLevel = (): number => {
    if (!allCompleted) {
      if (isLevelUnlocked(progress.unlockedLevel)) return progress.unlockedLevel
      for (const level of ALL_LEVELS) {
        if (isLevelUnlocked(level.id) && !isCompleted(level.id)) return level.id
      }
      return progress.unlockedLevel
    }

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
  const continueLevel = getContinueLevel()

  const continueLabel = allCompleted
    ? hasImprovableStars
      ? t('campaign.improveStars')
      : t('campaign.keepPlaying')
    : t('campaign.playLevel', { level: continueLevel })

  const stageLevels = getLevelsByStage(ALL_LEVELS, stage)
  const { completed, total, percent } = getStageProgressStats(stage, isCompleted)

  const canGoPrev = visibleStageIndex > 0
  const canGoNext = visibleStageIndex < unlockedStageIndices.length - 1

  const goToPrevStage = () => {
    if (!canGoPrev) return
    const prevIndex = unlockedStageIndices[visibleStageIndex - 1]!
    setHomeStageId(section.stages[prevIndex]!.id)
  }

  const goToNextStage = () => {
    if (!canGoNext) return
    const nextIndex = unlockedStageIndices[visibleStageIndex + 1]!
    setHomeStageId(section.stages[nextIndex]!.id)
  }

  const dismissEndOfContent = () => {
    markEndOfContentModalSeen()
    setEndOfContentOpen(false)
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden px-4 pt-safe sm:px-6 md:px-8">
      <header className="relative shrink-0 py-4 text-center md:py-5">
        <button
          type="button"
          onClick={goHome}
          className="absolute left-0 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95 hover:bg-white/25 md:top-5 md:h-12 md:w-12"
          aria-label={t('campaign.backToCampaigns')}
        >
          <BackArrowIcon className="h-6 w-6 md:h-7 md:w-7" />
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="absolute right-0 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl text-white md:top-5 md:h-12 md:w-12 md:text-2xl"
          aria-label={t('common.settings')}
        >
          {soundEnabled ? '⚙️' : '🔇'}
        </button>
        <div className="mb-1 text-4xl md:text-5xl">{campaign.emoji}</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          {campaignName}
        </h1>
        <p className="mt-0.5 text-sm text-purple-200">
          {sectionCompleted}/{publishedCount}
        </p>
      </header>

      <main className="scrollbar-hidden flex min-h-0 flex-1 flex-col overflow-y-auto">
        {allCompleted && (
          <p className="mx-auto mb-2 max-w-xs text-center text-sm font-medium text-amber-200 sm:max-w-md">
            {t('campaign.allLevelsCompleted', { count: totalLevels })}
          </p>
        )}

        <button
          type="button"
          onClick={() => startLevel(continueLevel)}
          className="mx-auto mb-4 w-full max-w-sm shrink-0 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-lg font-bold text-white shadow-lg transition active:scale-95 sm:max-w-md md:max-w-lg md:py-4 md:text-xl"
        >
          {continueLabel}
        </button>

        <section className="flex w-full flex-col pb-2">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={goToPrevStage}
            disabled={!canGoPrev}
            aria-label={t('campaign.prevStage')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition enabled:hover:bg-white/20 enabled:active:scale-95 disabled:opacity-30 md:h-11 md:w-11"
          >
            <ChevronLeftIcon className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <div className="mb-1 flex items-baseline justify-center gap-2">
              <h2 className="truncate text-xs font-bold tracking-widest text-purple-300 md:text-sm">
                {stageName.toUpperCase()}
              </h2>
              <span className="shrink-0 text-[10px] font-medium text-purple-300/70 md:text-xs">
                {stage.levelFrom}–{stage.levelTo}
              </span>
            </div>
            <p className="text-[11px] leading-snug text-purple-200/80 md:text-xs">
              {stageBlurb}
            </p>
          </div>

          <button
            type="button"
            onClick={goToNextStage}
            disabled={!canGoNext}
            aria-label={t('campaign.nextStage')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition enabled:hover:bg-white/20 enabled:active:scale-95 disabled:opacity-30 md:h-11 md:w-11"
          >
            <ChevronRightIcon className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>

        {unlockedStageIndices.length > 1 && (
          <div className="mb-3 flex justify-center gap-2">
            {unlockedStageIndices.map((index) => {
              const dotStage = section.stages[index]!
              return (
              <button
                key={dotStage.id}
                type="button"
                onClick={() => setHomeStageId(dotStage.id)}
                aria-label={t('campaign.goToStage', { name: getStageName(t, dotStage.id) })}
                aria-current={index === stageIndex ? 'true' : undefined}
                className={`h-2 rounded-full transition-all ${
                  index === stageIndex
                    ? 'w-6 bg-amber-400'
                    : 'w-2 bg-white/25 hover:bg-white/40'
                }`}
              />
              )
            })}
          </div>
        )}

        <div className="mb-4">
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

        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-10 md:gap-3">
          {stageLevels.map((level) => {
            const unlocked = isLevelUnlocked(level.id)
            const stars = getLevelStars(level.id)
            const isChallenge = level.isChallenge ?? false
            const challengeLabel = isChallenge ? getChallengeLabel(t, level.id) : undefined

            return (
              <button
                key={level.id}
                type="button"
                disabled={!unlocked}
                onClick={() => startLevel(level.id)}
                aria-label={
                  unlocked
                    ? isChallenge
                      ? challengeLabel ?? t('campaign.challengeLevel', { level: level.id })
                      : t('campaign.level', { level: level.id })
                    : t('campaign.levelLocked', { level: level.id })
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
      </main>

      <AppFooter />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <EndOfContentModal open={endOfContentOpen} onClose={dismissEndOfContent} />
    </div>
  )
}
