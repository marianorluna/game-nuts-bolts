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

const DEFAULT_PREFS: NotificationPreferences = {
  pushEnabled: false,
  rankOvertaken: false,
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
        .select('push_enabled, rank_overtaken')
        .eq('user_id', userId)
        .eq('game_id', GAME_ID)
        .maybeSingle()

      if (error) throw error
      if (!data) return { ...DEFAULT_PREFS }

      return {
        pushEnabled: Boolean(data.push_enabled),
        rankOvertaken: Boolean(data.rank_overtaken),
      }
    },

    async setPreferences(userId, prefs) {
      const current = await this.getPreferences(userId)
      const next: NotificationPreferences = {
        pushEnabled: prefs.pushEnabled ?? current.pushEnabled,
        rankOvertaken: prefs.rankOvertaken ?? current.rankOvertaken,
      }

      const { error } = await supabase
        .from(SUPABASE_TABLES.notificationPreferences)
        .upsert(
          {
            user_id: userId,
            game_id: GAME_ID,
            push_enabled: next.pushEnabled,
            rank_overtaken: next.rankOvertaken,
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
