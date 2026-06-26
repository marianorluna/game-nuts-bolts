import type { LevelDefinition, MechanicId, ThemeId } from '../types'

export interface MilestoneMeta {
  levelId: number
  emoji: string
}

export interface StageMeta {
  id: string
  levelFrom: number
  levelTo: number
  themeId: ThemeId
  mechanicIds: MechanicId[]
}

export interface SectionMeta {
  id: string
  campaignId: string
  levelFrom: number
  levelTo: number
  stages: StageMeta[]
}

export interface CampaignMeta {
  id: string
  /** Emoji o símbolo representativo en la UI. */
  emoji: string
  /** Paleta visual de la campaña en el menú. */
  themeId: ThemeId
  /** Si false, la campaña aparece bloqueada en el menú. */
  available: boolean
  sections: SectionMeta[]
}

export interface CampaignCardTheme {
  cardGradient: string
  borderActive: string
  borderLocked: string
  glowColor: string
  titleText: string
  taglineText: string
  progressTrack: string
  progressFrom: string
  progressTo: string
  patternClass: string
  badgeClass: string
}

export const CAMPAIGN_CARD_THEMES: Record<ThemeId, CampaignCardTheme> = {
  workshop: {
    cardGradient: 'bg-gradient-to-br from-[#4a3578] via-[#3d2a6b] to-[#2a1f4a]',
    borderActive: 'border-amber-400/60 shadow-[0_8px_32px_rgba(251,191,36,0.22)]',
    borderLocked: 'border-violet-400/30',
    glowColor: 'bg-amber-400/30',
    titleText: 'text-amber-100',
    taglineText: 'text-purple-200/90',
    progressTrack: 'bg-violet-950/40',
    progressFrom: 'from-amber-400',
    progressTo: 'to-orange-500',
    patternClass: 'campaign-pattern-workshop',
    badgeClass: 'bg-violet-900/50 text-purple-100',
  },
  garage: {
    cardGradient: 'bg-gradient-to-br from-[#3a5260] via-[#2a3d4a] to-[#1a2830]',
    borderActive: 'border-cyan-400/55 shadow-[0_8px_32px_rgba(34,211,238,0.18)]',
    borderLocked: 'border-slate-400/30',
    glowColor: 'bg-cyan-400/25',
    titleText: 'text-cyan-100',
    taglineText: 'text-slate-300/90',
    progressTrack: 'bg-slate-950/40',
    progressFrom: 'from-cyan-400',
    progressTo: 'to-blue-500',
    patternClass: 'campaign-pattern-garage',
    badgeClass: 'bg-slate-800/60 text-slate-200',
  },
  factory: {
    cardGradient: 'bg-gradient-to-br from-[#4a4228] via-[#3d3520] to-[#2a2518]',
    borderActive: 'border-lime-400/55 shadow-[0_8px_32px_rgba(163,230,53,0.18)]',
    borderLocked: 'border-amber-700/35',
    glowColor: 'bg-lime-400/25',
    titleText: 'text-lime-100',
    taglineText: 'text-amber-100/80',
    progressTrack: 'bg-stone-950/40',
    progressFrom: 'from-lime-400',
    progressTo: 'to-yellow-500',
    patternClass: 'campaign-pattern-factory',
    badgeClass: 'bg-amber-950/50 text-amber-100',
  },
}

export function getCampaignCardTheme(themeId: ThemeId): CampaignCardTheme {
  return CAMPAIGN_CARD_THEMES[themeId]
}

export const THEME_BACKGROUNDS: Record<ThemeId, string> = {
  workshop: 'bg-gradient-to-b from-[#3d2a6b] to-[#2d1b4e]',
  garage: 'bg-gradient-to-b from-[#2a3d4a] to-[#1a2830]',
  factory: 'bg-gradient-to-b from-[#3d3520] to-[#2a2518]',
}

const STAGE_1: StageMeta = {
  id: 'stage-1-fundamentos',
  levelFrom: 1,
  levelTo: 30,
  themeId: 'workshop',
  mechanicIds: [],
}

const STAGE_2: StageMeta = {
  id: 'stage-2-presion',
  levelFrom: 31,
  levelTo: 60,
  themeId: 'garage',
  mechanicIds: [],
}

const STAGE_3: StageMeta = {
  id: 'stage-3-nuevas-reglas',
  levelFrom: 61,
  levelTo: 100,
  themeId: 'factory',
  mechanicIds: ['multiNut', 'lockedBolt'],
}

export const SECTION_1_FUNDAMENTOS: SectionMeta = {
  id: 'section-1-fundamentos',
  campaignId: 'campaign-1-taller',
  levelFrom: 1,
  levelTo: 100,
  stages: [STAGE_1, STAGE_2, STAGE_3],
}

export const CAMPAIGN_1_TALLER: CampaignMeta = {
  id: 'campaign-1-taller',
  emoji: '🔧',
  themeId: 'workshop',
  available: true,
  sections: [SECTION_1_FUNDAMENTOS],
}

