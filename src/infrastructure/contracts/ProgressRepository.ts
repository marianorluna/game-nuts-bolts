import type { PlayerProgress } from '../../domain/types'

export interface RemotePlayerProgress {
  progress: PlayerProgress
  rankSnapshotAt: string | null
  updatedAt: string
}

export interface UpsertProgressOptions {
  rankSnapshotAt?: string | null
}

export interface ProgressRepository {
  fetch(userId: string): Promise<RemotePlayerProgress | null>
  upsert(
    userId: string,
    progress: PlayerProgress,
    options?: UpsertProgressOptions,
  ): Promise<void>
}
