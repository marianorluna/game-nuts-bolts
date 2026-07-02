export interface AuthUser {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
}

export interface AuthRepository {
  getSession(): Promise<AuthUser | null>
  onAuthStateChange(listener: (user: AuthUser | null) => void): () => void
  signInWithGoogle(): Promise<void>
  signInWithPassword(email: string, password: string): Promise<AuthUser>
  signUpWithPassword(email: string, password: string): Promise<AuthUser>
  signOut(): Promise<void>
}
