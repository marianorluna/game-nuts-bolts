export function isCloudSyncEnabled(): boolean {
  return (
    import.meta.env.VITE_FEATURE_CLOUD_SYNC === 'true'
    && Boolean(import.meta.env.VITE_SUPABASE_URL)
    && Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
  )
}
