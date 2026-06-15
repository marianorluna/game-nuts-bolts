import { Capacitor } from '@capacitor/core'
import {
  AppUpdate,
  AppUpdateAvailability,
  type AppUpdateInfo,
} from '@capawesome/capacitor-app-update'

const DISMISSED_UPDATE_KEY = 'nuts-bolts-dismissed-update'

export interface AppUpdateCheckResult {
  available: boolean
  currentVersion?: string
  availableVersion?: string
  info?: AppUpdateInfo
}

function formatVersion(info: AppUpdateInfo, kind: 'current' | 'available'): string {
  if (kind === 'current') {
    return info.currentVersionName || info.currentVersionCode
  }
  return info.availableVersionName || info.availableVersionCode || ''
}

export async function checkForAppUpdate(): Promise<AppUpdateCheckResult> {
  if (!Capacitor.isNativePlatform()) {
    return { available: false }
  }

  try {
    const info = await AppUpdate.getAppUpdateInfo()

    if (
      info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE &&
      info.updateAvailability !== AppUpdateAvailability.UPDATE_IN_PROGRESS
    ) {
      return { available: false }
    }

    const availableVersion = formatVersion(info, 'available')
    if (!availableVersion) {
      return { available: false }
    }

    const dismissed = localStorage.getItem(DISMISSED_UPDATE_KEY)
    if (dismissed === availableVersion) {
      return { available: false }
    }

    return {
      available: true,
      currentVersion: formatVersion(info, 'current'),
      availableVersion,
      info,
    }
  } catch {
    return { available: false }
  }
}

export function dismissAppUpdate(availableVersion: string): void {
  localStorage.setItem(DISMISSED_UPDATE_KEY, availableVersion)
}

export async function openAppStoreListing(): Promise<void> {
  await AppUpdate.openAppStore()
}

export async function startNativeAppUpdate(
  info: AppUpdateInfo,
): Promise<'flexible' | 'immediate' | 'store'> {
  if (Capacitor.getPlatform() === 'android') {
    if (info.flexibleUpdateAllowed) {
      await AppUpdate.startFlexibleUpdate()
      return 'flexible'
    }
    if (info.immediateUpdateAllowed) {
      await AppUpdate.performImmediateUpdate()
      return 'immediate'
    }
  }

  await openAppStoreListing()
  return 'store'
}

export async function completeNativeAppUpdate(): Promise<void> {
  await AppUpdate.completeFlexibleUpdate()
}
