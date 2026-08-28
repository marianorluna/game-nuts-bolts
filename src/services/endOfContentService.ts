const END_OF_CONTENT_KEY = 'nuts-bolts-end-of-content-seen-v2'

export function hasSeenEndOfContentModal(): boolean {
  try {
    return localStorage.getItem(END_OF_CONTENT_KEY) === '1'
  } catch {
    return true
  }
}

export function markEndOfContentModalSeen(): void {
  try {
    localStorage.setItem(END_OF_CONTENT_KEY, '1')
  } catch {
    // Ignorar si el almacenamiento no está disponible.
  }
}
