/** Enganche para Prompt 7 (push «te superaron» / rank_up). */

export interface RankUpHookPayload {
  userId: string
  previousRank: number
  newRank: number
  displayName: string | null
}

export type RankUpListener = (payload: RankUpHookPayload) => void

const listeners = new Set<RankUpListener>()

export function onRankUp(listener: RankUpListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitRankUp(payload: RankUpHookPayload): void {
  for (const listener of listeners) {
    try {
      listener(payload)
    } catch {
      // Los listeners de push no deben romper el sync
    }
  }
}
