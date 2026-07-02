const LOCKED_BOLT_COACH_MARK_KEY = 'nuts-bolts-locked-bolt-coach-seen'

export function hasSeenLockedBoltCoachMark(): boolean {
  try {
    return localStorage.getItem(LOCKED_BOLT_COACH_MARK_KEY) === '1'
  } catch {
    return true
  }
}

export function markLockedBoltCoachMarkSeen(): void {
  try {
    localStorage.setItem(LOCKED_BOLT_COACH_MARK_KEY, '1')
  } catch {
    // Ignorar si el almacenamiento no está disponible.
  }
}
