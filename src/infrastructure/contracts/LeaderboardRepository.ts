import type { PlayerProgress } from '../../domain/types'

export interface LeaderboardPlayer {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  completedLevels: number
  totalStars: number
  weightedTierPoints: number
  cumulativePointsThrough3: number
  totalBestMoves: number
  rankSnapshotAt: string | null
  /** Progreso mínimo para desempates locales (criterios 4–6). */
  progress: PlayerProgress
}

export interface LeaderboardSnapshot {
  entries: LeaderboardPlayer[]
  fetchedAt: string
  ownRank: number | null
  ownUserId: string | null
}

export type LeaderboardEventType = 'level_completed' | 'rank_up' | 'opt_in'

export interface LeaderboardEvent {
  id: string
  userId: string
  displayName: string | null
  eventType: LeaderboardEventType
  payload: Record<string, unknown>
  createdAt: string
}

export interface PlayerProfileSettings {
  displayName: string | null
  avatarUrl: string | null
  showInLeaderboard: boolean
}

export interface InsertLeaderboardEventInput {
  userId: string
  eventType: LeaderboardEventType
  payload?: Record<string, unknown>
}

export interface RankUpPayload {
  userId: string
  previousRank: number
  newRank: number
  displayName: string | null
}

export type LeaderboardChangeListener = () => void

export class DisplayNameTakenError extends Error {
  readonly code = 'taken' as const

  constructor(message = 'Display name already taken') {
    super(message)
    this.name = 'DisplayNameTakenError'
  }
}

export interface LeaderboardRepository {
  fetchProfile(userId: string): Promise<PlayerProfileSettings | null>
  setShowInLeaderboard(userId: string, show: boolean): Promise<void>
  /**
   * Upsert `display_name` for the user/game. Throws `DisplayNameTakenError` on unique conflict.
   */
  updateDisplayName(userId: string, displayName: string): Promise<void>
  fetchLeaderboard(limit?: number): Promise<LeaderboardPlayer[]>
  /**
   * Posición 1-based entre jugadores con opt-in.
   * `null` si el usuario no aparece (sin opt-in o sin fila).
   */
  fetchOwnRank(userId: string): Promise<number | null>
  fetchRecentEvents(limit?: number): Promise<LeaderboardEvent[]>
  insertEvent(input: InsertLeaderboardEventInput): Promise<void>
  /** Realtime: progreso o eventos cambian → notifica para refetch. */
  subscribe(onChange: LeaderboardChangeListener): () => void
}
