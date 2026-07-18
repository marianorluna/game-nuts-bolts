import {
  DISPLAY_NAME_MAX_LENGTH,
  generateProvisionalDisplayName,
  isBlankDisplayName,
  validateDisplayName,
  type DisplayNameValidationError,
  type DisplayNameValidationResult,
} from '../domain/displayName'
import type {
  LeaderboardEvent,
  LeaderboardSnapshot,
  PlayerProfileSettings,
} from '../infrastructure/contracts/LeaderboardRepository'
import { DisplayNameTakenError } from '../infrastructure/contracts/LeaderboardRepository'
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

export type UpdateDisplayNameResult =
  | { ok: true; displayName: string }
  | { ok: false; error: DisplayNameValidationError }

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

function pickEnsureCandidate(
  userId: string,
  authDisplayName: string | null,
): string {
  if (!isBlankDisplayName(authDisplayName)) {
    const trimmed = authDisplayName!.trim().replace(/\s+/g, ' ')
    if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
      return trimmed.slice(0, DISPLAY_NAME_MAX_LENGTH).trim()
    }
    if (trimmed.length >= 1) return trimmed
  }
  return generateProvisionalDisplayName(userId)
}

/**
 * If the profile has no display_name, set auth name or Player_XXXXX.
 */
export async function ensureDisplayName(): Promise<PlayerProfileSettings | null> {
  const infra = getRegisteredInfrastructure()
  const user = getCurrentAuthUser()
  if (!infra?.leaderboard || !user) return profile

  let current = profile ?? (await infra.leaderboard.fetchProfile(user.id))
  if (current && !isBlankDisplayName(current.displayName)) {
    profile = current
    return profile
  }

  let candidate = pickEnsureCandidate(user.id, user.displayName)
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await infra.leaderboard.updateDisplayName(user.id, candidate)
      current = {
        displayName: candidate,
        avatarUrl: current?.avatarUrl ?? user.avatarUrl,
        showInLeaderboard: current?.showInLeaderboard ?? false,
      }
      profile = current
      notify()
      return profile
    } catch (error) {
      if (!(error instanceof DisplayNameTakenError)) throw error
      candidate = `${generateProvisionalDisplayName(user.id).slice(0, 14)}_${attempt + 1}`
    }
  }

  return profile
}

export async function updateDisplayName(
  raw: string,
): Promise<UpdateDisplayNameResult> {
  const infra = getRegisteredInfrastructure()
  const user = getCurrentAuthUser()
  if (!infra?.leaderboard || !user) {
    return { ok: false, error: 'too_short' }
  }

  const validation: DisplayNameValidationResult = validateDisplayName(raw)
  if (!validation.ok) return validation

  try {
    await infra.leaderboard.updateDisplayName(user.id, validation.normalized)
  } catch (error) {
    if (error instanceof DisplayNameTakenError) {
      return { ok: false, error: 'taken' }
    }
    throw error
  }

  profile = profile
    ? { ...profile, displayName: validation.normalized }
    : {
        displayName: validation.normalized,
        avatarUrl: user.avatarUrl,
        showInLeaderboard: false,
      }
  notify()
  return { ok: true, displayName: validation.normalized }
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

    if (user && isBlankDisplayName(profile?.displayName)) {
      await ensureDisplayName()
    }
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

  if (isBlankDisplayName(profile?.displayName)) {
    await ensureDisplayName()
  }

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
