import type { AuthRepository } from './contracts/AuthRepository'
import type { ProgressRepository } from './contracts/ProgressRepository'
import { isCloudSyncEnabled } from './config'
import { registerInfrastructure } from './runtime'
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

  const infra: Infrastructure = {
    auth: createSupabaseAuthRepository(),
    progress: createSupabaseProgressRepository(),
  }
  registerInfrastructure(infra)
  return infra
}

export { isCloudSyncEnabled } from './config'
export { getRegisteredInfrastructure, registerInfrastructure } from './runtime'
export { getOAuthRedirectUrl, OAUTH_REDIRECT_SCHEME, initOAuthHandlers } from './oauth'
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
