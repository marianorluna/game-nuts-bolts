/**
 * Client-side copy of streak/milestone helpers (mirrors Edge shared module).
 * Kept in domain so Vitest can run without Deno imports.
 */
const DAY_MS = 24 * 60 * 60 * 1000

export function utcDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function nextDailyStreak(
  previousStreak: number,
  lastStreakDate: string | null,
  todayUtc: string,
): { currentStreak: number; lastStreakDate: string } {
  if (lastStreakDate === todayUtc) {
    return {
      currentStreak: Math.max(previousStreak, 1),
      lastStreakDate: todayUtc,
    }
  }

  if (lastStreakDate) {
    const last = Date.parse(`${lastStreakDate}T00:00:00.000Z`)
    const today = Date.parse(`${todayUtc}T00:00:00.000Z`)
    const diffDays = Math.round((today - last) / DAY_MS)
    if (diffDays === 1) {
      return {
        currentStreak: Math.max(previousStreak, 0) + 1,
        lastStreakDate: todayUtc,
      }
    }
  }

  return { currentStreak: 1, lastStreakDate: todayUtc }
}

export const MILESTONE_PERCENTS = [50, 80, 100] as const

export function crossedMilestonePercents(
  completedBefore: number,
  completedAfter: number,
  publishedCount: number,
): number[] {
  if (publishedCount <= 0 || completedAfter <= completedBefore) return []
  const crossed: number[] = []
  for (const pct of MILESTONE_PERCENTS) {
    const threshold = Math.ceil((pct / 100) * publishedCount)
    if (completedBefore < threshold && completedAfter >= threshold) {
      crossed.push(pct)
    }
  }
  return crossed
}
