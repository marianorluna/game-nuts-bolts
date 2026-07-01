import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isCloudSyncEnabled } from '../config'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!isCloudSyncEnabled()) {
    throw new Error(
      'Supabase no configurado: define VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY y VITE_FEATURE_CLOUD_SYNC=true',
    )
  }

  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      },
    )
  }

  return client
}
