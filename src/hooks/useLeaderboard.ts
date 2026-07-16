import { useCallback, useEffect, useState } from 'react'
import {
  getCachedLeaderboard,
  getLeaderboardProfile,
  isLeaderboardLoading,
  refreshLeaderboard,
  setShowInLeaderboard as setShowInLeaderboardService,
  subscribeLeaderboard,
  type CachedLeaderboard,
} from '../application/leaderboardService'
import { isLeaderboardEnabled } from '../infrastructure'
import type { PlayerProfileSettings } from '../infrastructure/contracts/LeaderboardRepository'

export interface UseLeaderboardResult {
  enabled: boolean
  loading: boolean
  offline: boolean
  cache: CachedLeaderboard | null
  profile: PlayerProfileSettings | null
  refresh: () => Promise<void>
  setShowInLeaderboard: (show: boolean) => Promise<void>
}

export function useLeaderboard(): UseLeaderboardResult {
  const enabled = isLeaderboardEnabled()
  const [offline, setOffline] = useState(!navigator.onLine)
  const [cache, setCache] = useState<CachedLeaderboard | null>(() =>
    enabled ? getCachedLeaderboard() : null,
  )
  const [profile, setProfile] = useState<PlayerProfileSettings | null>(() =>
    enabled ? getLeaderboardProfile() : null,
  )
  const [loading, setLoading] = useState(() => isLeaderboardLoading())

  const syncLocal = useCallback(() => {
    setCache(getCachedLeaderboard())
    setProfile(getLeaderboardProfile())
    setLoading(isLeaderboardLoading())
  }, [])

  const refresh = useCallback(async () => {
    if (!enabled) return
    await refreshLeaderboard()
    syncLocal()
  }, [enabled, syncLocal])

  const setShowInLeaderboard = useCallback(
    async (show: boolean) => {
      await setShowInLeaderboardService(show)
      syncLocal()
    },
    [syncLocal],
  )

  useEffect(() => {
    if (!enabled) return

    const unsub = subscribeLeaderboard(syncLocal)
    void refreshLeaderboard().then(syncLocal)

    const onOnline = () => {
      setOffline(false)
      void refreshLeaderboard().then(syncLocal)
    }
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      unsub()
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [enabled, syncLocal])

  return {
    enabled,
    loading,
    offline,
    cache,
    profile,
    refresh,
    setShowInLeaderboard,
  }
}
