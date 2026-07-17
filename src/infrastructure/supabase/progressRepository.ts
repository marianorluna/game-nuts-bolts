import type { LevelProgress, PlayerProgress } from '../../domain/types'
import {
  buildMovesTiebreakKey,
  deriveRankingStats,
} from '../../domain/progress'
import {
  nextDailyStreak,
  utcDateString,
} from '../../domain/push/streakAndMilestones'
import { GAME_ID, SUPABASE_TABLES } from '../../config/game'
import type {
  ProgressRepository,
  RemotePlayerProgress,
  UpsertProgressOptions,
} from '../contracts/ProgressRepository'
import { getSupabaseClient } from './client'

interface ProgressRow {
  unlocked_level: number
  levels: Record<string, LevelProgress>
  completed_levels: number
  total_stars: number
  weighted_tier_points: number
  moves_tiebreak_key: string
  total_best_moves: number
  rank_snapshot_at: string | null
  updated_at: string
}

function normalizeLevels(
  raw: Record<string, LevelProgress>,
): Record<number, LevelProgress> {
  const levels: Record<number, LevelProgress> = {}
  for (const [key, value] of Object.entries(raw)) {
    const id = Number(key)
    if (!Number.isNaN(id)) levels[id] = value
  }
  return levels
}

function mapRow(row: ProgressRow): RemotePlayerProgress {
  return {
    progress: {
      unlockedLevel: row.unlocked_level,
      levels: normalizeLevels(row.levels),
    },
    rankSnapshotAt: row.rank_snapshot_at,
    updatedAt: row.updated_at,
  }
}

function buildProgressRow(
  progress: PlayerProgress,
  options: UpsertProgressOptions | undefined,
  streak: { currentStreak: number; lastStreakDate: string },
): Record<string, unknown> {
  const stats = deriveRankingStats(progress)
  const row: Record<string, unknown> = {
    unlocked_level: progress.unlockedLevel,
    levels: progress.levels,
    completed_levels: stats.completedLevels,
    total_stars: stats.totalStars,
    weighted_tier_points: stats.weightedTierPoints,
    moves_tiebreak_key: buildMovesTiebreakKey(progress),
    total_best_moves: stats.totalBestMoves,
    last_played_at: new Date().toISOString(),
    current_streak: streak.currentStreak,
    last_streak_date: streak.lastStreakDate,
  }
  if (options && 'rankSnapshotAt' in options) {
    row.rank_snapshot_at = options.rankSnapshotAt ?? null
  }
  return row
}

export function createSupabaseProgressRepository(): ProgressRepository {
  const supabase = getSupabaseClient()

  return {
    async fetch(userId) {
      const { data, error } = await supabase
        .from(SUPABASE_TABLES.progress)
        .select(
          'unlocked_level, levels, completed_levels, total_stars, weighted_tier_points, moves_tiebreak_key, total_best_moves, rank_snapshot_at, updated_at',
        )
        .eq('user_id', userId)
        .eq('game_id', GAME_ID)
        .maybeSingle()

      if (error) throw error
      if (!data) return null
      return mapRow(data as ProgressRow)
    },

    async upsert(userId, progress, options) {
      const { data: existing, error: fetchError } = await supabase
        .from(SUPABASE_TABLES.progress)
        .select('current_streak, last_streak_date')
        .eq('user_id', userId)
        .eq('game_id', GAME_ID)
        .maybeSingle()

      if (fetchError) throw fetchError

      const streak = nextDailyStreak(
        Number(existing?.current_streak) || 0,
        (existing?.last_streak_date as string | null) ?? null,
        utcDateString(),
      )

      const row = buildProgressRow(progress, options, streak)
      const { error } = await supabase.from(SUPABASE_TABLES.progress).upsert(
        {
          user_id: userId,
          game_id: GAME_ID,
          ...row,
        },
        { onConflict: 'user_id,game_id' },
      )

      if (error) throw error
    },
  }
}
