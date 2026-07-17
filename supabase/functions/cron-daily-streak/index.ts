import {
  adminClient,
  assertCronOrServiceRole,
  invokeSendPush,
  jsonResponse,
} from '../_shared/cronAuth.ts'
import { utcDateString } from '../_shared/pushRateLimit.ts'

const TYPE = 'daily_streak'

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
    const today = utcDateString()
    const admin = adminClient()

    const { data: prefs, error: prefsError } = await admin
      .from('nb_notification_preferences')
      .select('user_id')
      .eq('game_id', gameId)
      .eq('push_enabled', true)
      .eq('daily_streak', true)

    if (prefsError) throw prefsError
    const eligibleIds = (prefs ?? []).map((p) => p.user_id as string)
    if (eligibleIds.length === 0) {
      return jsonResponse({ notified: 0, reason: 'no_eligible' })
    }

    const { data: progress, error: progressError } = await admin
      .from('nb_player_progress')
      .select('user_id, current_streak, last_streak_date')
      .eq('game_id', gameId)
      .in('user_id', eligibleIds)
      .gt('current_streak', 0)
      .or(`last_streak_date.is.null,last_streak_date.lt.${today}`)

    if (progressError) throw progressError

    let notified = 0
    for (const row of progress ?? []) {
      const streak = Number(row.current_streak) || 0
      if (streak < 1) continue
      const result = await invokeSendPush({
        userId: row.user_id as string,
        gameId,
        type: TYPE,
        title: 'No rompas la racha',
        body: `Llevas ${streak} días seguidos — ¡sigue jugando!`,
        data: { type: TYPE, screen: 'home', streak: String(streak) },
      })
      if (result.sent > 0) notified += 1
    }

    return jsonResponse({ notified, candidates: progress?.length ?? 0 })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
