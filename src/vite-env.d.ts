/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UNLOCK_ALL_LEVELS?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_GAME_ID?: string
  readonly VITE_FEATURE_CLOUD_SYNC?: string
  readonly VITE_FEATURE_LEADERBOARD?: string
}
