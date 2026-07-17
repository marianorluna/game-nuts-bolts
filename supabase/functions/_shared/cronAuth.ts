import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { corsHeaders } from '../_shared/fcm.ts'

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

/** Auth for scheduled / manual broadcast jobs: CRON_SECRET header or service role bearer. */
export function assertCronOrServiceRole(req: Request): boolean {
  const cronSecret = Deno.env.get('CRON_SECRET')
  const cronHeader = req.headers.get('x-cron-secret')
  if (cronSecret && cronHeader && cronHeader === cronSecret) return true

  const authHeader = req.headers.get('Authorization') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  return Boolean(serviceKey && authHeader.includes(serviceKey))
}

export function adminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, serviceKey)
}

export async function invokeSendPush(
  payload: {
    userId: string
    gameId: string
    type: string
    title: string
    body: string
    data?: Record<string, string>
  },
): Promise<{ sent: number; reason?: string }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const cronSecret = Deno.env.get('CRON_SECRET')

  const headers: Record<string, string> = {
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }
  if (cronSecret) headers['x-cron-secret'] = cronSecret

  const res = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  const json = (await res.json()) as { sent?: number; reason?: string; error?: string }
  if (!res.ok) {
    throw new Error(json.error ?? `send-push ${res.status}`)
  }
  return { sent: json.sent ?? 0, reason: json.reason }
}
