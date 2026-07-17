import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  corsHeaders,
  getFcmAccessToken,
  parseServiceAccount,
  sendFcmMessage,
} from '../_shared/fcm.ts'

const RANK_OVERTAKEN_TYPE = 'rank_overtaken'
const MAX_PER_DAY = 3

interface RankChangeBody {
  climberUserId: string
  gameId: string
  previousRank: number
  newRank: number
  displayName: string | null
}

interface ProgressRow {
  user_id: string
  completed_levels: number
  total_stars: number
  weighted_tier_points: number
  moves_tiebreak_key: string
  total_best_moves: number
  rank_snapshot_at: string | null
}

function compareRank(a: ProgressRow, b: ProgressRow): number {
  if (b.completed_levels !== a.completed_levels) {
    return b.completed_levels - a.completed_levels
  }
  if (b.total_stars !== a.total_stars) return b.total_stars - a.total_stars
  if (b.weighted_tier_points !== a.weighted_tier_points) {
    return b.weighted_tier_points - a.weighted_tier_points
  }
  if (a.moves_tiebreak_key !== b.moves_tiebreak_key) {
    return a.moves_tiebreak_key < b.moves_tiebreak_key ? -1 : 1
  }
  if (a.total_best_moves !== b.total_best_moves) {
    return a.total_best_moves - b.total_best_moves
  }
  const aSnap = a.rank_snapshot_at ?? ''
  const bSnap = b.rank_snapshot_at ?? ''
  if (aSnap !== bSnap) return aSnap < bSnap ? -1 : 1
  return 0
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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    const payload = (await req.json()) as RankChangeBody
    if (
      !payload.climberUserId
      || !payload.gameId
      || typeof payload.previousRank !== 'number'
      || typeof payload.newRank !== 'number'
    ) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    // Solo el climber autenticado puede disparar el aviso de su rank_up
    if (userData.user.id !== payload.climberUserId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    if (payload.newRank >= payload.previousRank) {
      return new Response(JSON.stringify({ notified: 0, reason: 'no_improvement' }), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: progressRows, error: progressError } = await admin
      .from('nb_player_progress')
      .select(`
        user_id,
        completed_levels,
        total_stars,
        weighted_tier_points,
        moves_tiebreak_key,
        total_best_moves,
        rank_snapshot_at,
        nb_player_profiles!inner ( show_in_leaderboard )
      `)
      .eq('game_id', payload.gameId)
      .eq('nb_player_profiles.show_in_leaderboard', true)

    if (progressError) throw progressError

    const ranked = ((progressRows ?? []) as unknown as ProgressRow[]).sort(compareRank)
    const displaced: { userId: string; rank: number }[] = []

    for (let i = 0; i < ranked.length; i++) {
      const rank = i + 1
      const row = ranked[i]!
      if (row.user_id === payload.climberUserId) continue
      // Tras el ascenso, quienes quedan en newRank+1 … previousRank fueron desplazados
      if (rank > payload.newRank && rank <= payload.previousRank) {
        displaced.push({ userId: row.user_id, rank })
      }
    }

    if (displaced.length === 0) {
      return new Response(JSON.stringify({ notified: 0, reason: 'none_displaced' }), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    const displacedIds = displaced.map((d) => d.userId)
    const { data: prefs, error: prefsError } = await admin
      .from('nb_notification_preferences')
      .select('user_id, push_enabled, rank_overtaken')
      .eq('game_id', payload.gameId)
      .in('user_id', displacedIds)
      .eq('push_enabled', true)
      .eq('rank_overtaken', true)

    if (prefsError) throw prefsError
    const eligibleIds = new Set((prefs ?? []).map((p) => p.user_id as string))

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentLogs, error: logError } = await admin
      .from('nb_push_log')
      .select('user_id')
      .eq('game_id', payload.gameId)
      .eq('type', RANK_OVERTAKEN_TYPE)
      .gte('created_at', since)
      .in('user_id', [...eligibleIds])

    if (logError) throw logError
    const countByUser = new Map<string, number>()
    for (const row of recentLogs ?? []) {
      const id = row.user_id as string
      countByUser.set(id, (countByUser.get(id) ?? 0) + 1)
    }

    const targets = displaced.filter((d) => {
      if (!eligibleIds.has(d.userId)) return false
      return (countByUser.get(d.userId) ?? 0) < MAX_PER_DAY
    })

    if (targets.length === 0) {
      return new Response(JSON.stringify({ notified: 0, reason: 'filtered' }), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    const { data: tokens, error: tokenError } = await admin
      .from('nb_push_tokens')
      .select('user_id, fcm_token')
      .eq('game_id', payload.gameId)
      .in(
        'user_id',
        targets.map((t) => t.userId),
      )

    if (tokenError) throw tokenError

    const tokensByUser = new Map<string, string[]>()
    for (const row of tokens ?? []) {
      const uid = row.user_id as string
      const list = tokensByUser.get(uid) ?? []
      list.push(row.fcm_token as string)
      tokensByUser.set(uid, list)
    }

    const saRaw = Deno.env.get('FCM_SERVICE_ACCOUNT')
    if (!saRaw) throw new Error('FCM_SERVICE_ACCOUNT secret no configurado')
    const sa = parseServiceAccount(saRaw)
    const accessToken = await getFcmAccessToken(sa)

    const climberLabel = payload.displayName?.trim() || 'Otro jugador'
    let notified = 0

    for (const target of targets) {
      const userTokens = tokensByUser.get(target.userId) ?? []
      if (userTokens.length === 0) continue

      const title = '¡Te superaron en el ranking!'
      const body = `¡Ojo! @${climberLabel} te superó — ahora eres #${target.rank}`
      let sentAny = false

      for (const token of userTokens) {
        try {
          await sendFcmMessage(sa, accessToken, {
            token,
            title,
            body,
            data: {
              type: RANK_OVERTAKEN_TYPE,
              screen: 'leaderboard',
              climberUserId: payload.climberUserId,
              newRank: String(target.rank),
            },
          })
          sentAny = true
        } catch (err) {
          console.error('[on-rank-change] FCM error', err)
        }
      }

      if (sentAny) {
        await admin.from('nb_push_log').insert({
          user_id: target.userId,
          game_id: payload.gameId,
          type: RANK_OVERTAKEN_TYPE,
        })
        notified += 1
      }
    }

    return new Response(JSON.stringify({ notified, candidates: targets.length }), {
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
