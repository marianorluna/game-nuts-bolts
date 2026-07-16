import type {
  LeaderboardEvent,
  LeaderboardSnapshot,
  PlayerProfileSettings,
} from '../infrastructure/contracts/LeaderboardRepository'
import { getRegisteredInfrastructure } from '../infrastructure'
import { isLeaderboardEnabled } from '../infrastructure/config'
import { getCurrentAuthUser } from '../infrastructure/authSession'

const CACHE_KEY = 'nuts-bolts-leaderboard-cache'
const TOP_LIMIT = 50
const EVENTS_LIMIT = 20

export interface CachedLeaderboard {
  snapshot: LeaderboardSnapshot
  events: LeaderboardEvent[]
}

type Listener = () => void

let cache: CachedLeaderboard | null = readCache()
let profile: PlayerProfileSettings | null = null
let loading = false
let realtimeUnsub: (() => void) | null = null
let onlineBound = false
const listeners = new Set<Listener>()

function readCache(): CachedLeaderboard | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CachedLeaderboard
  } catch {
    return null
  }
}

function writeCache(next: CachedLeaderboard): void {
  cache = next
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

function notify(): void {
  for (const listener of listeners) listener()
}

export function getCachedLeaderboard(): CachedLeaderboard | null {
  return cache ?? readCache()
}

export function getLeaderboardProfile(): PlayerProfileSettings | null {
  return profile
}

export function isLeaderboardLoading(): boolean {
  return loading
}

export function subscribeLeaderboard(listener: Listener): () => void {
  listeners.add(listener)
  ensureRealtime()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      realtimeUnsub?.()
      realtimeUnsub = null
    }
  }
}

function ensureRealtime(): void {
  if (!isLeaderboardEnabled() || realtimeUnsub) return
  const infra = getRegisteredInfrastructure()
  if (!infra?.leaderboard) return

  realtimeUnsub = infra.leaderboard.subscribe(() => {
    void refreshLeaderboard()
  })

  if (!onlineBound) {
    onlineBound = true
    window.addEventListener('online', () => {
      void refreshLeaderboard()
    })
  }
}

export async function refreshLeaderboard(): Promise<CachedLeaderboard | null> {
  if (!isLeaderboardEnabled()) return getCachedLeaderboard()

  const infra = getRegisteredInfrastructure()
  if (!infra?.leaderboard) return getCachedLeaderboard()

  loading = true
  notify()

  const user = getCurrentAuthUser()

  try {
    const [entries, events, ownRank, nextProfile] = await Promise.all([
      infra.leaderboard.fetchLeaderboard(TOP_LIMIT),
      infra.leaderboard.fetchRecentEvents(EVENTS_LIMIT),
      user ? infra.leaderboard.fetchOwnRank(user.id) : Promise.resolve(null),
      user ? infra.leaderboard.fetchProfile(user.id) : Promise.resolve(null),
    ])

    profile = nextProfile
    writeCache({
      snapshot: {
        entries,
        fetchedAt: new Date().toISOString(),
        ownRank,
        ownUserId: user?.id ?? null,
      },
      events,
    })
  } catch {
    cache = readCache()
  } finally {
    loading = false
    notify()
  }

  return cache
}

export async function setShowInLeaderboard(show: boolean): Promise<void> {
  const infra = getRegisteredInfrastructure()
  const user = getCurrentAuthUser()
  if (!infra?.leaderboard || !user) return

  await infra.leaderboard.setShowInLeaderboard(user.id, show)
  if (show) {
    try {
      await infra.leaderboard.insertEvent({
        userId: user.id,
        eventType: 'opt_in',
      })
    } catch {
      // ignore
    }
  }

  profile = profile
    ? { ...profile, showInLeaderboard: show }
    : {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        showInLeaderboard: show,
      }
  notify()
  await refreshLeaderboard()
}
