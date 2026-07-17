import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  corsHeaders,
  getFcmAccessToken,
  parseServiceAccount,
  sendFcmMessage,
} from '../_shared/fcm.ts'

interface SendPushBody {
  userId: string
  gameId: string
  type: string
  title: string
  body: string
  data?: Record<string, string>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verifica JWT del caller (usuario o service role interno)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    const isServiceRole = authHeader.includes(serviceKey)
    if (!isServiceRole && (userError || !userData.user)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    const payload = (await req.json()) as SendPushBody
    if (!payload.userId || !payload.gameId || !payload.type || !payload.title || !payload.body) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    // Solo service role o el propio usuario puede pedir push a sí mismo (tools internos usan service)
    if (!isServiceRole && userData.user?.id !== payload.userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: tokens, error: tokenError } = await admin
      .from('nb_push_tokens')
      .select('fcm_token')
      .eq('user_id', payload.userId)
      .eq('game_id', payload.gameId)

    if (tokenError) throw tokenError
    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_tokens' }), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    const saRaw = Deno.env.get('FCM_SERVICE_ACCOUNT')
    if (!saRaw) throw new Error('FCM_SERVICE_ACCOUNT secret no configurado')
    const sa = parseServiceAccount(saRaw)
    const accessToken = await getFcmAccessToken(sa)

    let sent = 0
    const errors: string[] = []
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

    return new Response(JSON.stringify({ sent, errors }), {
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }
})
