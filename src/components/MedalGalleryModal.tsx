import { GameModal } from './GameModal'
import { useTranslation } from '../i18n/useTranslation'
import { useGameStore } from '../store/gameStore'
import { getChallengeLabel, getStageName } from '../i18n/campaignLabels'
import { getStageForLevel } from '../domain/content/campaignStructure'
import { getMedalLevelIds } from '../domain/challenges/medalVisuals'
import { DEV_PREVIEW_ALL_MEDALS } from '../config/dev'
import { MedalBadge } from './MedalBadge'

interface MedalGalleryModalProps {
  open: boolean
  onClose: () => void
}

export function MedalGalleryModal({ open, onClose }: MedalGalleryModalProps) {
  const { t } = useTranslation()
  const getChallengeProgress = useGameStore((s) => s.getChallengeProgress)
  const medalIds = getMedalLevelIds()
  const earnedCount = medalIds.filter((id) => {
    if (DEV_PREVIEW_ALL_MEDALS) return true
    return getChallengeProgress(id)?.outcome === 'mastered'
  }).length

  return (
    <GameModal
      open={open}
      onClose={onClose}
      title={t('medals.galleryTitle')}
      zIndexClass="z-[210]"
    >
      <p className="mb-4 text-center text-sm text-purple-200">
        {t('medals.gallerySubtitle', { earned: earnedCount, total: medalIds.length })}
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {medalIds.map((levelId) => {
          const progress = getChallengeProgress(levelId)
          const earned =
            DEV_PREVIEW_ALL_MEDALS || progress?.outcome === 'mastered'
          const name = getChallengeLabel(t, levelId) ?? t('medals.unknown')
          const stage = getStageForLevel(levelId)
          const stageName = stage ? getStageName(t, stage.id) : ''

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
              {earned && stageName && (
                <p className="mt-0.5 text-[10px] text-purple-300/80">{stageName}</p>
              )}
            </div>
          )
        })}
      </div>
    </GameModal>
  )
}
