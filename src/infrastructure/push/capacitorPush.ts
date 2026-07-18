import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import type { PushNotificationActionHandler } from '../contracts/PushRepository'

/**
 * Must match `channelForType` in supabase/functions/send-push/index.ts.
 * Android 8+ drops (or hides) notifications whose channel_id was never created.
 */
export const ANDROID_PUSH_CHANNEL_IDS = {
  rankAlerts: 'rank_alerts',
  engagement: 'engagement',
} as const

const ANDROID_PUSH_CHANNELS = [
  {
    id: ANDROID_PUSH_CHANNEL_IDS.rankAlerts,
    name: 'Ranking',
    description: 'Avisos de ranking y resumen semanal',
    importance: 4,
    visibility: 1,
    vibration: true,
  },
  {
    id: ANDROID_PUSH_CHANNEL_IDS.engagement,
    name: 'Recordatorios',
    description: 'Racha, novedades, sync y volver a jugar',
    importance: 4,
    visibility: 1,
    vibration: true,
  },
] as const

let registrationToken: string | null = null
let listenersReady = false
let androidChannelsReady = false
const actionHandlers = new Set<PushNotificationActionHandler>()

export function isNativePushSupported(): boolean {
  const platform = Capacitor.getPlatform()
  return Capacitor.isNativePlatform() && (platform === 'android' || platform === 'ios')
}

export function getCachedFcmToken(): string | null {
  return registrationToken
}

export function onNativeNotificationAction(
  handler: PushNotificationActionHandler,
): () => void {
  actionHandlers.add(handler)
  return () => {
    actionHandlers.delete(handler)
  }
}

function emitAction(data: Record<string, string>): void {
  for (const handler of actionHandlers) {
    try {
      handler(data)
    } catch {
      // handlers must not break the app
    }
  }
}

/** Creates FCM notification channels before any push can be displayed (Android O+). */
export async function ensureAndroidPushChannels(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android' || androidChannelsReady) return

  for (const channel of ANDROID_PUSH_CHANNELS) {
    await PushNotifications.createChannel({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      importance: channel.importance,
      visibility: channel.visibility,
      vibration: channel.vibration,
    })
  }
  androidChannelsReady = true
}

export async function requestNativePushPermission(): Promise<boolean> {
  if (!isNativePushSupported()) return false

  let status = await PushNotifications.checkPermissions()
  if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
    status = await PushNotifications.requestPermissions()
  }
  return status.receive === 'granted'
}

export async function ensureNativePushListeners(): Promise<void> {
  if (!isNativePushSupported() || listenersReady) return

  await PushNotifications.addListener('registration', (token) => {
    registrationToken = token.value
  })

  await PushNotifications.addListener('registrationError', (error) => {
    console.error('[push] registrationError', error.error)
  })

  await PushNotifications.addListener('pushNotificationReceived', () => {
    // Foreground: Android system tray still shows notification payloads; no-op UI
  })

  await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    const raw = event.notification.data ?? {}
    const data: Record<string, string> = {}
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === 'string') data[key] = value
      else if (value != null) data[key] = String(value)
    }
    emitAction(data)
  })

  listenersReady = true
}

export async function registerForNativePush(): Promise<string | null> {
  if (!isNativePushSupported()) return null

  await ensureAndroidPushChannels()
  await ensureNativePushListeners()
  await PushNotifications.register()

  // Token may arrive asynchronously via registration listener
  if (registrationToken) return registrationToken

  return await new Promise<string | null>((resolve) => {
    const timeout = window.setTimeout(() => resolve(registrationToken), 8000)
    void PushNotifications.addListener('registration', (token) => {
      window.clearTimeout(timeout)
      registrationToken = token.value
      resolve(token.value)
    }).then((handle) => {
      window.setTimeout(() => {
        void handle.remove()
      }, 8000)
    })
  })
}

export async function clearNativePushState(): Promise<void> {
  registrationToken = null
  if (!isNativePushSupported()) return
  try {
    await PushNotifications.removeAllListeners()
  } catch {
    // ignore
  }
  listenersReady = false
  androidChannelsReady = false
}
