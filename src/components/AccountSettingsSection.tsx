import { useState } from 'react'
import type { DisplayNameValidationError } from '../domain/displayName'
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

function displayNameErrorKey(
  error: DisplayNameValidationError,
): `account.displayNameError${'TooShort' | 'TooLong' | 'Invalid' | 'Blocked' | 'Taken'}` {
  switch (error) {
    case 'too_short':
      return 'account.displayNameErrorTooShort'
    case 'too_long':
      return 'account.displayNameErrorTooLong'
    case 'invalid_chars':
      return 'account.displayNameErrorInvalid'
    case 'blocked':
      return 'account.displayNameErrorBlocked'
    case 'taken':
      return 'account.displayNameErrorTaken'
  }
}

export function AccountSettingsSection({
  onOpenAuth,
  open,
  onToggle,
}: AccountSettingsSectionProps) {
  const { t } = useTranslation()
  const { cloudSyncEnabled, user, busy, signOut } = useAuth()
  const leaderboardEnabled = isLeaderboardEnabled()
  const { profile, setShowInLeaderboard, updateDisplayName } = useLeaderboard()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [nameError, setNameError] = useState<DisplayNameValidationError | null>(
    null,
  )
  const [nameBusy, setNameBusy] = useState(false)

  if (!cloudSyncEnabled) return null

  if (user) {
    const rankingName = profile?.displayName?.trim() || null
    const label =
      rankingName ?? user.displayName ?? user.email ?? t('account.signedIn')
    const optedIn = profile?.showInLeaderboard ?? false

    const startEdit = () => {
      setNameDraft(rankingName ?? user.displayName ?? '')
      setNameError(null)
      setEditingName(true)
    }

    const cancelEdit = () => {
      setEditingName(false)
      setNameError(null)
      setNameBusy(false)
    }

    const saveName = async () => {
      setNameBusy(true)
      setNameError(null)
      try {
        const result = await updateDisplayName(nameDraft)
        if (!result.ok) {
          setNameError(result.error)
          return
        }
        setEditingName(false)
      } finally {
        setNameBusy(false)
      }
    }

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
          <>
            <div className="mb-3 rounded-lg bg-white/10 px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-white">
                    {t('account.displayNameLabel')}
                  </p>
                  <p className="text-xs text-purple-200">
                    {t('account.displayNameHint')}
                  </p>
                  {!editingName && (
                    <p className="mt-1 truncate text-sm text-amber-200">
                      {rankingName ?? t('leaderboard.anonymous')}
                    </p>
                  )}
                </div>
                {!editingName && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="shrink-0 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-purple-100 transition hover:bg-white/15 active:scale-[0.98]"
                  >
                    {t('account.displayNameChange')}
                  </button>
                )}
              </div>

              {editingName && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={nameDraft}
                    maxLength={20}
                    autoComplete="nickname"
                    placeholder={t('account.displayNamePlaceholder')}
                    onChange={(event) => {
                      setNameDraft(event.target.value)
                      setNameError(null)
                    }}
                    className="w-full rounded-md border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-purple-300/60 focus:border-amber-400/60 focus:outline-none"
                  />
                  {nameError && (
                    <p className="text-xs text-rose-300">
                      {t(displayNameErrorKey(nameError))}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={nameBusy}
                      onClick={() => void saveName()}
                      className="flex-1 rounded-md bg-amber-400 py-2 text-sm font-semibold text-purple-950 transition active:scale-[0.98] disabled:opacity-60"
                    >
                      {t('account.displayNameSave')}
                    </button>
                    <button
                      type="button"
                      disabled={nameBusy}
                      onClick={cancelEdit}
                      className="flex-1 rounded-md bg-white/10 py-2 text-sm font-semibold text-purple-100 transition hover:bg-white/15 active:scale-[0.98] disabled:opacity-60"
                    >
                      {t('account.displayNameCancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => void setShowInLeaderboard(!optedIn)}
              className="mb-3 flex w-full items-center justify-between rounded-lg bg-white/10 px-3 py-3 transition active:scale-[0.98]"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-white">
                  {t('leaderboard.optIn')}
                </p>
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
          </>
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
