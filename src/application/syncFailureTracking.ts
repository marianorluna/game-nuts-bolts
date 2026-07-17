const SYNC_FAILED_KEY = 'nb_sync_failed_at'

export function markSyncFailed(): void {
  try {
    localStorage.setItem(SYNC_FAILED_KEY, new Date().toISOString())
  } catch {
    // ignore
  }
}

export function clearSyncFailed(): void {
  try {
    localStorage.removeItem(SYNC_FAILED_KEY)
  } catch {
    // ignore
  }
}

export function getSyncFailedAt(): string | null {
  try {
    return localStorage.getItem(SYNC_FAILED_KEY)
  } catch {
    return null
  }
}

/** True if last sync failure was at least `minAgeMs` ago. */
export function isSyncFailureStale(minAgeMs: number, nowMs = Date.now()): boolean {
  const raw = getSyncFailedAt()
  if (!raw) return false
  const ts = Date.parse(raw)
  if (Number.isNaN(ts)) return false
  return nowMs - ts >= minAgeMs
}
