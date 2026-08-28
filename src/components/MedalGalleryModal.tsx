import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameModal } from './GameModal'
import { useTranslation } from '../i18n/useTranslation'
import { useGameStore } from '../store/gameStore'
import { getChallengeLabel, getStageName } from '../i18n/campaignLabels'
import {
  CAMPAIGN_1_TALLER,
  getFlattenedStages,
  getStageForLevel,
} from '../domain/content/campaignStructure'
import { getMedalLevelIds } from '../domain/challenges/medalVisuals'
import { DEV_PREVIEW_ALL_MEDALS } from '../config/dev'
import { MedalBadge } from './MedalBadge'
import { ChevronLeftIcon, ChevronRightIcon } from './icons/GameIcons'

interface MedalGalleryModalProps {
  open: boolean
  onClose: () => void
}

export function MedalGalleryModal({ open, onClose }: MedalGalleryModalProps) {
  const { t } = useTranslation()
  const getChallengeProgress = useGameStore((s) => s.getChallengeProgress)
  const medalIds = getMedalLevelIds()
  const [selectedStageId, setSelectedStageId] = useState<string>('')
  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const tabButtonRefs = useRef(new Map<string, HTMLButtonElement>())

  const isEarned = (levelId: number) => {
    if (DEV_PREVIEW_ALL_MEDALS) return true
    return getChallengeProgress(levelId)?.outcome === 'mastered'
  }

  const earnedCount = medalIds.filter(isEarned).length

  const stagesWithMedals = useMemo(() => {
    const stages = getFlattenedStages(CAMPAIGN_1_TALLER)
    return stages
      .map((stage) => ({
        stage,
        medalIds: medalIds.filter((id) => getStageForLevel(id)?.id === stage.id),
      }))
      .filter((group) => group.medalIds.length > 0)
  }, [medalIds])

  const selectedGroup =
    stagesWithMedals.find((group) => group.stage.id === selectedStageId) ??
    stagesWithMedals[0]

  const selectedIndex = stagesWithMedals.findIndex(
    (group) => group.stage.id === selectedGroup?.stage.id,
  )

  const centerSelectedTab = useCallback(
    (stageId: string, behavior: ScrollBehavior = 'smooth') => {
      const container = tabsScrollRef.current
      const tab = tabButtonRefs.current.get(stageId)
      if (!container || !tab) return

      const containerRect = container.getBoundingClientRect()
      const tabRect = tab.getBoundingClientRect()
      const tabCenter = tabRect.left + tabRect.width / 2
      const containerCenter = containerRect.left + containerRect.width / 2
      const delta = tabCenter - containerCenter
      const maxScroll = container.scrollWidth - container.clientWidth
      const nextLeft = Math.max(0, Math.min(maxScroll, container.scrollLeft + delta))

      container.scrollTo({ left: nextLeft, behavior })
    },
    [],
  )

  const selectStage = useCallback((stageId: string) => {
    setSelectedStageId(stageId)
  }, [])

  const goToAdjacentTab = useCallback(
    (direction: -1 | 1) => {
      if (stagesWithMedals.length === 0) return
      const current = selectedIndex >= 0 ? selectedIndex : 0
      const next =
        (current + direction + stagesWithMedals.length) % stagesWithMedals.length
      selectStage(stagesWithMedals[next]!.stage.id)
    },
    [selectedIndex, selectStage, stagesWithMedals],
  )

  useEffect(() => {
    if (!open || stagesWithMedals.length === 0) return
    setSelectedStageId(stagesWithMedals[0]!.stage.id)
  }, [open, stagesWithMedals])

  useEffect(() => {
    if (!open || !selectedStageId) return
    const timer = window.setTimeout(() => {
      centerSelectedTab(selectedStageId)
    }, 50)
    return () => window.clearTimeout(timer)
  }, [open, selectedStageId, centerSelectedTab])

  const stageEarnedCount =
    selectedGroup?.medalIds.filter(isEarned).length ?? 0
  const stageTotalCount = selectedGroup?.medalIds.length ?? 0

  return (
    <GameModal
      open={open}
      onClose={onClose}
      title={t('medals.galleryTitle')}
      zIndexClass="z-[210]"
    >
      <p className="mb-3 text-center text-sm text-purple-200">
        {t('medals.gallerySubtitle', { earned: earnedCount, total: medalIds.length })}
      </p>

      <div className="mb-4 flex items-center gap-1">
        <button
          type="button"
          onClick={() => goToAdjacentTab(-1)}
          aria-label={t('medals.prevStageTab')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <div
          ref={tabsScrollRef}
          className="scroll-x-touch min-w-0 flex-1 overflow-x-auto"
        >
          <div
            role="tablist"
            aria-label={t('medals.galleryTabsLabel')}
            className="flex w-max flex-nowrap gap-2 px-1"
          >
            {stagesWithMedals.map(({ stage, medalIds: stageMedalIds }) => {
              const stageEarned = stageMedalIds.filter(isEarned).length
              const isSelected = stage.id === selectedGroup?.stage.id

              return (
                <button
                  key={stage.id}
                  ref={(element) => {
                    if (element) tabButtonRefs.current.set(stage.id, element)
                    else tabButtonRefs.current.delete(stage.id)
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => selectStage(stage.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                    isSelected
                      ? 'bg-amber-400 text-violet-950 shadow-sm'
                      : 'bg-white/10 text-purple-200 hover:bg-white/15'
                  }`}
                >
                  {getStageName(t, stage.id)}
                  <span
                    className={`ml-1.5 ${isSelected ? 'text-violet-900/70' : 'text-purple-300/70'}`}
                  >
                    {stageEarned}/{stageMedalIds.length}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => goToAdjacentTab(1)}
          aria-label={t('medals.nextStageTab')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {selectedGroup && (
        <>
          <p className="mb-4 text-center text-xs text-purple-300/80">
            {t('medals.galleryStageSubtitle', {
              earned: stageEarnedCount,
              total: stageTotalCount,
            })}
          </p>
          <div
            role="tabpanel"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3"
          >
            {selectedGroup.medalIds.map((levelId) => {
              const earned = isEarned(levelId)
              const name = getChallengeLabel(t, levelId) ?? t('medals.unknown')

              return (
                <div
                  key={levelId}
                  className={`flex flex-col items-center rounded-xl p-3 text-center ${
                    earned ? 'bg-white/10' : 'bg-white/5'
                  }`}
                >
                  <MedalBadge levelId={levelId} earned={earned} size="md" />
                  <p
                    className={`mt-2 text-xs font-bold leading-tight ${
                      earned ? 'text-amber-100' : 'text-white/40'
                    }`}
                  >
                    {earned ? name : t('medals.locked')}
                  </p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </GameModal>
  )
}
