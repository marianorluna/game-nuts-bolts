import type { AuthRepository } from './contracts/AuthRepository'
import type { ProgressRepository } from './contracts/ProgressRepository'
import { isCloudSyncEnabled } from './config'
import {
  createSupabaseAuthRepository,
  createSupabaseProgressRepository,
} from './supabase'

export interface Infrastructure {
  auth: AuthRepository
  progress: ProgressRepository
}

export function createInfrastructure(): Infrastructure | null {
  if (!isCloudSyncEnabled()) return null

  return {
    auth: createSupabaseAuthRepository(),
    progress: createSupabaseProgressRepository(),
  }
}

export { isCloudSyncEnabled } from './config'
export {
  bindAuthStateListener,
  getCurrentAuthUser,
  isAuthSessionInitialized,
  restoreAuthSession,
} from './authSession'
export type { AuthRepository, AuthUser } from './contracts/AuthRepository'
export type {
  ProgressRepository,
  RemotePlayerProgress,
  UpsertProgressOptions,
} from './contracts/ProgressRepository'
