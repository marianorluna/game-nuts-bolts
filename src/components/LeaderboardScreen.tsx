import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useAuth } from '../hooks/useAuth'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useTranslation } from '../i18n/useTranslation'
import { BackArrowIcon } from './icons/GameIcons'
import { GameModal } from './GameModal'
import type { LeaderboardEvent } from '../infrastructure/contracts/LeaderboardRepository'

function displayName(
  name: string | null | undefined,
  fallback: string,
): string {
  const trimmed = name?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

function formatEventLabel(
  event: LeaderboardEvent,
  t: (key: string, params?: Record<string, string | number>) => string,
  anonymous: string,
): string {
  const who = displayName(event.displayName, anonymous)
  switch (event.eventType) {
    case 'rank_up': {
      const newRank = Number(event.payload.newRank ?? 0)
      return t('leaderboard.eventRankUp', { name: who, rank: newRank })
    }
    case 'level_completed': {
      const levels = Number(event.payload.completedLevels ?? 0)
      return t('leaderboard.eventLevel', { name: who, levels })
    }
    case 'opt_in':
      return t('leaderboard.eventOptIn', { name: who })
    default:
      return who
  }
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return 'bg-[#d4a017] text-stone-900'
  if (rank === 2) return 'bg-[#c0c0c0] text-stone-900'
  if (rank === 3) return 'bg-[#cd7f32] text-stone-900'
  return 'bg-white/20 text-white'
}

const CRITERIA_KEYS = [
  'leaderboard.criteria1',
  'leaderboard.criteria2',
  'leaderboard.criteria3',
  'leaderboard.criteria4',
  'leaderboard.criteria5',
  'leaderboard.criteria6',
] as const

export function LeaderboardScreen() {
  const { t } = useTranslation()
  const goHome = useGameStore((s) => s.goHome)
  const { user, cloudSyncEnabled } = useAuth()
  const {
    loading,
    offline,
    cache,
    profile,
    setShowInLeaderboard,
  } = useLeaderboard()

  const [criteriaOpen, setCriteriaOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const lastSeenEventId = useRef<string | null>(null)

  const entries = cache?.snapshot.entries ?? []
  const events = cache?.events ?? []
  const ownRank = cache?.snapshot.ownRank ?? null
  const anonymous = t('leaderboard.anonymous')

  const ownRow = useMemo(
    () => entries.find((entry) => entry.userId === user?.id) ?? null,
    [entries, user?.id],
  )

  const showToggle = cloudSyncEnabled && Boolean(user)
  const optedIn = profile?.showInLeaderboard ?? false

  useEffect(() => {
    const latest = events[0]
    if (!latest) return

    if (lastSeenEventId.current === null) {
      lastSeenEventId.current = latest.id
      return
    }

    if (latest.id === lastSeenEventId.current) return

    lastSeenEventId.current = latest.id
    setToast(formatEventLabel(latest, t, anonymous))
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [events, t, anonymous])

  return (
    <div className="home-ambient-bg flex h-dvh max-h-dvh flex-col overflow-hidden px-4 pt-safe sm:px-6">
      <div className="home-ambient-glows pointer-events-none absolute inset-0" aria-hidden="true" />

      <header className="relative z-10 shrink-0 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goHome}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95 hover:bg-white/25"
            aria-label={t('leaderboard.back')}
          >
            <BackArrowIcon className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold text-white md:text-2xl">
              {t('leaderboard.title')}
            </h1>
            <p className="text-sm text-purple-200">
              {offline
                ? t('leaderboard.offlineCache')
                : loading
                  ? t('leaderboard.updating')
                  : t('leaderboard.live')}
            </p>
          </div>
          {ownRank !== null && (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${rankBadgeClass(ownRank)}`}
            >
              {t('leaderboard.yourRank', { rank: ownRank })}
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-6">
        {showToggle && (
          <button
            type="button"
            onClick={() => void setShowInLeaderboard(!optedIn)}
            className="flex w-full items-center justify-between rounded-xl bg-white/10 px-4 py-4 transition active:scale-[0.98]"
          >
            <div className="text-left">
              <p className="font-semibold text-white">{t('leaderboard.optIn')}</p>
              <p className="text-sm text-purple-200">
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

        {!user && cloudSyncEnabled && (
          <p className="rounded-xl bg-white/10 px-4 py-3 text-sm text-purple-100">
            {t('leaderboard.signInHint')}
          </p>
        )}

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-purple-200">
            {t('leaderboard.topPlayers')}
          </h2>
          {entries.length === 0 ? (
            <p className="rounded-xl bg-white/10 px-4 py-6 text-center text-sm text-purple-100">
              {t('leaderboard.empty')}
            </p>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry, index) => {
                const rank = index + 1
                const isSelf = entry.userId === user?.id
                return (
                  <li
                    key={entry.userId}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                      isSelf ? 'bg-amber-400/20 ring-1 ring-amber-300/40' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${rankBadgeClass(rank)}`}
                    >
                      {rank}
                    </span>
                    <p className="min-w-0 flex-1 truncate font-semibold text-white">
                      {displayName(entry.displayName, anonymous)}
                      {isSelf ? ` · ${t('leaderboard.you')}` : ''}
                    </p>
                    <span
                      className="shrink-0 text-sm font-semibold tabular-nums text-purple-100"
                      aria-label={t('leaderboard.entryStatsAria', {
                        levels: entry.completedLevels,
                        stars: entry.totalStars,
                      })}
                    >
                      {t('leaderboard.entryStats', {
                        levels: entry.completedLevels,
                        stars: entry.totalStars,
                      })}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {ownRank === null && optedIn && ownRow === null && user && (
          <p className="text-center text-sm text-purple-200">
            {t('leaderboard.notRankedYet')}
          </p>
        )}

        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={() => setCriteriaOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-purple-100 transition active:scale-[0.98] hover:bg-white/15"
          >
            <span aria-hidden="true">ⓘ</span>
            {t('leaderboard.criteriaButton')}
          </button>
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="leaderboard-toast"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="pointer-events-none fixed inset-x-4 bottom-6 z-[180] mx-auto max-w-sm rounded-xl bg-stone-900/95 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
            role="status"
            aria-live="polite"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <GameModal
        open={criteriaOpen}
        onClose={() => setCriteriaOpen(false)}
        title={t('leaderboard.criteriaTitle')}
      >
        <p className="mb-4 text-sm leading-relaxed text-purple-100">
          {t('leaderboard.criteriaIntro')}
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-purple-100">
          {CRITERIA_KEYS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => setCriteriaOpen(false)}
          className="mt-6 w-full rounded-xl bg-white/15 py-3 font-semibold text-white transition active:scale-95"
        >
          {t('common.gotIt')}
        </button>
      </GameModal>
    </div>
  )
}
