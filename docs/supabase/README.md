# Supabase — Nuts & Bolts

Proyecto Supabase **multi-juego** (`games`): tablas con prefijo `nb_` y columna `game_id` para aislar datos por juego.

| Tabla | PK | Notas |
|-------|-----|-------|
| `nb_player_profiles` | `(user_id, game_id)` | Perfil y opt-in ranking |
| `nb_player_progress` | `(user_id, game_id)` | Progreso + columnas de ranking |
| `nb_leaderboard_events` | `id` | Feed por `game_id` (Prompt 6) |

**game_id de este juego:** `nuts-and-bolts` → `VITE_GAME_ID` en `.env.local`

Otros juegos en el mismo proyecto Supabase pueden usar el mismo patrón (`xy_player_profiles`, etc.) o reutilizar tablas `nb_*` con otro `game_id`.

## Prompt 1 — Configuración inicial

1. Proyecto en [supabase.com](https://supabase.com) (ej. `games`).
2. **Authentication → Providers → Email**: activar.
3. **SQL Editor**: pegar y ejecutar [schema.sql](./schema.sql).
4. **Project Settings → API**: copiar URL + **anon public** key (no es la database password).
5. `.env.local`:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_GAME_ID=nuts-and-bolts
   VITE_FEATURE_CLOUD_SYNC=true
   VITE_FEATURE_LEADERBOARD=false
   ```

## Verificación RLS

Con dos usuarios de prueba (Auth → Users → Add user), mismo `game_id`:

- Usuario A **no** puede `update` la fila `nb_player_progress` de B (403 / 0 rows).
- Usuario con `show_in_leaderboard = false` **no** aparece en lectura pública del ranking.
- Queries de leaderboard **siempre** filtran `game_id = 'nuts-and-bolts'`.

## Google OAuth

Se configura en **Prompt 4** (Google Cloud Console + Supabase Auth → Google).
