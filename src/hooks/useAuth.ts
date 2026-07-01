import { useCallback, useEffect, useState } from 'react'
import type { AuthUser } from '../infrastructure/contracts/AuthRepository'
import {
  getCurrentAuthUser,
  getRegisteredInfrastructure,
  isAuthSessionInitialized,
  isCloudSyncEnabled,
} from '../infrastructure'

export interface UseAuthResult {
  cloudSyncEnabled: boolean
  user: AuthUser | null
  initialized: boolean
  busy: boolean
  error: string | null
  clearError: () => void
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUpWithPassword: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthResult {
  const cloudSyncEnabled = isCloudSyncEnabled()
  const infra = getRegisteredInfrastructure()

  const [user, setUser] = useState<AuthUser | null>(() => getCurrentAuthUser())
  const [initialized, setInitialized] = useState(() => isAuthSessionInitialized())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!infra) return

    const unsub = infra.auth.onAuthStateChange((nextUser) => {
      setUser(nextUser)
      setInitialized(true)
      if (nextUser) setBusy(false)
    })

    if (!initialized) {
      void infra.auth.getSession().then((sessionUser) => {
        setUser(sessionUser)
        setInitialized(true)
      })
    }

    return unsub
  }, [infra, initialized])

  const clearError = useCallback(() => setError(null), [])

  const runAuthAction = useCallback(
    async (action: () => Promise<void>) => {
      if (!infra) return
      setBusy(true)
      setError(null)
      try {
        await action()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error de autenticación'
        setError(message)
        setBusy(false)
      }
    },
    [infra],
  )

  const signInWithGoogle = useCallback(
    () =>
      runAuthAction(async () => {
        if (!infra) return
        await infra.auth.signInWithGoogle()
      }),
    [infra, runAuthAction],
  )

  const signInWithPassword = useCallback(
    (email: string, password: string) =>
      runAuthAction(async () => {
        if (!infra) return
        await infra.auth.signInWithPassword(email, password)
      }),
    [infra, runAuthAction],
  )

  const signUpWithPassword = useCallback(
    (email: string, password: string) =>
      runAuthAction(async () => {
        if (!infra) return
        await infra.auth.signUpWithPassword(email, password)
      }),
    [infra, runAuthAction],
  )

  const signOut = useCallback(
    () =>
      runAuthAction(async () => {
        if (!infra) return
        await infra.auth.signOut()
        setBusy(false)
      }),
    [infra, runAuthAction],
  )

  return {
    cloudSyncEnabled,
    user,
    initialized,
    busy,
    error,
    clearError,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  }
}
