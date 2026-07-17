import { GAME_ID, SUPABASE_TABLES } from '../../config/game'
import type {
  NotificationPreferences,
  PushRepository,
  RegisterPushDeviceInput,
} from '../contracts/PushRepository'
import {
  clearNativePushState,
  getCachedFcmToken,
  isNativePushSupported,
  onNativeNotificationAction,
  registerForNativePush,
  requestNativePushPermission,
} from '../push/capacitorPush'
import { getSupabaseClient } from './client'

/** Opt-out: on by default; user can disable in Settings. */
export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  pushEnabled: true,
  rankOvertaken: true,
  reEngagement: true,
  appUpdates: true,
  newContent: true,
  dailyStreak: true,
  weeklySummary: true,
  milestones: true,
  syncReminder: true,
}

/** Forced state when master switch is off (must not reuse DEFAULT). */
export const DISABLED_NOTIFICATION_PREFS: NotificationPreferences = {
  pushEnabled: false,
  rankOvertaken: false,
  reEngagement: false,
  appUpdates: false,
  newContent: false,
  dailyStreak: false,
  weeklySummary: false,
  milestones: false,
  syncReminder: false,
}

const PREF_COLUMNS =
  'push_enabled, rank_overtaken, re_engagement, app_updates, new_content, daily_streak, weekly_summary, milestones, sync_reminder'

function mapPrefs(data: Record<string, unknown>): NotificationPreferences {
  return {
    pushEnabled: Boolean(data.push_enabled),
    rankOvertaken: Boolean(data.rank_overtaken),
    reEngagement: Boolean(data.re_engagement),
    appUpdates: Boolean(data.app_updates),
    newContent: Boolean(data.new_content),
    dailyStreak: Boolean(data.daily_streak),
    weeklySummary: Boolean(data.weekly_summary),
    milestones: Boolean(data.milestones),
    syncReminder: Boolean(data.sync_reminder),
  }
}

function toRow(prefs: NotificationPreferences): Record<string, unknown> {
  return {
    push_enabled: prefs.pushEnabled,
    rank_overtaken: prefs.rankOvertaken,
    re_engagement: prefs.reEngagement,
    app_updates: prefs.appUpdates,
    new_content: prefs.newContent,
    daily_streak: prefs.dailyStreak,
    weekly_summary: prefs.weeklySummary,
    milestones: prefs.milestones,
    sync_reminder: prefs.syncReminder,
  }
}

/** When master is off, all category toggles are forced off. */
export function applyMasterGate(
  prefs: NotificationPreferences,
): NotificationPreferences {
  if (prefs.pushEnabled) return prefs
  return { ...DISABLED_NOTIFICATION_PREFS }
}

export function createSupabasePushRepository(): PushRepository {
  const supabase = getSupabaseClient()

  return {
    isNativeSupported() {
      return isNativePushSupported()
    },

    async requestPermission() {
      return requestNativePushPermission()
    },

    async registerDevice(input: RegisterPushDeviceInput) {
      const { error } = await supabase.from(SUPABASE_TABLES.pushTokens).upsert(
        {
          user_id: input.userId,
          game_id: GAME_ID,
          fcm_token: input.fcmToken,
          platform: input.platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,game_id,fcm_token' },
      )
      if (error) throw error
    },

    async unregisterDevice(userId, fcmToken) {
      const token = fcmToken ?? getCachedFcmToken()
      let query = supabase
        .from(SUPABASE_TABLES.pushTokens)
        .delete()
        .eq('user_id', userId)
        .eq('game_id', GAME_ID)

      if (token) {
        query = query.eq('fcm_token', token)
      }

      const { error } = await query
      if (error) throw error
      await clearNativePushState()
    },

    async getPreferences(userId) {
      const { data, error } = await supabase
        .from(SUPABASE_TABLES.notificationPreferences)
        .select(PREF_COLUMNS)
        .eq('user_id', userId)
        .eq('game_id', GAME_ID)
        .maybeSingle()

      if (error) throw error
      if (data) return mapPrefs(data as Record<string, unknown>)

      // First visit: persist opt-out defaults so crons/Edge Functions see the row.
      const defaults = { ...DEFAULT_NOTIFICATION_PREFS }
      const { error: upsertError } = await supabase
        .from(SUPABASE_TABLES.notificationPreferences)
        .upsert(
          {
            user_id: userId,
            game_id: GAME_ID,
            ...toRow(defaults),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,game_id' },
        )
      if (upsertError) throw upsertError
      return defaults
    },

    async setPreferences(userId, prefs) {
      const current = await this.getPreferences(userId)
      let next: NotificationPreferences = {
        ...current,
        ...prefs,
      }
      next = applyMasterGate(next)

      const { error } = await supabase
        .from(SUPABASE_TABLES.notificationPreferences)
        .upsert(
          {
            user_id: userId,
            game_id: GAME_ID,
            ...toRow(next),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,game_id' },
        )
      if (error) throw error
      return next
    },

    onNotificationAction(handler) {
      return onNativeNotificationAction(handler)
    },
  }
}

/** Obtiene token FCM nativo tras permiso concedido. */
export async function obtainNativeFcmToken(): Promise<string | null> {
  return registerForNativePush()
}
