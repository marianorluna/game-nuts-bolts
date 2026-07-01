import { useTranslation } from '../i18n/useTranslation'
import { GameModal } from './GameModal'

interface LinkProgressModalProps {
  open: boolean
  unlockedLevel: number
  onLink: () => void
  onDismiss: () => void
}

export function LinkProgressModal({
  open,
  unlockedLevel,
  onLink,
  onDismiss,
}: LinkProgressModalProps) {
  const { t } = useTranslation()

  return (
    <GameModal
      open={open}
      onClose={onDismiss}
      title={t('account.linkTitle')}
      zIndexClass="z-[210]"
    >
      <div className="mb-5 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-3xl">
          ☁️
        </div>
      </div>

      <p className="mb-2 text-center text-sm leading-relaxed text-purple-100">
        {t('account.linkMessage', { level: unlockedLevel })}
      </p>
      <p className="mb-6 text-center text-xs text-purple-300">
        {t('account.linkHint')}
      </p>

      <button
        type="button"
        onClick={onLink}
        className="mb-3 w-full rounded-xl bg-amber-400 px-4 py-3.5 font-semibold text-stone-900 transition active:scale-[0.98]"
      >
        {t('account.linkCta')}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-purple-200 transition hover:bg-white/15 active:scale-[0.98]"
      >
        {t('account.linkLater')}
      </button>
    </GameModal>
  )
}
