import {
  hasRankingStatsChanged,
  mergePlayerProgress,
  shouldUpdateRankSnapshot,
} from '../domain/progress'
import { challengesEqual } from '../domain/challenges'
import { migratePlayerProgressChallenges } from '../domain/challenges/migratePlayerProgress'
import type { PlayerProgress } from '../domain/types'
import type { Infrastructure } from '../infrastructure'
import { getCurrentAuthUser } from '../infrastructure/authSession'
import type { UpsertProgressOptions } from '../infrastructure/contracts/ProgressRepository'
import { useGameStore } from '../store/gameStore'
import { emitRankUp } from './rankUpHooks'

const SYNC_DEBOUNCE_MS = 800

let infrastructure: Infrastructure | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingBefore: PlayerProgress | null = null
let pendingAfter: PlayerProgress | null = null
let pendingUpsert: { progress: PlayerProgress; options?: UpsertProgressOptions } | null =
  null
let skipNextProgressSync = false
let mergeInFlight: Promise<void> | null = null

export function shouldSyncProgress(
  before: PlayerProgress,
  after: PlayerProgress,
): boolean {
  return hasRankingStatsChanged(before, after)
}

export function buildUpsertOptions(
  before: PlayerProgress,
  after: PlayerProgress,
): UpsertProgressOptions | undefined {
  if (!shouldUpdateRankSnapshot(before, after)) return undefined
  return { rankSnapshotAt: new Date().toISOString() }
}

function progressEquals(a: PlayerProgress, b: PlayerProgress): boolean {
  if (a.unlockedLevel !== b.unlockedLevel) return false

  const levelIds = new Set([
    ...Object.keys(a.levels).map(Number),
    ...Object.keys(b.levels).map(Number),
  ])

  for (const id of levelIds) {
    const left = a.levels[id]
    const right = b.levels[id]
    if (!left && !right) continue
    if (!left || !right) return false
    if (
      left.stars !== right.stars
      || left.bestMoves !== right.bestMoves
      || left.completed !== right.completed
    ) {
      return false
    }
  }

  if (!challengesEqual(a.challenges, b.challenges)) return false

  return true
}

function applyLocalProgress(progress: PlayerProgress): void {
  skipNextProgressSync = true
  useGameStore.getState().replaceProgress(progress)
}

function scheduleVictorySync(before: PlayerProgress, after: PlayerProgress): void {
  if (!infrastructure || !getCurrentAuthUser()) return
  if (!shouldSyncProgress(before, after)) return

  pendingBefore = pendingBefore ?? before
  pendingAfter = after

  if (debounceTimer !== null) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void flushVictorySync()
  }, SYNC_DEBOUNCE_MS)
}

async function upsertToCloud(
  userId: string,
  progress: PlayerProgress,
  options?: UpsertProgressOptions,
  eventContext?: { before: PlayerProgress; after: PlayerProgress },
): Promise<void> {
  if (!infrastructure) return

  let previousRank: number | null = null
  if (eventContext && infrastructure.leaderboard) {
    try {
      const profile = await infrastructure.leaderboard.fetchProfile(userId)
      if (profile?.showInLeaderboard) {
        previousRank = await infrastructure.leaderboard.fetchOwnRank(userId)
      }
    } catch {
      previousRank = null
    }
  }

  try {
    await infrastructure.progress.upsert(userId, progress, options)
    pendingUpsert = null
  } catch {
    pendingUpsert = { progress, options }
    return
  }

  if (!eventContext || !infrastructure.leaderboard) return

  const leaderboard = infrastructure.leaderboard
  let profile
  try {
    profile = await leaderboard.fetchProfile(userId)
  } catch {
    return
  }
  if (!profile?.showInLeaderboard) return

  const { before, after } = eventContext
  const completedBefore = Object.values(before.levels).filter((l) => l.completed).length
  const completedAfter = Object.values(after.levels).filter((l) => l.completed).length

  if (completedAfter > completedBefore) {
    try {
      await leaderboard.insertEvent({
        userId,
        eventType: 'level_completed',
        payload: {
          unlockedLevel: after.unlockedLevel,
          completedLevels: completedAfter,
        },
      })
    } catch {
      // ignore
    }
  }

  let newRank: number | null = null
  try {
    newRank = await leaderboard.fetchOwnRank(userId)
  } catch {
    return
  }

  if (
    previousRank !== null
    && newRank !== null
    && newRank < previousRank
  ) {
    try {
      await leaderboard.insertEvent({
        userId,
        eventType: 'rank_up',
        payload: { previousRank, newRank },
      })
    } catch {
      // ignore
    }

    emitRankUp({
      userId,
      previousRank,
      newRank,
      displayName: profile.displayName,
    })
  }
}

async function flushVictorySync(): Promise<void> {
  const before = pendingBefore
  const after = pendingAfter ?? useGameStore.getState().progress
  pendingBefore = null
  pendingAfter = null

  const user = getCurrentAuthUser()
  if (!before || !user || !infrastructure) return
  if (!shouldSyncProgress(before, after)) return

  await upsertToCloud(user.id, after, buildUpsertOptions(before, after), {
    before,
    after,
  })
}

export async function flushPendingProgressSync(): Promise<void> {
  if (mergeInFlight) await mergeInFlight

  const user = getCurrentAuthUser()
  if (!user || !pendingUpsert) return

  await upsertToCloud(user.id, pendingUpsert.progress, pendingUpsert.options)
}

export async function mergeProgressOnSession(userId: string): Promise<void> {
  if (!infrastructure) return

  if (mergeInFlight) {
    await mergeInFlight
    return
  }

  mergeInFlight = (async () => {
    const local = useGameStore.getState().progress
    const remote = await infrastructure!.progress.fetch(userId)

    if (!remote) {
      if (local.unlockedLevel > 1 || Object.keys(local.levels).length > 0) {
        await upsertToCloud(userId, local)
      }
      return
    }

    const merged = migratePlayerProgressChallenges(
      mergePlayerProgress(local, remote.progress),
    )

    if (!progressEquals(local, merged)) {
      applyLocalProgress(merged)
    }

    if (!progressEquals(merged, remote.progress)) {
      await upsertToCloud(
        userId,
        merged,
        buildUpsertOptions(remote.progress, merged),
      )
    }
  })()

  try {
    await mergeInFlight
  } finally {
    mergeInFlight = null
  }

  await flushPendingProgressSync()
}

function onProgressUpdated(before: PlayerProgress, after: PlayerProgress): void {
  if (skipNextProgressSync) {
    skipNextProgressSync = false
    return
  }
  scheduleVictorySync(before, after)
}

function onUserSessionActive(userId: string): void {
  void mergeProgressOnSession(userId)
}

/**
 * Orquesta sync post-victoria (debounced + retry offline) y merge al iniciar sesión.
 */
export function initProgressSync(infra: Infrastructure): () => void {
  infrastructure = infra

  const unsubStore = useGameStore.subscribe((state, prevState) => {
    if (state.progress === prevState.progress) return
    onProgressUpdated(prevState.progress, state.progress)
  })

  const unsubAuth = infra.auth.onAuthStateChange((user) => {
    if (user) onUserSessionActive(user.id)
  })

  const onOnline = () => {
    void flushPendingProgressSync()
  }
  window.addEventListener('online', onOnline)

  return () => {
    unsubStore()
    unsubAuth()
    window.removeEventListener('online', onOnline)
    if (debounceTimer !== null) clearTimeout(debounceTimer)
    infrastructure = null
    pendingBefore = null
    pendingAfter = null
    pendingUpsert = null
    mergeInFlight = null
  }
}
