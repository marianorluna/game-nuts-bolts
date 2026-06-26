import type { Difficulty } from '../domain/types'
import type { Translator } from './types'

export function getCampaignName(t: Translator, campaignId: string): string {
  return t(`campaign.campaigns.${campaignId}.name`)
}

export function getCampaignTagline(t: Translator, campaignId: string): string {
  return t(`campaign.campaigns.${campaignId}.tagline`)
}

export function getStageName(t: Translator, stageId: string): string {
  return t(`campaign.stages.${stageId}.name`)
}

export function getStageBlurb(t: Translator, stageId: string): string {
  return t(`campaign.stages.${stageId}.blurb`)
}

function isMissingTranslation(key: string, value: string): boolean {
  return value === key
}

export function getChallengeLabel(t: Translator, levelId: number): string | undefined {
  const key = `campaign.challenges.${levelId}`
  const value = t(key)
  return isMissingTranslation(key, value) ? undefined : value
}

export function getMilestoneTitle(t: Translator, levelId: number): string | undefined {
  const key = `campaign.milestones.${levelId}.title`
  const value = t(key)
  return isMissingTranslation(key, value) ? undefined : value
}

export function getMilestoneMessage(t: Translator, levelId: number): string | undefined {
  const key = `campaign.milestones.${levelId}.message`
  const value = t(key)
  return isMissingTranslation(key, value) ? undefined : value
}

export function getDifficultyLabel(t: Translator, difficulty: Difficulty): string {
  return t(`difficulty.${difficulty}`)
}
