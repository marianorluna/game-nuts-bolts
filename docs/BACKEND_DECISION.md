# Decisión de backend — funciones sociales

Registro de la decisión de infraestructura para cuenta de jugador, sync en nube y ranking en tiempo real.

**Estado:** ✅ Decidido — **Supabase**

**Fecha:** 2026-07-01

**Roadmap:** [SOCIAL_FEATURES_ROADMAP.md](./SOCIAL_FEATURES_ROADMAP.md)

---

## Contexto

Nuts & Bolts es hoy una app 100% cliente (React + Capacitor Android). El progreso vive en `localStorage` vía Zustand. Para ranking competitivo y backup entre dispositivos necesitamos:

- Base de datos (progreso, perfiles, eventos)
- Autenticación (Google en Android)
- WebSockets / realtime (ranking en vivo, v1.3.0)

---

## Opciones evaluadas

### Supabase ✅ Elegida

| Pros | Contras |
|------|---------|
| Auth + PostgreSQL + Realtime en un solo servicio | Vendor lock-in medio (mitigado con capa infrastructure) |
| Google OAuth muy documentado para web y móvil | Coste si crece mucho (free tier suele bastar para beta) |
| RLS nativo en PostgreSQL | Cuenta/proyecto nuevo que mantener |
| Comunidad y ejemplos enormes | |
| Encaja con ir por prompts incrementales | |

### InsForge (proyecto nuevo)

| Pros | Contras |
|------|---------|
| MCP en Cursor | Instancia actual (`insforge.arqfi.com`) es **otro proyecto** (restaurant) |
| API similar a Supabase | Ecosistema más pequeño |
| Realtime incluido | OAuth no configurado aún |

**Descartado para este juego:** la instancia existente mezcla tablas `restaurant_*`. Haría falta proyecto nuevo; funcionalmente equivalente a Supabase con menos documentación.

### PostgreSQL + Coolify (VPS propio)

| Pros | Contras |
|------|---------|
| Control total, sin SaaS | Días/semanas montar auth, API, WebSockets |
| Coste fijo del VPS | Mantenimiento: backups, SSL, parches, uptime |
| SQL estándar, lock-in bajo | Más prompts y más riesgo para un equipo pequeño |

**Descartado por ahora:** demasiado overhead para ~20 beta y primera versión social. Reevaluable si el juego escala mucho.

---

## Consecuencias de la decisión

1. **Proyecto Supabase compartido** (`games`) con tablas prefijadas `nb_` y columna `game_id` (`nuts-and-bolts` para este juego).
2. **SDK solo en** `src/infrastructure/supabase/` — el dominio no importa `@supabase/supabase-js`.
3. **Variables de entorno** (Prompt 1):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_GAME_ID=nuts-and-bolts
   VITE_FEATURE_CLOUD_SYNC=true
   VITE_FEATURE_LEADERBOARD=false   # true en v1.3.0 (Prompt 6)
   ```
4. **Migración futura** a VPS: reimplementar `src/infrastructure/supabase/` como `rest/` sin tocar dominio ni UI.

---

## Esquema previsto (PostgreSQL)

Se crea en **Prompt 1**. Tablas:

| Tabla | Propósito |
|-------|-----------|
| `nb_player_profiles` | Nombre, avatar, opt-in ranking — PK `(user_id, game_id)` |
| `nb_player_progress` | Snapshot de `PlayerProgress` + columnas de ranking (ver [RANKING_RULES.md](./RANKING_RULES.md)) |
| `nb_leaderboard_events` | Feed de eventos por `game_id` (Prompt 6) |

RLS: cada usuario escribe solo su fila; lectura pública del ranking solo si `show_in_leaderboard = true` en el mismo `game_id`.

---

## Autenticación (Supabase Auth)

**Sí: todo el auth pasa por Supabase Auth.** No montamos login propio ni otro proveedor de identidad.

### Proveedores por versión

| Proveedor | v1.2.0 (Prompt 4) | v1.3.0+ | Notas |
|-----------|-----------------|-------|-------|
| **Google** | ✅ Principal | ✅ | Un toque en Android; nombre y avatar automáticos para el ranking |
| **Email + contraseña** | ✅ Secundario | ✅ | Para quien no quiera usar Google; registro con correo |
| **Facebook** | ❌ No | 🔜 Solo si hay demanda (v1.4+) | Requiere app en Meta Developers, revisión y mantenimiento extra |
| **Apple** | ❌ No | 🔜 Si publicas en iOS | Obligatorio en App Store si ofreces otros OAuth; hoy solo Android |

### Por qué Google primero

- La app está en **Google Play**; la mayoría de jugadores ya tienen cuenta Google en el móvil.
- Supabase + Capacitor tienen flujos documentados para OAuth en WebView.
- Menos fricción que email (sin verificar correo, sin recordar contraseña).
- El ranking puede mostrar nombre/foto del perfil Google sin pedir datos extra.

### Por qué email como alternativa (no sustituto)

- Algunos usuarios no quieren vincular Google.
- Útil en web (`npm run dev`) para pruebas sin OAuth.
- Supabase envía verificación de correo (configurable en dashboard).
- Más pasos para el usuario → botón secundario en la UI, no el principal.

### Por qué Facebook no en v1

- Crear y mantener app en [Meta for Developers](https://developers.facebook.com/).
- Políticas y revisión de Meta para login social.
- En un puzzle Android pequeño, Google + email cubren casi todos los casos.
- Se puede añadir después activando el provider en Supabase sin cambiar el dominio del juego.

### Flujo de usuario previsto (Prompt 4)

```
┌─────────────────────────────────────┐
│  Vincula tu progreso (opcional)     │
│                                     │
│  [  Continuar con Google  ]  ← principal
│                                     │
│  [  Usar correo electrónico  ]      │
│                                     │
│  Seguir sin cuenta → jugar offline  │
└─────────────────────────────────────┘
```

- **Sin cuenta:** el juego funciona igual que hoy; no hay ranking público ni backup en nube.
- **Con cuenta:** merge del progreso local → Supabase; sesión restaurada al abrir la app.

### Configuración técnica (cuándo se hace)

| Tarea | Prompt |
|-------|--------|
| Activar Email provider en Supabase Dashboard | Prompt 1 |
| Activar Google provider + Client ID/Secret (Google Cloud Console) | Prompt 1 o 4 |
| Deep link Android para OAuth (`com.nutsandbolts.puzzle://`) | Prompt 4 |
| `AuthModal` + `signInWithOAuth({ provider: 'google' })` | Prompt 4 |
| Formulario email/contraseña (`signUp` / `signInWithPassword`) | Prompt 4 |

### Privacidad y ranking

- Tener cuenta **no** implica aparecer en el ranking.
- Toggle `show_in_leaderboard` (default **off**) en perfil — Prompt 6.
- Solo se expone `display_name` y avatar; nunca el email en el ranking.

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-07-01 | Documento creado. Elección: Supabase. |
| 2026-07-01 | Sección Auth: Google principal, email secundario, Facebook fuera de v1. |
