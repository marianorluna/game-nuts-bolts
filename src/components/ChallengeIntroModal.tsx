import { GameModal } from './GameModal'
import { useTranslation } from '../i18n/useTranslation'
import { useGameStore } from '../store/gameStore'

interface ChallengeIntroModalProps {
  open: boolean
  levelId: number
  onClose: () => void
  /** Si es true, el CTA dice «Acepto el reto» y marca la intro como vista al cerrar. */
  isFirstTime?: boolean
}

export function ChallengeIntroModal({
  open,
  levelId,
  onClose,
  isFirstTime = false,
}: ChallengeIntroModalProps) {
  const { t } = useTranslation()
  const markChallengeIntroSeen = useGameStore((s) => s.markChallengeIntroSeen)

  const handleClose = () => {
    if (isFirstTime) {
      markChallengeIntroSeen(levelId)
    }
    onClose()
  }

  const rules = [
    t('challenge.introRule1'),
    t('challenge.introRule2'),
    t('challenge.introRule3'),
    t('challenge.introRule4'),
  ]

  return (
    <GameModal open={open} onClose={handleClose} title={t('challenge.introTitle')}>
      <p className="mb-4 text-center text-sm text-amber-200">{t('challenge.introLead')}</p>
      <ul className="mb-6 space-y-2 text-left text-sm text-purple-100">
        {rules.map((rule) => (
          <li key={rule} className="flex gap-2">
            <span className="text-amber-400" aria-hidden="true">
              •
            </span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleClose}
        className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-bold text-white shadow-lg transition active:scale-95"
      >
        {isFirstTime ? t('challenge.introCta') : t('common.gotIt')}
      </button>
    </GameModal>
  )
}
