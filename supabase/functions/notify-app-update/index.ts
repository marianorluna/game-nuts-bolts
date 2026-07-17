import {
  adminClient,
  assertCronOrServiceRole,
  invokeSendPush,
  jsonResponse,
} from '../_shared/cronAuth.ts'

interface NotifyAppUpdateBody {
  gameId?: string
  version: string
  title?: string
  body?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    if (!assertCronOrServiceRole(req)) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const payload = (await req.json()) as NotifyAppUpdateBody
    if (!payload.version) {
      return jsonResponse({ error: 'Missing version' }, 400)
    }

    const gameId = payload.gameId ?? 'nuts-and-bolts'
    const versionSlug = payload.version.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 32)
    const type = `app_updates_${versionSlug}`
    const title = payload.title ?? `Nueva v${payload.version}`
    const body =
      payload.body ?? `Hay una actualización disponible — mejora y más en Nuts & Bolts`

    const admin = adminClient()
    const { data: prefs, error: prefsError } = await admin
      .from('nb_notification_preferences')
      .select('user_id')
      .eq('game_id', gameId)
      .eq('push_enabled', true)
      .eq('app_updates', true)

    if (prefsError) throw prefsError

    let notified = 0
    for (const row of prefs ?? []) {
      const result = await invokeSendPush({
        userId: row.user_id as string,
        gameId,
        type,
        title,
        body,
        data: {
          type: 'app_updates',
          screen: 'home',
          version: payload.version,
        },
      })
      if (result.sent > 0) notified += 1
    }

    return jsonResponse({
      notified,
      candidates: prefs?.length ?? 0,
      version: payload.version,
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
