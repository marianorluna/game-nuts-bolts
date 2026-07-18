/**
 * Play In-App Updates often omits availableVersionName on Android and only
 * returns versionCode. Never treat a bare integer as a user-facing version.
 */
export function isDisplayableAppVersion(value: string | undefined | null): boolean {
  if (value === undefined || value === null) return false
  const trimmed = value.trim()
  if (!trimmed) return false
  // Reject pure versionCode (e.g. "8") and accidental "v8"
  if (/^v?\d+$/i.test(trimmed)) return false
  return true
}

export function pickDisplayVersion(
  versionName: string | undefined,
  mappedSemver: string | undefined,
): string {
  if (isDisplayableAppVersion(versionName)) return versionName!.trim()
  if (isDisplayableAppVersion(mappedSemver)) return mappedSemver!.trim()
  return ''
}
