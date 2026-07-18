import { Capacitor } from '@capacitor/core'
import {
  AppUpdate,
  AppUpdateAvailability,
  type AppUpdateInfo,
} from '@capawesome/capacitor-app-update'
import {
  isDisplayableAppVersion,
  pickDisplayVersion,
} from '../domain/releases/appVersionDisplay'
import { fetchAppReleaseVersionByCode } from '../infrastructure/supabase/appReleaseRepository'
import { getReleaseByVersionCode } from './releaseNotesService'

const DISMISSED_UPDATE_KEY = 'nuts-bolts-dismissed-update'

export interface AppUpdateCheckResult {
  available: boolean
  /** Stable id for dismiss (prefer Play versionCode). */
  updateKey?: string
  currentVersion?: string
  availableVersion?: string
  info?: AppUpdateInfo
}

/**
 * Play often omits versionName. Resolve semver as:
 * displayable name → remote catalog (always current) → local published only.
 * Unpublished scaffolds must not win: an old install may still map the next
 * versionCode to a future release (e.g. 1.5.1 mapped code 9 → 1.6.0).
 */
async function resolveSemver(
  versionName: string | undefined,
  versionCode: string | number | undefined,
): Promise<string> {
  if (isDisplayableAppVersion(versionName)) {
    return versionName!.trim()
  }

  if (versionCode === undefined || versionCode === '') return ''

  const remote = await fetchAppReleaseVersionByCode(versionCode)
  const fromRemote = pickDisplayVersion(undefined, remote ?? undefined)
  if (fromRemote) return fromRemote

  const localMapped = getReleaseByVersionCode(versionCode, {
    publishedOnly: true,
  })?.version
  return pickDisplayVersion(undefined, localMapped)
}

function updateKeyFromInfo(info: AppUpdateInfo, availableVersion: string): string {
  if (info.availableVersionCode !== undefined && info.availableVersionCode !== '') {
    return String(info.availableVersionCode)
  }
  return availableVersion
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

    const availableVersion = await resolveSemver(
      info.availableVersionName,
      info.availableVersionCode,
    )
    const updateKey = updateKeyFromInfo(info, availableVersion)
    if (!updateKey) {
      return { available: false }
    }

    const dismissed = localStorage.getItem(DISMISSED_UPDATE_KEY)
    if (dismissed === updateKey) {
      return { available: false }
    }

    return {
      available: true,
      updateKey,
      currentVersion: await resolveSemver(
        info.currentVersionName,
        info.currentVersionCode,
      ),
      availableVersion,
      info,
    }
  } catch {
    return { available: false }
  }
}

export function dismissAppUpdate(updateKey: string): void {
  localStorage.setItem(DISMISSED_UPDATE_KEY, updateKey)
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
