const MULTI_NUT_COACH_MARK_KEY = 'nuts-bolts-multi-nut-coach-seen'

export function hasSeenMultiNutCoachMark(): boolean {
  try {
    return localStorage.getItem(MULTI_NUT_COACH_MARK_KEY) === '1'
  } catch {
    return true
  }
}

export function markMultiNutCoachMarkSeen(): void {
  try {
    localStorage.setItem(MULTI_NUT_COACH_MARK_KEY, '1')
  } catch {
    // Ignorar si el almacenamiento no está disponible.
  }
}
