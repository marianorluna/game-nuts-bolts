import { useAuth } from '../hooks/useAuth'
import { useTranslation } from '../i18n/useTranslation'

interface AccountSettingsSectionProps {
  onOpenAuth: () => void
}

export function AccountSettingsSection({ onOpenAuth }: AccountSettingsSectionProps) {
  const { t } = useTranslation()
  const { cloudSyncEnabled, user, busy, signOut } = useAuth()

  if (!cloudSyncEnabled) return null

  if (user) {
    const label = user.displayName ?? user.email ?? t('account.signedIn')

    return (
      <div className="mt-3 rounded-xl bg-white/10 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/25 text-xl">
            👤
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate font-semibold text-white">{label}</p>
            <p className="text-sm text-emerald-300">{t('account.syncActive')}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void signOut()}
          className="w-full rounded-lg bg-white/10 py-2.5 text-sm font-semibold text-purple-100 transition hover:bg-white/15 active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? t('account.signingOut') : t('account.signOut')}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpenAuth}
      className="mt-3 flex w-full items-center gap-3 rounded-xl bg-white/10 px-4 py-4 transition active:scale-[0.98] hover:bg-white/15"
    >
      <span className="text-2xl">👤</span>
      <div className="text-left">
        <p className="font-semibold text-white">{t('account.title')}</p>
        <p className="text-sm text-purple-200">{t('account.settingsSubtitle')}</p>
      </div>
    </button>
  )
}
