export interface AuthUser {
  id: string
  email: string | null
  displayName: string | null
}

export interface AuthRepository {
  getSession(): Promise<AuthUser | null>
  onAuthStateChange(listener: (user: AuthUser | null) => void): () => void
  signInWithPassword(email: string, password: string): Promise<AuthUser>
  signUpWithPassword(email: string, password: string): Promise<AuthUser>
  signOut(): Promise<void>
}
