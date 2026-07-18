# Supabase — Nuts & Bolts

Proyecto Supabase **multi-juego** (`games`): tablas con prefijo `nb_` y columna `game_id` para aislar datos por juego.

| Tabla                          | PK                            | Notas                                |
| ------------------------------ | ----------------------------- | ------------------------------------ |
| `nb_player_profiles`           | `(user_id, game_id)`          | Perfil y opt-in ranking              |
| `nb_player_progress`           | `(user_id, game_id)`          | Progreso + ranking + racha (`current_streak`) |
| `nb_leaderboard_events`        | `id`                          | Feed por `game_id` (Prompt 6)        |
| `nb_push_tokens`               | `(user_id, game_id, fcm_token)` | Tokens FCM (Prompt 7)              |
| `nb_notification_preferences`  | `(user_id, game_id)`          | Opt-out push por categoría (on por defecto) |
| `nb_push_log`                  | `id`                          | Rate limit de envíos (Prompt 7–8)    |
| `nb_content_announcements`     | `id`                          | Anuncios para push `new_content` (Prompt 8) |
| `nb_app_releases`              | `(game_id, version_code)`     | Catálogo público versionCode → semver (modal update) |

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
   VITE_FEATURE_LEADERBOARD=true
   VITE_FEATURE_PUSH_NOTIFICATIONS=true
   ```
    30|
## Prompt 6 — Ranking realtime

1. Si el esquema Prompt 1 ya estaba aplicado: ejecutar [schema-prompt6.sql](./schema-prompt6.sql) (añade `last_played_at` + Realtime).
2. Proyecto nuevo: [schema.sql](./schema.sql) ya incluye Realtime y `last_played_at`.
3. `.env.local`: `VITE_FEATURE_LEADERBOARD=true`.
4. Verificar: dos cuentas con opt-in → completar nivel en una → la otra ve el cambio en <3 s.

## Nickname único (v1.5.2)

1. Si el esquema ya estaba aplicado: ejecutar [schema-display-name.sql](./schema-display-name.sql) (backfill `Player_XXXXX`, índice único case-insensitive, trigger actualizado).
2. Proyecto nuevo: [schema.sql](./schema.sql) ya incluye el trigger con default y el índice único.
3. Verificar: cuenta email sin metadata → perfil con `Player_…`; cambiar nick en Ajustes; duplicado / ofensivo rechazado.

## Prompt 7 — Push FCM (ranking)

1. Si el esquema anterior ya estaba aplicado: ejecutar [schema-push.sql](./schema-push.sql).
2. Proyecto nuevo: [schema.sql](./schema.sql) ya incluye tablas push.
3. Si ya tenías push con defaults off: ejecutar [schema-push-opt-out.sql](./schema-push-opt-out.sql) (defaults on).
4. **Firebase Console**
   - Crear/vincular proyecto al package `com.nutsandbolts.puzzle`.
   - Descargar `google-services.json` → `android/app/` (gitignored).
   - Crear Service Account con rol Firebase Cloud Messaging Admin → JSON.
5. **Supabase secrets** (Dashboard → Edge Functions → Secrets, o CLI):
   ```
   supabase secrets set FCM_SERVICE_ACCOUNT="$(cat path/to/service-account.json)"
   ```
6. **Deploy Edge Functions**:
   ```
   supabase functions deploy send-push
   supabase functions deploy on-rank-change
   ```
7. `.env.local`: `VITE_FEATURE_PUSH_NOTIFICATIONS=true`.
8. Verificar en dispositivo real: al iniciar sesión pide permiso → token en `nb_push_tokens`; dos cuentas con opt-in ranking → A sube → B recibe push (si no desactivó notificaciones).
9. **Canales Android** (app ≥ v1.5.1): la app crea `rank_alerts` y `engagement` al registrar FCM. Prueba manual `send-push` con `type: rank_overtaken` y `type: re_engagement` (body JSON en una sola línea en Git Bash/Windows). App cerrada → bandeja del sistema.

## Prompt 8 — Push engagement (v1.5.0)

1. Si Prompt 7 ya estaba aplicado: ejecutar [schema-push-engagement.sql](./schema-push-engagement.sql).
2. Proyecto nuevo: [schema.sql](./schema.sql) ya incluye columnas de engagement, racha y `nb_content_announcements`.
3. **Catálogo de versiones (modal update):** ejecutar [schema-app-releases.sql](./schema-app-releases.sql) si aún no está (lectura pública `nb_app_releases`).
4. **Secrets** (además de `FCM_SERVICE_ACCOUNT`):
   ```
   supabase secrets set CRON_SECRET="genera-un-secreto-largo"
   ```
5. **Deploy Edge Functions**:
   ```
   supabase functions deploy send-push
   supabase functions deploy on-rank-change
   supabase functions deploy cron-inactive-players
   supabase functions deploy cron-daily-streak
   supabase functions deploy cron-weekly-ranking
   supabase functions deploy notify-app-update
   supabase functions deploy notify-new-content
   ```
6. **Schedules** — el plan Free de Supabase no siempre muestra Schedules en el Dashboard.
   Usa el workflow de GitHub Actions [`.github/workflows/push-cron.yml`](../../.github/workflows/push-cron.yml):

   | Función | Cron (UTC) |
   | -------- | ---------- |
   | `cron-inactive-players` | `0 10 * * *` (diario 10:00) |
   | `cron-daily-streak` | `0 18 * * *` (diario 18:00) |
   | `cron-weekly-ranking` | `0 9 * * 1` (lunes 09:00) |

   **Secrets del repo** (Settings → Secrets and variables → Actions):
   - `SUPABASE_URL` — ej. `https://xxxx.supabase.co`
   - `CRON_SECRET` — el mismo valor que en Supabase Edge Function secrets
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → `service_role` (el gateway exige JWT)

   Tras el push a `main`: Actions → **Push engagement crons** → **Run workflow** (prueba manual).
   Headers: `Authorization: Bearer …` + `x-cron-secret` + body `{ "gameId": "nuts-and-bolts" }`.

7. **Tras publicar un AAB** — aviso de nueva versión (manual / GH Action):
   ```bash
   curl -X POST "$SUPABASE_URL/functions/v1/notify-app-update" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "x-cron-secret: $CRON_SECRET" \
     -H "Content-Type: application/json" \
     -d '{"gameId":"nuts-and-bolts","version":"1.5.2","versionCode":9,"title":"Nueva v1.5.2","body":"Aviso de actualización con versiones claras"}'
   ```
   Incluye `versionCode` para upsert en `nb_app_releases` (el modal in-app lo usa si Play no manda el nombre).
   Si aún no aplicaste el esquema: ejecutar [schema-app-releases.sql](./schema-app-releases.sql).

8. **Nuevo contenido** — insertar fila en `nb_content_announcements` y llamar:
   ```bash
   curl -X POST "$SUPABASE_URL/functions/v1/notify-new-content" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "x-cron-secret: $CRON_SECRET" \
     -H "Content-Type: application/json" \
     -d '{"gameId":"nuts-and-bolts"}'
   ```

9. **Rate limits** (en `send-push`): ranking `rank_overtaken` máx. 3/día; resto engagement máx. 2/semana + ventanas por tipo.

10. **Play Console → Seguridad de los datos** (manual al release): confirmar identificadores de dispositivo (FCM token), actividad en la app si aplica, y que las notificaciones se pueden desactivar (opt-out; permiso del sistema requerido).

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
