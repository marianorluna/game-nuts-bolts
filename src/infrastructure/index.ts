import type { AuthRepository } from './contracts/AuthRepository'
import type { ProgressRepository } from './contracts/ProgressRepository'
import type { LeaderboardRepository } from './contracts/LeaderboardRepository'
import type { PushRepository } from './contracts/PushRepository'
import {
  isCloudSyncEnabled,
  isLeaderboardEnabled,
  isPushNotificationsEnabled,
} from './config'
import { registerInfrastructure } from './runtime'
import {
  createSupabaseAuthRepository,
  createSupabaseProgressRepository,
  createSupabaseLeaderboardRepository,
  createSupabasePushRepository,
} from './supabase'

export interface Infrastructure {
  auth: AuthRepository
  progress: ProgressRepository
  leaderboard: LeaderboardRepository | null
  push: PushRepository | null
}

export function createInfrastructure(): Infrastructure | null {
  if (!isCloudSyncEnabled()) return null

  const infra: Infrastructure = {
    auth: createSupabaseAuthRepository(),
    progress: createSupabaseProgressRepository(),
    leaderboard: isLeaderboardEnabled()
      ? createSupabaseLeaderboardRepository()
      : null,
    push: isPushNotificationsEnabled()
      ? createSupabasePushRepository()
      : null,
  }
  registerInfrastructure(infra)
  return infra
}

export {
  isCloudSyncEnabled,
  isLeaderboardEnabled,
  isPushNotificationsEnabled,
} from './config'
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
export type {
  PushRepository,
  NotificationPreferences,
  PushPlatform,
} from './contracts/PushRepository'