export const CAMPAIGN_2_OBRA: CampaignMeta = {
  id: 'campaign-2-obra',
  emoji: '🏗️',
  themeId: 'garage',
  available: false,
  sections: [],
}

export const CAMPAIGN_3_FABRICA: CampaignMeta = {
  id: 'campaign-3-fabrica',
  emoji: '🏭',
  themeId: 'factory',
  available: false,
  sections: [],
}

export const ALL_CAMPAIGNS: CampaignMeta[] = [
  CAMPAIGN_1_TALLER,
  CAMPAIGN_2_OBRA,
  CAMPAIGN_3_FABRICA,
]

export function getCampaignById(campaignId: string): CampaignMeta | undefined {
  return ALL_CAMPAIGNS.find((c) => c.id === campaignId)
}

export function getCampaignProgress(
  campaign: CampaignMeta,
  isCompleted: (id: number) => boolean,
): { completed: number; total: number } {
  let completed = 0
  let total = 0
  for (const section of campaign.sections) {
    for (let id = section.levelFrom; id <= section.levelTo; id++) {
      total++
      if (isCompleted(id)) completed++
    }
  }
  return { completed, total }
}

export const CHALLENGE_LEVEL_IDS = new Set([20, 40, 60, 80, 100])

const MILESTONES: MilestoneMeta[] = [
  { levelId: 20, emoji: '⚡' },
  { levelId: 30, emoji: '🏆' },
  { levelId: 40, emoji: '⚡' },
  { levelId: 60, emoji: '🔩' },
  { levelId: 80, emoji: '⚡' },
  { levelId: 100, emoji: '🏆' },
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

export function enrichLevelMetadata(level: LevelDefinition): LevelDefinition {
  const stage = getStageForLevel(level.id)
  let mechanics = level.mechanics
  if (!mechanics?.length) {
    if (level.id >= 81) mechanics = ['multiNut', 'lockedBolt']
    else if (level.id >= 61) mechanics = ['multiNut']
    else if (stage?.mechanicIds.length) mechanics = [...stage.mechanicIds]
  }
  return {
    ...level,
    stageId: stage?.id,
    isChallenge: isChallengeLevel(level.id),
    mechanics: mechanics?.length ? mechanics : undefined,
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

export function getStageProgressStats(
  stage: StageMeta,
  isCompleted: (id: number) => boolean,
): { completed: number; total: number; percent: number } {
  const total = stage.levelTo - stage.levelFrom + 1
  let completed = 0
  for (let id = stage.levelFrom; id <= stage.levelTo; id++) {
    if (isCompleted(id)) completed++
  }
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, percent }
}

export function isStageComplete(
  stage: StageMeta,
  isCompleted: (id: number) => boolean,
): boolean {
  for (let id = stage.levelFrom; id <= stage.levelTo; id++) {
    if (!isCompleted(id)) return false
  }
  return true
}

export function isStageUnlocked(
  stageIndex: number,
  section: SectionMeta,
  isCompleted: (id: number) => boolean,
): boolean {
  if (stageIndex <= 0) return true
  const previous = section.stages[stageIndex - 1]
  if (!previous) return false
  return isStageComplete(previous, isCompleted)
}

export function isStageUnlockedForLevel(
  levelId: number,
  section: SectionMeta,
  isCompleted: (id: number) => boolean,
): boolean {
  const stage = getStageForLevel(levelId)
  if (!stage) return false
  const stageIndex = section.stages.findIndex((s) => s.id === stage.id)
  if (stageIndex < 0) return false
  return isStageUnlocked(stageIndex, section, isCompleted)
}

export function getUnlockedStageIndices(
  section: SectionMeta,
  isCompleted: (id: number) => boolean,
): number[] {
  return section.stages
    .map((_, index) => index)
    .filter((index) => isStageUnlocked(index, section, isCompleted))
}

export function getDefaultHomeStageId(
  section: SectionMeta,
  isCompleted: (id: number) => boolean,
  unlockedLevel: number,
): string {
  const unlockedIndices = getUnlockedStageIndices(section, isCompleted)
  if (unlockedIndices.length === 0) return section.stages[0]!.id

  const continueStage = getStageForLevel(unlockedLevel)
  if (continueStage) {
    const continueIndex = section.stages.findIndex((s) => s.id === continueStage.id)
    if (continueIndex >= 0 && unlockedIndices.includes(continueIndex)) {
      if (!isStageComplete(section.stages[continueIndex]!, isCompleted)) {
        return continueStage.id
      }
    }
  }

  for (const index of unlockedIndices) {
    const stage = section.stages[index]!
    if (!isStageComplete(stage, isCompleted)) return stage.id
  }

  return section.stages[unlockedIndices[unlockedIndices.length - 1]!]!.id
}
