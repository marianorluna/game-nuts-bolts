export function isCloudSyncEnabled(): boolean {
  return (
    import.meta.env.VITE_FEATURE_CLOUD_SYNC === 'true'
    && Boolean(import.meta.env.VITE_SUPABASE_URL)
    && Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
  )
}

/** Ranking público (Prompt 6). Requiere cloud sync activo. */
export function isLeaderboardEnabled(): boolean {
  return (
    isCloudSyncEnabled()
    && import.meta.env.VITE_FEATURE_LEADERBOARD === 'true'
  )
}

/** Push FCM (Prompt 7). Requiere cloud sync activo. */
export function isPushNotificationsEnabled(): boolean {
  return (
    isCloudSyncEnabled()
    && import.meta.env.VITE_FEATURE_PUSH_NOTIFICATIONS === 'true'
  )
}
