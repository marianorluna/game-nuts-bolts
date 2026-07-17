/**
 * Pure rate-limit evaluation (mirrors supabase/functions/_shared/pushRateLimit.ts).
 */
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS

export const RANK_OVERTAKEN_TYPE = 'rank_overtaken'
export const ENGAGEMENT_WEEKLY_CAP = 2
export const RANK_DAILY_CAP = 3

export type PushRateCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'rate_limited' }

export function isOncePerType(type: string): boolean {
  return (
    type.startsWith('app_updates')
    || type.startsWith('new_content')
    || type.startsWith('milestone_')
  )
}

export function getTypeWindowMs(type: string): number | null {
  if (type === RANK_OVERTAKEN_TYPE) return DAY_MS
  if (type === 're_engagement') return 3 * DAY_MS
  if (type === 'daily_streak') return DAY_MS
  if (type === 'weekly_summary') return WEEK_MS
  if (type === 'sync_reminder') return 2 * DAY_MS
  return null
}

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
