import type { AuthRepository } from './contracts/AuthRepository'
import type { ProgressRepository } from './contracts/ProgressRepository'
import type { LeaderboardRepository } from './contracts/LeaderboardRepository'
import { isCloudSyncEnabled, isLeaderboardEnabled } from './config'
import { registerInfrastructure } from './runtime'
import {
  createSupabaseAuthRepository,
  createSupabaseProgressRepository,
  createSupabaseLeaderboardRepository,
} from './supabase'

export interface Infrastructure {
  auth: AuthRepository
  progress: ProgressRepository
  leaderboard: LeaderboardRepository | null
}

export function createInfrastructure(): Infrastructure | null {
  if (!isCloudSyncEnabled()) return null

  const infra: Infrastructure = {
    auth: createSupabaseAuthRepository(),
    progress: createSupabaseProgressRepository(),
    leaderboard: isLeaderboardEnabled()
      ? createSupabaseLeaderboardRepository()
      : null,
  }
  registerInfrastructure(infra)
  return infra
}

export { isCloudSyncEnabled, isLeaderboardEnabled } from './config'
export { getRegisteredInfrastructure, registerInfrastructure } from './runtime'
export {
  completeWebOAuthCallback,
  getOAuthRedirectUrl,
  OAUTH_REDIRECT_SCHEME,
  initOAuthHandlers,
} from './oauth'
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
export type {
  LeaderboardRepository,
  LeaderboardPlayer,
  LeaderboardEvent,
  LeaderboardSnapshot,
  PlayerProfileSettings,
  RankUpPayload,
} from './contracts/LeaderboardRepository'
