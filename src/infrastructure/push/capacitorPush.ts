import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import type { PushNotificationActionHandler } from '../contracts/PushRepository'

let registrationToken: string | null = null
let listenersReady = false
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
    // Foreground: bandeja nativa ya muestra en Android; no-op UI
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
}
