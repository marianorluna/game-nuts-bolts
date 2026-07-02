# Supabase — Nuts & Bolts

Proyecto Supabase **multi-juego** (`games`): tablas con prefijo `nb_` y columna `game_id` para aislar datos por juego.

| Tabla                   | PK                   | Notas                          |
| ----------------------- | -------------------- | ------------------------------ |
| `nb_player_profiles`    | `(user_id, game_id)` | Perfil y opt-in ranking        |
| `nb_player_progress`    | `(user_id, game_id)` | Progreso + columnas de ranking |
| `nb_leaderboard_events` | `id`                 | Feed por `game_id` (Prompt 6)  |

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

## Google OAuth (Prompt 4)

### 1. Google Cloud Console

**Proyecto GCP:** `games-puzzles-play`

1. [Google Cloud Console](https://console.cloud.google.com/) → seleccionar proyecto `games-puzzles-play` → APIs & Services → Credentials.
2. **OAuth 2.0 Client ID** → tipo **Web application** (para Supabase).
3. **Authorized redirect URIs** — añadir la URL de callback de Supabase:
   ```
   https://<PROJECT_REF>.supabase.co/auth/v1/callback
   ```
   (`<PROJECT_REF>` = ID del proyecto en Supabase Dashboard → Settings → General.)
4. Crear otro client **Android** (opcional para validación nativa):
   - Package name: `com.nutsandbolts.puzzle`
   - SHA-1 del keystore de release/debug.

### 2. Supabase Dashboard

1. **Authentication → Providers → Google**: activar y pegar Client ID + Client Secret del client **Web**.
2. **Authentication → URL Configuration → Redirect URLs**, añadir:
   ```
   com.nutsandbolts.puzzle://login-callback
   http://localhost:5173/login-callback
   ```
   (Añade tu dominio de producción si publicas web.)

### 3. App Android

El deep link ya está en `android/app/src/main/AndroidManifest.xml`:

```xml
<data android:scheme="com.nutsandbolts.puzzle" android:host="login-callback" />
```

Tras cambios nativos: `npm run cap:sync`.

### 4. Verificación

1. Jugador con 5+ niveles → modal de vinculación (una vez).
2. Login Google en emulador/dispositivo → vuelve a la app por deep link.
3. Progreso local se fusiona con la nube (merge dominio).
4. Cerrar sesión → progreso local intacto en `localStorage`.
