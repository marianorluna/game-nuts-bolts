import { Capacitor } from '@capacitor/core'
import { useCallback, useEffect, useState } from 'react'
import {
  clearPushOnSignOut,
  syncPushRegistrationForUser,
} from '../application/pushBootstrap'
import type { NotificationPreferences } from '../infrastructure/contracts/PushRepository'
import {
  getRegisteredInfrastructure,
  isPushNotificationsEnabled,
} from '../infrastructure'
import { obtainNativeFcmToken } from '../infrastructure/supabase/pushRepository'
import { useAuth } from './useAuth'

export interface UsePushResult {
  enabled: boolean
  nativeSupported: boolean
  prefs: NotificationPreferences | null
  busy: boolean
  error: string | null
  setPushEnabled: (enabled: boolean) => Promise<void>
  setRankOvertaken: (enabled: boolean) => Promise<void>
  refresh: () => Promise<void>
}

const DEFAULT_PREFS: NotificationPreferences = {
  pushEnabled: false,
  rankOvertaken: false,
}

export function usePush(): UsePushResult {
  const featureEnabled = isPushNotificationsEnabled()
  const infra = getRegisteredInfrastructure()
  const push = infra?.push ?? null
  const { user } = useAuth()

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!push || !user) {
      setPrefs(null)
      return
    }
    try {
      const next = await push.getPreferences(user.id)
      setPrefs(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar preferencias')
    }
  }, [push, user])

  useEffect(() => {
    if (!featureEnabled || !user) {
      setPrefs(null)
      return
    }
    void refresh()
  }, [featureEnabled, user, refresh])

  const setPushEnabled = useCallback(
    async (enabled: boolean) => {
      if (!push || !user || !infra) return
      setBusy(true)
      setError(null)
      try {
        if (enabled) {
          if (!push.isNativeSupported()) {
            setError('push_web_unsupported')
            setBusy(false)
            return
          }
          const granted = await push.requestPermission()
          if (!granted) {
            setError('push_permission_denied')
            setBusy(false)
            return
          }
          const next = await push.setPreferences(user.id, {
            pushEnabled: true,
          })
          setPrefs(next)
          await syncPushRegistrationForUser(infra, user.id)
        } else {
          await clearPushOnSignOut(infra, user.id)
          const next = await push.setPreferences(user.id, {
            pushEnabled: false,
            rankOvertaken: false,
          })
          setPrefs(next)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      } finally {
        setBusy(false)
      }
    },
    [push, user, infra],
  )

  const setRankOvertaken = useCallback(
    async (enabled: boolean) => {
      if (!push || !user || !infra) return
      setBusy(true)
      setError(null)
      try {
        const next = await push.setPreferences(user.id, {
          rankOvertaken: enabled,
        })
        setPrefs(next)
        if (enabled && next.pushEnabled) {
          const token = await obtainNativeFcmToken()
          if (token) {
            const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
            await push.registerDevice({
              userId: user.id,
              fcmToken: token,
              platform,
            })
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      } finally {
        setBusy(false)
      }
    },
    [push, user, infra],
  )

  return {
    enabled: featureEnabled,
    nativeSupported: push?.isNativeSupported() ?? false,
    prefs: prefs ?? (user ? DEFAULT_PREFS : null),
    busy,
    error,
    setPushEnabled,
    setRankOvertaken,
    refresh,
  }
}
