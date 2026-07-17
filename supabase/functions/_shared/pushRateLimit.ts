/** Rate-limit rules for push types (Prompt 7–8). Pure helpers for Edge Functions. */

export type PushRateCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'rate_limited' }

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS

export const RANK_OVERTAKEN_TYPE = 'rank_overtaken'
export const ENGAGEMENT_WEEKLY_CAP = 2
export const RANK_DAILY_CAP = 3

/** Types that count toward the engagement weekly cap (everything except ranking). */
export function isEngagementType(type: string): boolean {
  return type !== RANK_OVERTAKEN_TYPE
}

/**
 * Per-type cooldown / max count windows.
 * Returns null if the type has no dedicated window (only weekly engagement cap applies).
 */
export function getTypeWindowMs(type: string): number | null {
  if (type === RANK_OVERTAKEN_TYPE) return DAY_MS
  if (type === 're_engagement') return 3 * DAY_MS
  if (type === 'daily_streak') return DAY_MS
  if (type === 'weekly_summary') return WEEK_MS
  if (type === 'sync_reminder') return 2 * DAY_MS
  // app_updates_*, new_content_*, milestone_* — once per exact type id
  if (isOncePerType(type)) {
    return null
  }
  return null
}

export function isOncePerType(type: string): boolean {
  return (
    type.startsWith('app_updates')
    || type.startsWith('new_content')
    || type.startsWith('milestone_')
  )
}

export function getRankDailyCap(): number {
  return RANK_DAILY_CAP
}

export function getEngagementWeeklyCap(): number {
  return ENGAGEMENT_WEEKLY_CAP
}

/**
 * Evaluate whether a push of `type` is allowed given recent log timestamps (ISO strings).
 * `sameTypeLogs` — created_at of rows with the same type (newest first or any order).
 * `engagementWeekLogs` — created_at of all engagement types in the last 7 days.
 */
export function evaluatePushRateLimit(input: {
  type: string
  sameTypeLogs: string[]
  engagementWeekLogs: string[]
  nowMs?: number
}): PushRateCheckResult {
  const now = input.nowMs ?? Date.now()

  if (input.type === RANK_OVERTAKEN_TYPE) {
    const since = now - DAY_MS
    const count = input.sameTypeLogs.filter((ts) => Date.parse(ts) >= since).length
    if (count >= RANK_DAILY_CAP) {
      return { allowed: false, reason: 'rate_limited' }
    }
    return { allowed: true }
  }

  if (isOncePerType(input.type)) {
    if (input.sameTypeLogs.length > 0) {
      return { allowed: false, reason: 'rate_limited' }
    }
  } else {
    const windowMs = getTypeWindowMs(input.type)
    if (windowMs != null) {
      const since = now - windowMs
      const recent = input.sameTypeLogs.some((ts) => Date.parse(ts) >= since)
      if (recent) {
        return { allowed: false, reason: 'rate_limited' }
      }
    }
  }

  const weekSince = now - WEEK_MS
  const engagementCount = input.engagementWeekLogs.filter(
    (ts) => Date.parse(ts) >= weekSince,
  ).length
  if (engagementCount >= ENGAGEMENT_WEEKLY_CAP) {
    return { allowed: false, reason: 'rate_limited' }
  }

  return { allowed: true }
}

/** UTC calendar date YYYY-MM-DD */
export function utcDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Compute next streak given previous values and "today" (UTC date string).
 * - Same day → keep streak
 * - Yesterday → streak + 1
 * - Gap / null → 1
 */
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

/** Milestone percent thresholds for campaign completion push. */
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
