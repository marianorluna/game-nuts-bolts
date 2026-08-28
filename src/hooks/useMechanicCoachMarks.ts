import { useEffect, useState } from 'react'
import { MECHANIC_COACH_INTRO_LEVEL } from '../config/mechanicOnboarding'
import {
  hasSeenFixedColorBoltCoachMark,
  markFixedColorBoltCoachMarkSeen,
} from '../services/fixedColorBoltOnboardingService'
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
import {
  hasSeenVariableCapacityCoachMark,
  markVariableCapacityCoachMarkSeen,
} from '../services/variableCapacityOnboardingService'

interface MechanicCoachMarkState {
  movesCoachVisible: boolean
  multiNutCoachVisible: boolean
  lockedBoltCoachVisible: boolean
  variableCapacityCoachVisible: boolean
  fixedColorBoltCoachVisible: boolean
  dismissMovesCoach: () => void
  dismissMultiNutCoach: () => void
  dismissLockedBoltCoach: () => void
  dismissVariableCapacityCoach: () => void
  dismissFixedColorBoltCoach: () => void
}

export function useMechanicCoachMarks(levelId: number | undefined): MechanicCoachMarkState {
  const [movesCoachVisible, setMovesCoachVisible] = useState(false)
  const [multiNutCoachVisible, setMultiNutCoachVisible] = useState(false)
  const [lockedBoltCoachVisible, setLockedBoltCoachVisible] = useState(false)
  const [variableCapacityCoachVisible, setVariableCapacityCoachVisible] = useState(false)
  const [fixedColorBoltCoachVisible, setFixedColorBoltCoachVisible] = useState(false)

  useEffect(() => {
    if (levelId === undefined) return

    const clearMechanicCoaches = () => {
      setMultiNutCoachVisible(false)
      setLockedBoltCoachVisible(false)
      setVariableCapacityCoachVisible(false)
      setFixedColorBoltCoachVisible(false)
      setMovesCoachVisible(false)
    }

    const introFixedColor = MECHANIC_COACH_INTRO_LEVEL.fixedColorBolt
    if (
      introFixedColor !== undefined &&
      levelId === introFixedColor &&
      !hasSeenFixedColorBoltCoachMark()
    ) {
      clearMechanicCoaches()
      setFixedColorBoltCoachVisible(true)
      return
    }

    const introVariableCapacity = MECHANIC_COACH_INTRO_LEVEL.variableCapacity
    if (
      introVariableCapacity !== undefined &&
      levelId === introVariableCapacity &&
      !hasSeenVariableCapacityCoachMark()
    ) {
      clearMechanicCoaches()
      setVariableCapacityCoachVisible(true)
      return
    }

    const introMultiNut = MECHANIC_COACH_INTRO_LEVEL.multiNut
    if (introMultiNut !== undefined && levelId === introMultiNut && !hasSeenMultiNutCoachMark()) {
      clearMechanicCoaches()
      setMultiNutCoachVisible(true)
      return
    }

    const introLockedBolt = MECHANIC_COACH_INTRO_LEVEL.lockedBolt
    if (
      introLockedBolt !== undefined &&
      levelId === introLockedBolt &&
      !hasSeenLockedBoltCoachMark()
    ) {
      clearMechanicCoaches()
      setLockedBoltCoachVisible(true)
      return
    }

    clearMechanicCoaches()
    setMovesCoachVisible(!hasSeenMovesCoachMark())
  }, [levelId])

  return {
    movesCoachVisible,
    multiNutCoachVisible,
    lockedBoltCoachVisible,
    variableCapacityCoachVisible,
    fixedColorBoltCoachVisible,
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
    dismissVariableCapacityCoach: () => {
      markVariableCapacityCoachMarkSeen()
      setVariableCapacityCoachVisible(false)
    },
    dismissFixedColorBoltCoach: () => {
      markFixedColorBoltCoachMarkSeen()
      setFixedColorBoltCoachVisible(false)
    },
  }
}
