import type { User } from '@supabase/supabase-js'
import type { AuthRepository, AuthUser } from '../contracts/AuthRepository'
import { getSupabaseClient } from './client'

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      (typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : null)
      ?? (typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : null),
  }
}

export function createSupabaseAuthRepository(): AuthRepository {
  const supabase = getSupabaseClient()

  return {
    async getSession() {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return data.session?.user ? mapUser(data.session.user) : null
    },

    onAuthStateChange(listener) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        listener(session?.user ? mapUser(session.user) : null)
      })
      return () => {
        data.subscription.unsubscribe()
      }
    },

    async signInWithPassword(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      if (!data.user) throw new Error('Inicio de sesión sin usuario')
      return mapUser(data.user)
    },

    async signUpWithPassword(email, password) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      if (!data.user) throw new Error('Registro sin usuario')
      return mapUser(data.user)
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  }
}
