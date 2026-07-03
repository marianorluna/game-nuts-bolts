import { GameModal } from './GameModal'
import { useTranslation } from '../i18n/useTranslation'
import { useGameStore } from '../store/gameStore'
import { formatCountdown, msUntil, useCountdownTick } from '../hooks/useCountdown'

interface ChallengeBlockedModalProps {
  open: boolean
  levelId: number
  onClose: () => void
}

export function ChallengeBlockedModal({
  open,
  levelId,
  onClose,
}: ChallengeBlockedModalProps) {
  const { t } = useTranslation()
  const getNextChallengeAttemptAt = useGameStore((s) => s.getNextChallengeAttemptAt)
  const nextAt = getNextChallengeAttemptAt(levelId)
  const nowMs = useCountdownTick(nextAt)
  const remaining = formatCountdown(msUntil(nextAt, nowMs))

  return (
    <GameModal open={open} onClose={onClose} title={t('challenge.blockedTitle')}>
      <p className="mb-4 text-center text-sm text-purple-100">
        {t('challenge.blockedMessage')}
      </p>
      <p className="mb-6 text-center text-2xl font-black tabular-nums text-amber-300">
        {t('challenge.nextAttemptIn', { time: remaining })}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-bold text-white shadow-lg transition active:scale-95"
      >
        {t('common.gotIt')}
      </button>
    </GameModal>
  )
}
