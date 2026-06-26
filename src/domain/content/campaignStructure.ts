import type { LevelDefinition, MechanicId, ThemeId } from '../types'

export interface MilestoneMeta {
  levelId: number
  title: string
  message: string
  emoji: string
}

export interface StageMeta {
  id: string
  /** Nombre visible en UI (lore del taller). */
  name: string
  /** Una línea de contexto bajo el título de etapa en el menú. */
  blurb: string
  levelFrom: number
  levelTo: number
  themeId: ThemeId
  mechanicIds: MechanicId[]
}

export interface SectionMeta {
  id: string
  name: string
  campaignId: string
  levelFrom: number
  levelTo: number
  stages: StageMeta[]
}

export interface CampaignMeta {
  id: string
  name: string
  sections: SectionMeta[]
}

export const THEME_BACKGROUNDS: Record<ThemeId, string> = {
  workshop: 'bg-gradient-to-b from-[#3d2a6b] to-[#2d1b4e]',
  garage: 'bg-gradient-to-b from-[#2a3d4a] to-[#1a2830]',
  factory: 'bg-gradient-to-b from-[#3d3520] to-[#2a2518]',
}

const STAGE_1: StageMeta = {
  id: 'stage-1-fundamentos',
  name: 'Caja de herramientas',
  blurb: 'Ordena la caja, que todo quede en su lugar.',
  levelFrom: 1,
  levelTo: 30,
  themeId: 'workshop',
  mechanicIds: [],
}

const STAGE_2: StageMeta = {
  id: 'stage-2-presion',
  name: 'El garaje apretado',
  blurb: 'El coche ocupa sitio. Queda poco espacio libre en el banco.',
  levelFrom: 31,
  levelTo: 60,
  themeId: 'garage',
  mechanicIds: [],
}

const STAGE_3: StageMeta = {
  id: 'stage-3-nuevas-reglas',
  name: 'La línea de montaje',
  blurb: 'Encargos grandes: cadenas de tuercas y bulones que hay que liberar.',
  levelFrom: 61,
  levelTo: 100,
  themeId: 'factory',
  mechanicIds: ['multiNut', 'lockedBolt'],
}

export const SECTION_1_FUNDAMENTOS: SectionMeta = {
  id: 'section-1-fundamentos',
  name: 'Aprendiz de banco',
  campaignId: 'campaign-1-taller',
  levelFrom: 1,
  levelTo: 100,
  stages: [STAGE_1, STAGE_2, STAGE_3],
}

export const CAMPAIGN_1_TALLER: CampaignMeta = {
  id: 'campaign-1-taller',
  name: 'El Taller',
  sections: [SECTION_1_FUNDAMENTOS],
}

export const CHALLENGE_LEVEL_IDS = new Set([20, 40, 60, 80, 100])

/** Nombre jugable de retos especiales (niveles con ⚡). */
export const CHALLENGE_LABELS: Record<number, string> = {
  20: 'Inspección de la caja',
  40: 'Prueba de torque',
  60: 'Cierre del garaje',
  80: 'Control de calidad',
  100: 'Graduación de aprendiz',
}

const MILESTONES: MilestoneMeta[] = [
  {
    levelId: 20,
    title: '¡Inspección superada!',
    message: 'La caja pasó el control. Sigue ordenando antes de cerrar el turno.',
    emoji: '⚡',
  },
  {
    levelId: 30,
    title: '¡Caja ordenada!',
    message: 'Completaste la caja de herramientas. Mañana toca el garaje apretado.',
    emoji: '🏆',
  },
  {
    levelId: 40,
    title: '¡Prueba de torque!',
    message: 'Aguantaste con un solo bulón libre. El garaje no perdona.',
    emoji: '⚡',
  },
  {
    levelId: 60,
    title: '¡Garaje cerrado!',
    message: 'El banco apretado ya no te intimida. La línea de montaje te espera.',
    emoji: '🔩',
  },
]

export function getStageForLevel(levelId: number): StageMeta | undefined {
  for (const section of CAMPAIGN_1_TALLER.sections) {
    const stage = section.stages.find(
      (s) => levelId >= s.levelFrom && levelId <= s.levelTo,
    )
    if (stage) return stage
  }
  return undefined
}

export function getSectionForLevel(levelId: number): SectionMeta | undefined {
  return CAMPAIGN_1_TALLER.sections.find(
    (s) => levelId >= s.levelFrom && levelId <= s.levelTo,
  )
}

export function getThemeForLevel(levelId: number): ThemeId {
  return getStageForLevel(levelId)?.themeId ?? 'workshop'
}

export function getThemeBackground(levelId: number): string {
  return THEME_BACKGROUNDS[getThemeForLevel(levelId)]
}

export function getMilestoneForLevel(levelId: number): MilestoneMeta | undefined {
  return MILESTONES.find((m) => m.levelId === levelId)
}

export function isChallengeLevel(levelId: number): boolean {
  return CHALLENGE_LEVEL_IDS.has(levelId)
}

export function getChallengeLabel(levelId: number): string | undefined {
  return CHALLENGE_LABELS[levelId]
}

export function enrichLevelMetadata(level: LevelDefinition): LevelDefinition {
  const stage = getStageForLevel(level.id)
  const mechanics = stage?.mechanicIds.length ? [...stage.mechanicIds] : undefined
  return {
    ...level,
    stageId: stage?.id,
    isChallenge: isChallengeLevel(level.id),
    mechanics,
  }
}

export function getLevelsByStage(
  levels: LevelDefinition[],
  stage: StageMeta,
): LevelDefinition[] {
  return levels.filter(
    (l) => l.id >= stage.levelFrom && l.id <= stage.levelTo,
  )
}

export function countCompletedInRange(
  levels: LevelDefinition[],
  levelFrom: number,
  levelTo: number,
  isCompleted: (id: number) => boolean,
): number {
  return levels.filter(
    (l) => l.id >= levelFrom && l.id <= levelTo && isCompleted(l.id),
  ).length
}
