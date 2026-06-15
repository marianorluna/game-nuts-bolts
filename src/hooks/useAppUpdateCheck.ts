import { useEffect, useState } from 'react'
import {
  checkForAppUpdate,
  dismissAppUpdate,
  type AppUpdateCheckResult,
} from '../services/appUpdateService'

export function useAppUpdateCheck(enabled: boolean) {
  const [update, setUpdate] = useState<AppUpdateCheckResult | null>(null)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    checkForAppUpdate().then((result) => {
      if (!cancelled && result.available) {
        setUpdate(result)
      }
    })

    return () => {
      cancelled = true
    }
  }, [enabled])

  const dismiss = () => {
    if (!update?.availableVersion) return
    dismissAppUpdate(update.availableVersion)
    setUpdate(null)
  }

  return { update, dismiss, clearUpdate: () => setUpdate(null) }
}
