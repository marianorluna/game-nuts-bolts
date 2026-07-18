import { getSupabaseClient } from './client'
import { isCloudSyncEnabled } from '../config'
import { GAME_ID, SUPABASE_TABLES } from '../../config/game'

export async function fetchAppReleaseVersionByCode(
  versionCode: number | string,
): Promise<string | null> {
  if (!isCloudSyncEnabled()) return null

  const code = Number(versionCode)
  if (!Number.isFinite(code) || code <= 0) return null

  try {
    const { data, error } = await getSupabaseClient()
      .from(SUPABASE_TABLES.appReleases)
      .select('version')
      .eq('game_id', GAME_ID)
      .eq('version_code', code)
      .maybeSingle()

    if (error || !data?.version) return null
    return String(data.version)
  } catch {
    return null
  }
}
