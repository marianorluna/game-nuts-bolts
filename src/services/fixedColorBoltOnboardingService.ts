const FIXED_COLOR_BOLT_COACH_MARK_KEY = 'nuts-bolts-fixed-color-coach-seen'

export function hasSeenFixedColorBoltCoachMark(): boolean {
  try {
    return localStorage.getItem(FIXED_COLOR_BOLT_COACH_MARK_KEY) === '1'
  } catch {
    return true
  }
}

export function markFixedColorBoltCoachMarkSeen(): void {
  try {
    localStorage.setItem(FIXED_COLOR_BOLT_COACH_MARK_KEY, '1')
  } catch {
    // Ignorar si el almacenamiento no está disponible.
  }
}
