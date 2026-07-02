import type { MechanicId } from '../domain/types'

/**
 * Nivel de campaña donde se muestra el globo de ayuda al introducir cada mecánica.
 * Al añadir una mecánica nueva: registrar aquí, crear CoachMark + onboardingService + i18n.
 * Ver docs/EXTENSION_PLAYBOOK.md → «Checklist: añadir una mecánica nueva».
 */
export const MECHANIC_COACH_INTRO_LEVEL: Partial<Record<MechanicId, number>> = {
  multiNut: 61,
  lockedBolt: 81,
}

export function getMechanicIntroLevel(mechanic: MechanicId): number | undefined {
  return MECHANIC_COACH_INTRO_LEVEL[mechanic]
}
