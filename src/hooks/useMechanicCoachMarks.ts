import { useEffect, useState } from 'react'
import { MECHANIC_COACH_INTRO_LEVEL } from '../config/mechanicOnboarding'
import {
  hasSeenLockedBoltCoachMark,
  markLockedBoltCoachMarkSeen,
} from '../services/lockedBoltOnboardingService'
import {
  hasSeenMultiNutCoachMark,
  markMultiNutCoachMarkSeen,
} from '../services/multiNutOnboardingService'
import {
  hasSeenMovesCoachMark,
  markMovesCoachMarkSeen,
} from '../services/onboardingService'

interface MechanicCoachMarkState {
  movesCoachVisible: boolean
  multiNutCoachVisible: boolean
  lockedBoltCoachVisible: boolean
  dismissMovesCoach: () => void
  dismissMultiNutCoach: () => void
  dismissLockedBoltCoach: () => void
}

export function useMechanicCoachMarks(levelId: number | undefined): MechanicCoachMarkState {
  const [movesCoachVisible, setMovesCoachVisible] = useState(false)
  const [multiNutCoachVisible, setMultiNutCoachVisible] = useState(false)
  const [lockedBoltCoachVisible, setLockedBoltCoachVisible] = useState(false)

  useEffect(() => {
    if (levelId === undefined) return

    const introMultiNut = MECHANIC_COACH_INTRO_LEVEL.multiNut
    const introLockedBolt = MECHANIC_COACH_INTRO_LEVEL.lockedBolt

    if (introMultiNut !== undefined && levelId === introMultiNut && !hasSeenMultiNutCoachMark()) {
      setMultiNutCoachVisible(true)
      setLockedBoltCoachVisible(false)
      setMovesCoachVisible(false)
      return
    }

    if (
      introLockedBolt !== undefined &&
      levelId === introLockedBolt &&
      !hasSeenLockedBoltCoachMark()
    ) {
      setLockedBoltCoachVisible(true)
      setMultiNutCoachVisible(false)
      setMovesCoachVisible(false)
      return
    }

    setMultiNutCoachVisible(false)
    setLockedBoltCoachVisible(false)
    setMovesCoachVisible(!hasSeenMovesCoachMark())
  }, [levelId])

  return {
    movesCoachVisible,
    multiNutCoachVisible,
    lockedBoltCoachVisible,
    dismissMovesCoach: () => {
      markMovesCoachMarkSeen()
      setMovesCoachVisible(false)
    },
    dismissMultiNutCoach: () => {
      markMultiNutCoachMarkSeen()
      setMultiNutCoachVisible(false)
    },
    dismissLockedBoltCoach: () => {
      markLockedBoltCoachMarkSeen()
      setLockedBoltCoachVisible(false)
    },
  }
}
