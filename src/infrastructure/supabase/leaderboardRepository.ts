import type { LevelProgress, PlayerProgress } from '../../domain/types'
import { GAME_ID, SUPABASE_TABLES } from '../../config/game'
import type {
  InsertLeaderboardEventInput,
  LeaderboardEvent,
  LeaderboardPlayer,
  LeaderboardRepository,
} from '../contracts/LeaderboardRepository'
import { DisplayNameTakenError } from '../contracts/LeaderboardRepository'
import { getSupabaseClient } from './client'

const DEFAULT_TOP = 50
const DEFAULT_EVENTS = 20

interface ProfileEmbed {
  display_name: string | null
  avatar_url: string | null
  show_in_leaderboard: boolean
}

interface ProgressLeaderboardRow {
  user_id: string
  unlocked_level: number
  levels: Record<string, LevelProgress>
  completed_levels: number
  total_stars: number
  weighted_tier_points: number
  moves_tiebreak_key: string
  total_best_moves: number
  rank_snapshot_at: string | null
  nb_player_profiles: ProfileEmbed | ProfileEmbed[] | null
}

interface EventRow {
  id: string
  user_id: string
  event_type: LeaderboardEvent['eventType']
  payload: Record<string, unknown>
  created_at: string
}

function normalizeLevels(
  raw: Record<string, LevelProgress>,
): Record<number, LevelProgress> {
  const levels: Record<number, LevelProgress> = {}
  for (const [key, value] of Object.entries(raw ?? {})) {
    const id = Number(key)
    if (!Number.isNaN(id)) levels[id] = value
  }
  return levels
}

function unwrapProfile(
  embed: ProfileEmbed | ProfileEmbed[] | null,
): ProfileEmbed | null {
  if (!embed) return null
  return Array.isArray(embed) ? (embed[0] ?? null) : embed
}

function mapProgressRow(row: ProgressLeaderboardRow): LeaderboardPlayer {
  const progress: PlayerProgress = {
    unlockedLevel: row.unlocked_level,
    levels: normalizeLevels(row.levels),
  }
  const profile = unwrapProfile(row.nb_player_profiles)
  return {
    userId: row.user_id,
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    completedLevels: row.completed_levels,
    totalStars: row.total_stars,
    weightedTierPoints: row.weighted_tier_points,
    cumulativePointsThrough3:
      row.completed_levels + row.total_stars + row.weighted_tier_points,
    totalBestMoves: row.total_best_moves,
    rankSnapshotAt: row.rank_snapshot_at,
    progress,
  }
}

const LEADERBOARD_SELECT = `
  user_id,
  unlocked_level,
  levels,
  completed_levels,
  total_stars,
  weighted_tier_points,
  moves_tiebreak_key,
  total_best_moves,
  rank_snapshot_at,
  nb_player_profiles!inner (
    display_name,
    avatar_url,
    show_in_leaderboard
  )
`

export function createSupabaseLeaderboardRepository(): LeaderboardRepository {
  const supabase = getSupabaseClient()

  return {
    async fetchProfile(userId) {
      const { data, error } = await supabase
        .from(SUPABASE_TABLES.profiles)
        .select('display_name, avatar_url, show_in_leaderboard')
        .eq('user_id', userId)
        .eq('game_id', GAME_ID)
        .maybeSingle()

      if (error) throw error
      if (!data) return null

      return {
        displayName: data.display_name as string | null,
        avatarUrl: data.avatar_url as string | null,
        showInLeaderboard: Boolean(data.show_in_leaderboard),
      }
    },

    async setShowInLeaderboard(userId, show) {
      const { error } = await supabase.from(SUPABASE_TABLES.profiles).upsert(
        {
          user_id: userId,
          game_id: GAME_ID,
          show_in_leaderboard: show,
        },
        { onConflict: 'user_id,game_id' },
      )
      if (error) throw error
    },

    async updateDisplayName(userId, displayName) {
      const { error } = await supabase.from(SUPABASE_TABLES.profiles).upsert(
        {
          user_id: userId,
          game_id: GAME_ID,
          display_name: displayName,
        },
        { onConflict: 'user_id,game_id' },
      )
      if (error) {
        if (error.code === '23505') throw new DisplayNameTakenError()
        throw error
      }
    },

    async fetchLeaderboard(limit = DEFAULT_TOP) {
      const { data, error } = await supabase
        .from(SUPABASE_TABLES.progress)
        .select(LEADERBOARD_SELECT)
        .eq('game_id', GAME_ID)
        .eq('nb_player_profiles.show_in_leaderboard', true)
        .order('completed_levels', { ascending: false })
        .order('total_stars', { ascending: false })
        .order('weighted_tier_points', { ascending: false })
        .order('moves_tiebreak_key', { ascending: true })
        .order('total_best_moves', { ascending: true })
        .order('rank_snapshot_at', { ascending: true, nullsFirst: false })
        .limit(limit)

      if (error) throw error
      return ((data ?? []) as unknown as ProgressLeaderboardRow[]).map(
        mapProgressRow,
      )
    },

    async fetchOwnRank(userId) {
      const entries = await this.fetchLeaderboard(500)
      const index = entries.findIndex((entry) => entry.userId === userId)
      return index >= 0 ? index + 1 : null
    },

    async fetchRecentEvents(limit = DEFAULT_EVENTS) {
      const { data, error } = await supabase
        .from(SUPABASE_TABLES.events)
        .select('id, user_id, event_type, payload, created_at')
        .eq('game_id', GAME_ID)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      const rows = (data ?? []) as EventRow[]
      if (rows.length === 0) return []

      const userIds = [...new Set(rows.map((row) => row.user_id))]
      const { data: profiles, error: profileError } = await supabase
        .from(SUPABASE_TABLES.profiles)
        .select('user_id, display_name')
        .eq('game_id', GAME_ID)
        .in('user_id', userIds)

      if (profileError) throw profileError

      const nameByUser = new Map<string, string | null>()
      for (const profile of profiles ?? []) {
        nameByUser.set(
          profile.user_id as string,
          (profile.display_name as string | null) ?? null,
        )
      }

      return rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        displayName: nameByUser.get(row.user_id) ?? null,
        eventType: row.event_type,
        payload: row.payload ?? {},
        createdAt: row.created_at,
      }))
    },

    async insertEvent(input: InsertLeaderboardEventInput) {
      const { error } = await supabase.from(SUPABASE_TABLES.events).insert({
        user_id: input.userId,
        game_id: GAME_ID,
        event_type: input.eventType,
        payload: input.payload ?? {},
      })
      if (error) throw error
    },

    subscribe(onChange) {
      const channel = supabase
        .channel(`nb-leaderboard-${GAME_ID}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: SUPABASE_TABLES.progress,
            filter: `game_id=eq.${GAME_ID}`,
          },
          () => onChange(),
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: SUPABASE_TABLES.events,
            filter: `game_id=eq.${GAME_ID}`,
          },
          () => onChange(),
        )
        .subscribe()

      return () => {
        void supabase.removeChannel(channel)
      }
    },
  }
}
