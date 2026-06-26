const MOVES_COACH_MARK_KEY = 'nuts-bolts-moves-coach-seen'

export function hasSeenMovesCoachMark(): boolean {
  try {
    return localStorage.getItem(MOVES_COACH_MARK_KEY) === '1'
  } catch {
    return true
  }
}

export function markMovesCoachMarkSeen(): void {
  try {
    localStorage.setItem(MOVES_COACH_MARK_KEY, '1')
  } catch {
    // Ignorar si el almacenamiento no está disponible.
  }
}
