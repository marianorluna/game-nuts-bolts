import { useAuth } from '../hooks/useAuth'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { usePush } from '../hooks/usePush'
import { isLeaderboardEnabled } from '../infrastructure'
import { useTranslation } from '../i18n/useTranslation'
import { SettingsCollapsible } from './SettingsCollapsible'

interface NotificationSettingsSectionProps {
  onOpenAuth: () => void
  open: boolean
  onToggle: () => void
}

function ToggleRow({
  title,
  subtitle,
  on,
  disabled,
  onToggle,
}: {
  title: string
  subtitle: string
  on: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className="mb-2 flex w-full items-center justify-between rounded-lg bg-white/10 px-3 py-3 transition active:scale-[0.98] disabled:opacity-50 last:mb-0"
    >
      <div className="text-left">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-purple-200">{subtitle}</p>
      </div>
      <div
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          on ? 'bg-amber-400' : 'bg-white/20'
        }`}
      >
        <div
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            on ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  )
}

export function NotificationSettingsSection({
  onOpenAuth,
  open,
  onToggle,
}: NotificationSettingsSectionProps) {
  const { t } = useTranslation()
  const { cloudSyncEnabled, user } = useAuth()
  const { enabled: pushFeature, nativeSupported, prefs, busy, error, setPushEnabled, setRankOvertaken } =
    usePush()
  const leaderboardEnabled = isLeaderboardEnabled()
  const { profile } = useLeaderboard()
  const showInLeaderboard = profile?.showInLeaderboard ?? false

  if (!cloudSyncEnabled || !pushFeature) return null

  if (!user) {
    return (
      <button
        type="button"
        onClick={onOpenAuth}
        className="mt-3 flex w-full items-center gap-3 rounded-xl bg-white/10 px-4 py-4 transition active:scale-[0.98] hover:bg-white/15"
      >
        <span className="text-2xl" aria-hidden>
          🔔
        </span>
        <div className="text-left">
          <p className="font-semibold text-white">{t('push.title')}</p>
          <p className="text-sm text-purple-200">{t('push.needAccount')}</p>
        </div>
      </button>
    )
  }

  const pushOn = prefs?.pushEnabled ?? false
  const rankOn = prefs?.rankOvertaken ?? false
  const rankDisabled = busy || !pushOn || !leaderboardEnabled || !showInLeaderboard

  let rankSubtitle = t('push.rankOff')
  if (!showInLeaderboard) rankSubtitle = t('push.rankNeedsLeaderboard')
  else if (!pushOn) rankSubtitle = t('push.rankNeedsMaster')
  else if (rankOn) rankSubtitle = t('push.rankOn')

  let errorText: string | null = null
  if (error === 'push_permission_denied') errorText = t('push.permissionDenied')
  else if (error === 'push_web_unsupported') errorText = t('push.webUnsupported')
  else if (error) errorText = error

  const collapsedSubtitle = pushOn ? t('push.masterOn') : t('push.masterOff')

  return (
    <SettingsCollapsible
      title={t('push.title')}
      subtitle={collapsedSubtitle}
      icon={<span aria-hidden>🔔</span>}
      open={open}
      onToggle={onToggle}
    >
      <p className="mb-3 text-xs text-purple-200">{t('push.subtitle')}</p>

      {!nativeSupported && (
        <p className="mb-3 text-xs text-amber-200">{t('push.webUnsupported')}</p>
      )}

      <ToggleRow
        title={t('push.master')}
        subtitle={pushOn ? t('push.masterOn') : t('push.masterOff')}
        on={pushOn}
        disabled={busy || !nativeSupported}
        onToggle={() => void setPushEnabled(!pushOn)}
      />

      <ToggleRow
        title={t('push.rank')}
        subtitle={rankSubtitle}
        on={rankOn && pushOn && showInLeaderboard}
        disabled={rankDisabled}
        onToggle={() => void setRankOvertaken(!rankOn)}
      />

      {errorText && (
        <p className="mt-1 text-xs text-rose-300" role="alert">
          {errorText}
        </p>
      )}
    </SettingsCollapsible>
  )
}
