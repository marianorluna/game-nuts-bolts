import type { AuthRepository, AuthUser } from './contracts/AuthRepository'

let currentUser: AuthUser | null = null
let sessionInitialized = false

export function getCurrentAuthUser(): AuthUser | null {
  return currentUser
}

export function isAuthSessionInitialized(): boolean {
  return sessionInitialized
}

/**
 * Restaura la sesión persistida al arranque (sin UI).
 * Idempotente: solo la primera llamada hace getSession.
 */
export async function restoreAuthSession(
  auth: AuthRepository,
): Promise<AuthUser | null> {
  if (sessionInitialized) return currentUser

  currentUser = await auth.getSession()
  sessionInitialized = true
  return currentUser
}

export function bindAuthStateListener(auth: AuthRepository): () => void {
  return auth.onAuthStateChange((user) => {
    currentUser = user
    sessionInitialized = true
  })
}
