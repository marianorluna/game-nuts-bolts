const VARIABLE_CAPACITY_COACH_MARK_KEY =
  'nuts-bolts-variable-capacity-coach-seen'

export function hasSeenVariableCapacityCoachMark(): boolean {
  try {
    return localStorage.getItem(VARIABLE_CAPACITY_COACH_MARK_KEY) === '1'
  } catch {
    return true
  }
}

export function markVariableCapacityCoachMarkSeen(): void {
  try {
    localStorage.setItem(VARIABLE_CAPACITY_COACH_MARK_KEY, '1')
  } catch {
    // Ignorar si el almacenamiento no está disponible.
  }
}
