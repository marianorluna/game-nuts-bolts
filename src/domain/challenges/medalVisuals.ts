import type { ThemeId } from '../types'
import { CHALLENGE_LEVEL_ORDER } from './challengeConstants'

export interface MedalVisual {
  themeId: ThemeId
  ringClass: string
  innerClass: string
  icon: string
}

const MEDAL_VISUALS: Record<number, MedalVisual> = {
  20: {
    themeId: 'workshop',
    ringClass: 'from-amber-400 to-violet-600',
    innerClass: 'bg-violet-950/80',
    icon: '🔧',
  },
  40: {
    themeId: 'garage',
    ringClass: 'from-cyan-300 to-slate-600',
    innerClass: 'bg-slate-900/80',
    icon: '🔩',
  },
  60: {
    themeId: 'garage',
    ringClass: 'from-cyan-400 to-slate-800',
    innerClass: 'bg-slate-950/80',
    icon: '🔒',
  },
  80: {
    themeId: 'factory',
    ringClass: 'from-lime-300 to-amber-700',
    innerClass: 'bg-stone-900/80',
    icon: '⚙️',
  },
  100: {
    themeId: 'workshop',
    ringClass: 'from-yellow-300 to-amber-600',
    innerClass: 'bg-amber-950/80',
    icon: '⭐',
  },
  120: {
    themeId: 'hardware',
    ringClass: 'from-orange-300 to-amber-700',
    innerClass: 'bg-stone-900/80',
    icon: '🛒',
  },
  140: {
    themeId: 'hardware',
    ringClass: 'from-orange-400 to-amber-800',
    innerClass: 'bg-stone-950/80',
    icon: '📏',
  },
  160: {
    themeId: 'hardware',
    ringClass: 'from-amber-300 to-orange-700',
    innerClass: 'bg-stone-900/80',
    icon: '🔧',
  },
  180: {
    themeId: 'hardware',
    ringClass: 'from-lime-300 to-amber-700',
    innerClass: 'bg-stone-950/80',
    icon: '🎯',
  },
  200: {
    themeId: 'hardware',
    ringClass: 'from-yellow-300 to-orange-600',
    innerClass: 'bg-amber-950/80',
    icon: '🏅',
  },
}

export function getMedalVisual(levelId: number): MedalVisual {
  return MEDAL_VISUALS[levelId] ?? MEDAL_VISUALS[20]!
}

export function getMedalLevelIds(): readonly number[] {
  return CHALLENGE_LEVEL_ORDER
}
