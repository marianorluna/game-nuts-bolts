/** Identificador del juego en Supabase (columna game_id). */
export const GAME_ID = import.meta.env.VITE_GAME_ID ?? 'nuts-and-bolts'

/** Prefijo de tablas en el proyecto Supabase multi-juego. */
export const SUPABASE_TABLE_PREFIX = 'nb_' as const

export const SUPABASE_TABLES = {
  profiles: `${SUPABASE_TABLE_PREFIX}player_profiles`,
  progress: `${SUPABASE_TABLE_PREFIX}player_progress`,
  events: `${SUPABASE_TABLE_PREFIX}leaderboard_events`,
  pushTokens: `${SUPABASE_TABLE_PREFIX}push_tokens`,
  notificationPreferences: `${SUPABASE_TABLE_PREFIX}notification_preferences`,
  pushLog: `${SUPABASE_TABLE_PREFIX}push_log`,
  appReleases: `${SUPABASE_TABLE_PREFIX}app_releases`,
} as const
