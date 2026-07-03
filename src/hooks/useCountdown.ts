import { useEffect, useState } from 'react'

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSec = Math.ceil(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Re-render cada segundo mientras hay un objetivo futuro. */
export function useCountdownTick(target: Date | null): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!target) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [target?.getTime()])

  return now
}

export function msUntil(target: Date | null, nowMs: number): number {
  if (!target) return 0
  return Math.max(0, target.getTime() - nowMs)
}
