import {
  adminClient,
  assertCronOrServiceRole,
  invokeSendPush,
  jsonResponse,
} from '../_shared/cronAuth.ts'

const TYPE = 're_engagement'
const TITLE = '¡Te extrañamos!'
const BODY = 'Tienes niveles pendientes — vuelve a Nuts & Bolts'

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

    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

    const { data: prefs, error: prefsError } = await admin
      .from('nb_notification_preferences')
      .select('user_id')
      .eq('game_id', gameId)
      .eq('push_enabled', true)
      .eq('re_engagement', true)

    if (prefsError) throw prefsError
    const eligibleIds = (prefs ?? []).map((p) => p.user_id as string)
    if (eligibleIds.length === 0) {
      return jsonResponse({ notified: 0, reason: 'no_eligible' })
    }

    const { data: progress, error: progressError } = await admin
      .from('nb_player_progress')
      .select('user_id, last_played_at')
      .eq('game_id', gameId)
      .in('user_id', eligibleIds)
      .or(`last_played_at.is.null,last_played_at.lt.${cutoff}`)

    if (progressError) throw progressError

    let notified = 0
    const skipped: string[] = []
    for (const row of progress ?? []) {
      const result = await invokeSendPush({
        userId: row.user_id as string,
        gameId,
        type: TYPE,
        title: TITLE,
        body: BODY,
        data: { type: TYPE, screen: 'home' },
      })
      if (result.sent > 0) notified += 1
      else if (result.reason) skipped.push(`${row.user_id}:${result.reason}`)
    }

    return jsonResponse({ notified, candidates: progress?.length ?? 0, skipped })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
