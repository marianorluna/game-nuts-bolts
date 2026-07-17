import { GAME_ID } from '../config/game'
import { SECTION_1_FUNDAMENTOS } from '../domain/content/campaignStructure'
import { ALL_LEVELS } from '../domain/levels'
import { crossedMilestonePercents } from '../domain/push/streakAndMilestones'
import type { PlayerProgress } from '../domain/types'
import type { Infrastructure } from '../infrastructure'
import { getSupabaseClient } from '../infrastructure/supabase/client'
import {
  clearSyncFailed,
  isSyncFailureStale,
} from './syncFailureTracking'

const SYNC_REMINDER_MIN_AGE_MS = 24 * 60 * 60 * 1000

function publishedLevelCount(): number {
  const section = SECTION_1_FUNDAMENTOS
  return ALL_LEVELS.filter(
    (l) => l.id >= section.levelFrom && l.id <= section.levelTo,
  ).length
}

async function invokeSendPush(payload: {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, string>
}): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.functions.invoke('send-push', {
      body: {
        userId: payload.userId,
        gameId: GAME_ID,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      },
    })
    if (error) {
      console.error('[push] send-push failed', error.message)
    }
  } catch (err) {
    console.error('[push] send-push error', err)
  }
}

export async function maybeNotifySyncReminder(
  infrastructure: Infrastructure,
  userId: string,
): Promise<void> {
  const push = infrastructure.push
  if (!push) return
  if (!isSyncFailureStale(SYNC_REMINDER_MIN_AGE_MS)) return

  try {
    const prefs = await push.getPreferences(userId)
    if (!prefs.pushEnabled || !prefs.syncReminder) return
  } catch {
    return
  }

  await invokeSendPush({
    userId,
    type: 'sync_reminder',
    title: 'Progreso sin guardar',
    body: 'Tu progreso no se guardó en la nube. Ábrela con conexión para sincronizar.',
    data: { type: 'sync_reminder', screen: 'settings' },
  })
}

export async function maybeNotifyMilestones(
  infrastructure: Infrastructure,
  userId: string,
  before: PlayerProgress,
  after: PlayerProgress,
): Promise<void> {
  const push = infrastructure.push
  if (!push) return

  const completedBefore = Object.values(before.levels).filter((l) => l.completed).length
  const completedAfter = Object.values(after.levels).filter((l) => l.completed).length
  const crossed = crossedMilestonePercents(
    completedBefore,
    completedAfter,
    publishedLevelCount(),
  )
  if (crossed.length === 0) return

  try {
    const prefs = await push.getPreferences(userId)
    if (!prefs.pushEnabled || !prefs.milestones) return
  } catch {
    return
  }

  for (const pct of crossed) {
    await invokeSendPush({
      userId,
      type: `milestone_${pct}`,
      title: '¡Hito alcanzado!',
      body: `Completaste el ${pct} % de la campaña`,
      data: {
        type: 'milestones',
        screen: 'home',
        percent: String(pct),
      },
    })
  }
}

export function onSyncSuccess(): void {
  clearSyncFailed()
}
