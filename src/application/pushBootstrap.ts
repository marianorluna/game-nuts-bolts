import { Capacitor } from '@capacitor/core'
import { GAME_ID } from '../config/game'
import type { Infrastructure } from '../infrastructure'
import {
  getRegisteredInfrastructure,
  isPushNotificationsEnabled,
} from '../infrastructure'
import { getCurrentAuthUser } from '../infrastructure/authSession'
import { getCachedFcmToken } from '../infrastructure/push/capacitorPush'
import { getSupabaseClient } from '../infrastructure/supabase/client'
import { obtainNativeFcmToken } from '../infrastructure/supabase/pushRepository'
import { useGameStore } from '../store/gameStore'
import { onRankUp } from './rankUpHooks'

let bootstrapped = false
let unsubRankUp: (() => void) | null = null
let unsubAction: (() => void) | null = null
let unsubAuth: (() => void) | null = null

async function invokeOnRankChange(payload: {
  userId: string
  previousRank: number
  newRank: number
  displayName: string | null
}): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.functions.invoke('on-rank-change', {
      body: {
        climberUserId: payload.userId,
        gameId: GAME_ID,
        previousRank: payload.previousRank,
        newRank: payload.newRank,
        displayName: payload.displayName,
      },
    })
    if (error) {
      console.error('[push] on-rank-change failed', error.message)
    }
  } catch (err) {
    console.error('[push] on-rank-change error', err)
  }
}

export async function syncPushRegistrationForUser(
  infrastructure: Infrastructure,
  userId: string,
): Promise<void> {
  const push = infrastructure.push
  if (!push?.isNativeSupported()) return

  const prefs = await push.getPreferences(userId)
  if (!prefs.pushEnabled) return

  const granted = await push.requestPermission()
  if (!granted) return

  const token = await obtainNativeFcmToken()
  if (!token) return

  const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
  await push.registerDevice({
    userId,
    fcmToken: token,
    platform,
  })
}

export async function clearPushOnSignOut(
  infrastructure: Infrastructure,
  userId: string,
): Promise<void> {
  const push = infrastructure.push
  if (!push) return
  try {
    await push.unregisterDevice(userId, getCachedFcmToken() ?? undefined)
  } catch (err) {
    console.error('[push] unregister on signOut failed', err)
  }
}

/**
 * Inicializa listeners push + enganche rank_up → Edge Function.
 * Seguro llamar una sola vez tras createInfrastructure().
 */
export function initPushBootstrap(infrastructure: Infrastructure): () => void {
  if (!isPushNotificationsEnabled() || !infrastructure.push) {
    return () => undefined
  }
  if (bootstrapped) {
    return () => undefined
  }
  bootstrapped = true

  unsubRankUp = onRankUp((payload) => {
    void invokeOnRankChange(payload)
  })

  unsubAction = infrastructure.push.onNotificationAction((data) => {
    if (data.type === 'rank_overtaken' || data.screen === 'leaderboard') {
      useGameStore.getState().openLeaderboard()
    }
  })

  unsubAuth = infrastructure.auth.onAuthStateChange((user) => {
    if (user) {
      void syncPushRegistrationForUser(infrastructure, user.id)
    }
  })

  const current = getCurrentAuthUser()
  if (current) {
    void syncPushRegistrationForUser(infrastructure, current.id)
  }

  return () => {
    unsubRankUp?.()
    unsubAction?.()
    unsubAuth?.()
    unsubRankUp = null
    unsubAction = null
    unsubAuth = null
    bootstrapped = false
  }
}

export function getPushInfrastructure(): Infrastructure['push'] {
  return getRegisteredInfrastructure()?.push ?? null
}
