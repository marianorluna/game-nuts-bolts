import {
  adminClient,
  assertCronOrServiceRole,
  invokeSendPush,
  jsonResponse,
} from '../_shared/cronAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    if (!assertCronOrServiceRole(req)) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body = (await req.json().catch(() => ({}))) as {
      gameId?: string
      announcementId?: string
    }
    const gameId = body.gameId ?? 'nuts-and-bolts'
    const admin = adminClient()

    let query = admin
      .from('nb_content_announcements')
      .select('id, title, body, kind')
      .eq('game_id', gameId)
      .eq('active', true)
      .is('notified_at', null)
      .order('created_at', { ascending: true })
      .limit(5)

    if (body.announcementId) {
      query = admin
        .from('nb_content_announcements')
        .select('id, title, body, kind')
        .eq('id', body.announcementId)
        .eq('game_id', gameId)
        .eq('active', true)
        .is('notified_at', null)
        .limit(1)
    }

    const { data: announcements, error: annError } = await query
    if (annError) throw annError
    if (!announcements?.length) {
      return jsonResponse({ notified: 0, reason: 'no_announcements' })
    }

    const { data: prefs, error: prefsError } = await admin
      .from('nb_notification_preferences')
      .select('user_id')
      .eq('game_id', gameId)
      .eq('push_enabled', true)
      .eq('new_content', true)

    if (prefsError) throw prefsError

    let notified = 0
    const processed: string[] = []

    for (const ann of announcements) {
      const type = `new_content_${String(ann.id).replace(/-/g, '').slice(0, 24)}`
      for (const pref of prefs ?? []) {
        const result = await invokeSendPush({
          userId: pref.user_id as string,
          gameId,
          type,
          title: ann.title as string,
          body: ann.body as string,
          data: {
            type: 'new_content',
            screen: 'home',
            announcementId: ann.id as string,
            kind: ann.kind as string,
          },
        })
        if (result.sent > 0) notified += 1
      }

      await admin
        .from('nb_content_announcements')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', ann.id)

      processed.push(ann.id as string)
    }

    return jsonResponse({
      notified,
      announcements: processed,
      recipients: prefs?.length ?? 0,
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
