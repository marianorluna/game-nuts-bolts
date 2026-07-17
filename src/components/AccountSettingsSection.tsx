import { useAuth } from '../hooks/useAuth'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { isLeaderboardEnabled } from '../infrastructure'
import { useTranslation } from '../i18n/useTranslation'
import { SettingsCollapsible } from './SettingsCollapsible'
import { UserAvatar } from './UserAvatar'

interface AccountSettingsSectionProps {
  onOpenAuth: () => void
  open: boolean
  onToggle: () => void
}

export function AccountSettingsSection({
  onOpenAuth,
  open,
  onToggle,
}: AccountSettingsSectionProps) {
  const { t } = useTranslation()
  const { cloudSyncEnabled, user, busy, signOut } = useAuth()
  const leaderboardEnabled = isLeaderboardEnabled()
  const { profile, setShowInLeaderboard } = useLeaderboard()

  if (!cloudSyncEnabled) return null

  if (user) {
    const label = user.displayName ?? user.email ?? t('account.signedIn')
    const optedIn = profile?.showInLeaderboard ?? false

    return (
      <SettingsCollapsible
        title={label}
        subtitle={t('account.syncActive')}
        icon={
          <span className="flex h-8 w-8 overflow-hidden rounded-full bg-amber-400/25 text-base">
            <UserAvatar user={user} className="text-base" />
          </span>
        }
        open={open}
        onToggle={onToggle}
      >
        {leaderboardEnabled && (
          <button
            type="button"
            onClick={() => void setShowInLeaderboard(!optedIn)}
            className="mb-3 flex w-full items-center justify-between rounded-lg bg-white/10 px-3 py-3 transition active:scale-[0.98]"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{t('leaderboard.optIn')}</p>
              <p className="text-xs text-purple-200">
                {optedIn ? t('leaderboard.optInOn') : t('leaderboard.optInOff')}
              </p>
            </div>
            <div
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                optedIn ? 'bg-amber-400' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  optedIn ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => void signOut()}
          className="w-full rounded-lg bg-white/10 py-2.5 text-sm font-semibold text-purple-100 transition hover:bg-white/15 active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? t('account.signingOut') : t('account.signOut')}
        </button>
      </SettingsCollapsible>
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
