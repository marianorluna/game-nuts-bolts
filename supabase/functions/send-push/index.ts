import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  corsHeaders,
  getFcmAccessToken,
  parseServiceAccount,
  sendFcmMessage,
} from '../_shared/fcm.ts'
import {
  evaluatePushRateLimit,
  isEngagementType,
  RANK_OVERTAKEN_TYPE,
} from '../_shared/pushRateLimit.ts'

interface SendPushBody {
  userId: string
  gameId: string
  type: string
  title: string
  body: string
  data?: Record<string, string>
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

function channelForType(type: string): string {
  if (type === RANK_OVERTAKEN_TYPE || type === 'weekly_summary') {
    return 'rank_alerts'
  }
  return 'engagement'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const cronSecret = Deno.env.get('CRON_SECRET')
    const cronHeader = req.headers.get('x-cron-secret')
    const isCron = Boolean(cronSecret && cronHeader && cronHeader === cronSecret)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const isServiceRole = authHeader.includes(serviceKey)
    let userIdFromJwt: string | null = null

    if (!isCron && !isServiceRole) {
      if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401)
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: userData, error: userError } = await userClient.auth.getUser()
      if (userError || !userData.user) {
        return jsonResponse({ error: 'Unauthorized' }, 401)
      }
      userIdFromJwt = userData.user.id
    }

    const payload = (await req.json()) as SendPushBody
    if (!payload.userId || !payload.gameId || !payload.type || !payload.title || !payload.body) {
      return jsonResponse({ error: 'Missing fields' }, 400)
    }

    if (
      !isCron
      && !isServiceRole
      && userIdFromJwt !== payload.userId
    ) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    // Rate limit via nb_push_log
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: sameTypeRows, error: sameErr } = await admin
      .from('nb_push_log')
      .select('created_at')
      .eq('user_id', payload.userId)
      .eq('game_id', payload.gameId)
      .eq('type', payload.type)
      .order('created_at', { ascending: false })
      .limit(20)

    if (sameErr) throw sameErr

    let engagementWeekLogs: string[] = []
    if (isEngagementType(payload.type)) {
      const { data: engRows, error: engErr } = await admin
        .from('nb_push_log')
        .select('created_at, type')
        .eq('user_id', payload.userId)
        .eq('game_id', payload.gameId)
        .gte('created_at', weekAgo)
        .neq('type', RANK_OVERTAKEN_TYPE)

      if (engErr) throw engErr
      engagementWeekLogs = (engRows ?? []).map((r) => r.created_at as string)
    }

    const rate = evaluatePushRateLimit({
      type: payload.type,
      sameTypeLogs: (sameTypeRows ?? []).map((r) => r.created_at as string),
      engagementWeekLogs,
    })

    if (!rate.allowed) {
      return jsonResponse({ sent: 0, reason: rate.reason })
    }

    const { data: tokens, error: tokenError } = await admin
      .from('nb_push_tokens')
      .select('fcm_token')
      .eq('user_id', payload.userId)
      .eq('game_id', payload.gameId)

    if (tokenError) throw tokenError
    if (!tokens?.length) {
      return jsonResponse({ sent: 0, reason: 'no_tokens' })
    }

    const saRaw = Deno.env.get('FCM_SERVICE_ACCOUNT')
    if (!saRaw) throw new Error('FCM_SERVICE_ACCOUNT secret no configurado')
    const sa = parseServiceAccount(saRaw)
    const accessToken = await getFcmAccessToken(sa)

    let sent = 0
    const errors: string[] = []
    const channelId = channelForType(payload.type)
    for (const row of tokens) {
      try {
        await sendFcmMessage(sa, accessToken, {
          token: row.fcm_token as string,
          title: payload.title,
          body: payload.body,
          data: {
            type: payload.type,
            ...(payload.data ?? {}),
          },
          channelId,
        })
        sent += 1
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err))
      }
    }

    if (sent > 0) {
      await admin.from('nb_push_log').insert({
        user_id: payload.userId,
        game_id: payload.gameId,
        type: payload.type,
      })
    }

    return jsonResponse({ sent, errors })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ error: message }, 500)
  }
})
