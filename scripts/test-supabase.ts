/**
 * Verificación Prompt 2 — login + upsert de progreso en Supabase.
 *
 * Uso:
 *   npm run test:supabase -- email@ejemplo.com contraseña
 *
 * Requiere .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { PlayerProgress } from '../src/domain/types'
import {
  buildMovesTiebreakKey,
  deriveRankingStats,
} from '../src/domain/progress'

const GAME_ID = process.env.VITE_GAME_ID ?? 'nuts-and-bolts'
const PROGRESS_TABLE = 'nb_player_progress'

function loadEnvLocal(): void {
  const path = resolve(process.cwd(), '.env.local')
  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvLocal()

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const email = process.argv[2]
const password = process.argv[3]

if (!url || !anonKey) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local')
  process.exit(1)
}

if (!email || !password) {
  console.error('Uso: npm run test:supabase -- email@ejemplo.com contraseña')
  process.exit(1)
}

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const testProgress: PlayerProgress = {
  unlockedLevel: 3,
  levels: {
    1: { stars: 3, bestMoves: 12, completed: true },
    2: { stars: 2, bestMoves: 18, completed: true },
  },
}

async function main(): Promise<void> {
  console.log('→ Iniciando sesión…')
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password })

  let userId = signInData.user?.id

  if (signInError) {
    console.log('  Login falló, intentando registro…', signInError.message)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })
    if (signUpError) throw signUpError
    userId = signUpData.user?.id
    if (!userId) {
      throw new Error(
        'Registro OK pero sin sesión (¿confirmación de email activa en Supabase?)',
      )
    }
  }

  if (!userId) throw new Error('No se obtuvo user id')

  console.log('✓ Sesión:', userId)

  const stats = deriveRankingStats(testProgress)
  const row = {
    user_id: userId,
    game_id: GAME_ID,
    unlocked_level: testProgress.unlockedLevel,
    levels: testProgress.levels,
    completed_levels: stats.completedLevels,
    total_stars: stats.totalStars,
    weighted_tier_points: stats.weightedTierPoints,
    moves_tiebreak_key: buildMovesTiebreakKey(testProgress),
    total_best_moves: stats.totalBestMoves,
    rank_snapshot_at: new Date().toISOString(),
  }

  console.log('→ Upsert en', PROGRESS_TABLE, '…')
  const { error: upsertError } = await supabase
    .from(PROGRESS_TABLE)
    .upsert(row, { onConflict: 'user_id,game_id' })

  if (upsertError) throw upsertError
  console.log('✓ Progreso guardado')

  const { data: fetched, error: fetchError } = await supabase
    .from(PROGRESS_TABLE)
    .select('unlocked_level, completed_levels, total_stars, levels')
    .eq('user_id', userId)
    .eq('game_id', GAME_ID)
    .single()

  if (fetchError) throw fetchError

  console.log('✓ Lectura verificada:', {
    unlocked_level: fetched.unlocked_level,
    completed_levels: fetched.completed_levels,
    total_stars: fetched.total_stars,
    levels: fetched.levels,
  })

  await supabase.auth.signOut()
  console.log('✓ Prompt 2 — verificación completada')
}

main().catch((err: unknown) => {
  console.error('✗ Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
