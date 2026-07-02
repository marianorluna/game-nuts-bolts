import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

/**
 * Evita quedar en pantalla de juego sin sesión activa (fondo morado vacío).
 */
export function GameSessionGuard(): null {
  const screen = useGameStore((s) => s.screen)
  const session = useGameStore((s) => s.session)
  const goHome = useGameStore((s) => s.goHome)

  useEffect(() => {
    if (screen === 'game' && !session) {
      goHome()
    }
  }, [screen, session, goHome])

  return null
}
