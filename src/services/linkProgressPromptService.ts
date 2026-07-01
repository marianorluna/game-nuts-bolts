const STORAGE_KEY = 'nuts-bolts-link-progress-dismissed'

export function hasDismissedLinkProgressPrompt(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissLinkProgressPrompt(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // ignore quota / private mode
  }
}

export function shouldShowLinkProgressPrompt(
  unlockedLevel: number,
  isLoggedIn: boolean,
  cloudSyncEnabled: boolean,
): boolean {
  if (!cloudSyncEnabled || isLoggedIn) return false
  if (unlockedLevel <= 5) return false
  return !hasDismissedLinkProgressPrompt()
}
