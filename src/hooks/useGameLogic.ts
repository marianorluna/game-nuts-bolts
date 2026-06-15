import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { getLevelById } from '../domain/levels'

export function useGameLogic() {
  const session = useGameStore((s) => s.session)
  const selectBolt = useGameStore((s) => s.selectBolt)
  const undo = useGameStore((s) => s.undo)
  const resetLevel = useGameStore((s) => s.resetLevel)
  const clearShake = useGameStore((s) => s.clearShake)
  const startLevel = useGameStore((s) => s.startLevel)
  const setScreen = useGameStore((s) => s.setScreen)

  const level = session ? getLevelById(session.levelId) : undefined

  useEffect(() => {
    if (!session?.shakeBoltIndex) return
    const timer = window.setTimeout(() => clearShake(), 400)
    return () => window.clearTimeout(timer)
  }, [session?.shakeBoltIndex, clearShake])

  return {
    session,
    level,
    selectBolt,
    undo,
    resetLevel,
    startLevel,
    setScreen,
  }
}
