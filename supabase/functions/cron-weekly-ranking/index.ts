import {
  adminClient,
  assertCronOrServiceRole,
  invokeSendPush,
  jsonResponse,
} from '../_shared/cronAuth.ts'

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

const TYPE = 'weekly_summary'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    if (!assertCronOrServiceRole(req)) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body = (await req.json().catch(() => ({}))) as { gameId?: string }
    const gameId = body.gameId ?? 'nuts-and-bolts'
    const admin = adminClient()

    const { data: prefs, error: prefsError } = await admin
      .from('nb_notification_preferences')
      .select('user_id')
      .eq('game_id', gameId)
      .eq('push_enabled', true)
      .eq('weekly_summary', true)

    if (prefsError) throw prefsError
    const eligibleSet = new Set((prefs ?? []).map((p) => p.user_id as string))
    if (eligibleSet.size === 0) {
      return jsonResponse({ notified: 0, reason: 'no_eligible' })
    }

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
      .eq('game_id', gameId)
      .eq('nb_player_profiles.show_in_leaderboard', true)

    if (progressError) throw progressError

    const ranked = ((progressRows ?? []) as unknown as ProgressRow[]).sort(compareRank)
    let notified = 0

    for (let i = 0; i < ranked.length; i++) {
      const row = ranked[i]!
      if (!eligibleSet.has(row.user_id)) continue
      const rank = i + 1
      const result = await invokeSendPush({
        userId: row.user_id,
        gameId,
        type: TYPE,
        title: 'Resumen semanal',
        body: `Esta semana estás en el puesto #${rank} — ¡sigue así!`,
        data: { type: TYPE, screen: 'leaderboard', rank: String(rank) },
      })
      if (result.sent > 0) notified += 1
    }

    return jsonResponse({ notified, ranked: ranked.length })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
