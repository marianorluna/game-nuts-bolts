import type { AuthUser } from '../infrastructure/contracts/AuthRepository'

export function getUserDisplayInitial(user: AuthUser): string {
  const name = user.displayName?.trim()
  if (name) return name.charAt(0).toUpperCase()

  const email = user.email?.trim()
  if (email) return email.charAt(0).toUpperCase()

  return '?'
}
