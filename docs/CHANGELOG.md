# Changelog — Nuts & Bolts

Historial de **releases de la app** (semver + `versionCode`).

**Fuente de verdad:** `src/data/release-notes.json` — el modal «Novedades» y este archivo se generan desde ahí.

**Documentos relacionados:** [CONTENT_CHANGELOG.md](./CONTENT_CHANGELOG.md) (solo contenido/niveles) · [SOCIAL_FEATURES_ROADMAP.md](./SOCIAL_FEATURES_ROADMAP.md)

## Comandos

| Comando | Descripción |
| ------- | ----------- |
| `npm run changelog:sync` | Regenera este archivo desde `release-notes.json` |
| `npm run changelog:check` | Verifica que `package.json` tenga entrada publicada |
| `npm run changelog:scaffold` | Crea plantilla para la versión actual si falta |
| `npm run release:prepare` | check + sync + sync Android version |

### Flujo antes de publicar en Play Store

1. Sube `version` y `versionCode` en `package.json`
2. `npm run changelog:scaffold` (si la versión nueva no existe aún)
3. Edita `src/data/release-notes.json` — `highlights`, secciones y `published: true`
4. `npm run release:prepare`
5. Copia `playStoreNotes` (ES/EN) de [CHANGELOG.md](./CHANGELOG.md) a las notas de la versión en Play Console

---

## [Unreleased] — Planificado

### v1.3.0 (versionCode 5) — Ranking global

### Previsto

**ES**

- Ranking global en tiempo real
- Opt-in para aparecer en la tabla (desactivado por defecto)
- Tu posición en la pantalla de inicio

**EN**

- Real-time global leaderboard
- Opt-in to appear on the table (off by default)
- Your rank on the home screen

### Añadido

**ES**

- LeaderboardScreen con top jugadores
- Feed de eventos recientes
- Supabase Realtime

**EN**

- LeaderboardScreen with top players
- Recent events feed
- Supabase Realtime

### v1.3.1 (versionCode 6) — Notificaciones de ranking

### Previsto

**ES**

- Aviso push cuando otro jugador te supera en el ranking
- Notificaciones nativas de Android (opt-in)

**EN**

- Push alert when another player overtakes you on the leaderboard
- Native Android notifications (opt-in)

### v1.4.0 (versionCode 7) — Notificaciones y recordatorios

### Previsto

**ES**

- Recordatorio si llevas días sin jugar
- Aviso de nueva versión y contenido
- Preferencias granulares en Configuración

**EN**

- Reminder if you have not played in a few days
- New version and content alerts
- Granular preferences in Settings

---

## [1.2.1] — 2026-07-03 — Cuenta en la nube y retos con medallas / Cloud save and challenge medals

**versionCode:** 4

> **Play Store:** publicación única en esta versión. Incluye v1.2.0 (versionCode 3) — no publicadas por separado en Play.

### Destacado (modal in-app)

**ES**

- Vincula tu progreso con Google o correo — totalmente opcional
- Tu avance se guarda en la nube al completar niveles
- Si ya jugaste sin cuenta, tu progreso local se conserva al vincular
- Los retos (niveles 20, 40, 60, 80 y 100) tienen reglas propias de examen
- Medallas coleccionables y medallero en inicio y campaña
- 3 intentos por reto; recuperas 1 cada 8 horas (máx. 3 en reserva)
- Juega sin conexión; la sincronización ocurre al volver a tener red

**EN**

- Link your progress with Google or email — completely optional
- Your progress is saved to the cloud when you complete levels
- If you played without an account, your local progress is kept when you link
- Challenges (levels 20, 40, 60, 80 and 100) now play as stage exams
- Collectible medals and medal gallery on home and campaign screens
- 3 attempts per challenge; regain 1 every 8 hours (max 3 banked)
- Play offline; sync happens when you're back online

### Notas Play Console (copiar y pegar)

**ES**

- Cuenta opcional con Google o correo — guarda tu progreso en la nube
- Juega sin conexión; sincronización automática al volver a tener red
- Retos en niveles 20, 40, 60, 80 y 100 con reglas de examen
- Medallas coleccionables y medallero en inicio y campaña
- 3 intentos por reto; recuperas 1 cada 8 horas
- Con 1–2 estrellas avanzas; con 3 superas el reto y ganas la medalla
- Sin deshacer en retos hasta superarlos con 3 estrellas

**EN**

- Optional account with Google or email — save your progress to the cloud
- Play offline; automatic sync when you're back online
- Challenges on levels 20, 40, 60, 80 and 100 with exam-style rules
- Collectible medals and medal gallery on home and campaign screens
- 3 attempts per challenge; regain 1 every 8 hours
- 1–2 stars unlock the next level; 3 stars beat the challenge and earn the medal
- No undo on challenges until you beat them with 3 stars

### Añadido

**ES**

- Cuenta opcional con Google OAuth y correo + contraseña
- Sincronización de progreso vía Supabase (offline-first)
- Merge automático local ↔ nube al iniciar sesión
- Modal para vincular progreso tras el nivel 5
- Sección Cuenta en Configuración
- Modo reto: intentos, regeneración 8 h, sin deshacer
- Medallero con 5 medallas temáticas por etapa
- Modal tutorial al primer reto (nivel 20)
- Icono ✓ verde al superar un reto con 3 estrellas
- Migración automática de progreso en retos ya completados

**EN**

- Optional account with Google OAuth and email + password
- Progress sync via Supabase (offline-first)
- Automatic local ↔ cloud merge on sign-in
- Link-progress prompt after level 5
- Account section in Settings
- Challenge mode: attempts, 8 h regen, no undo
- Medal gallery with 5 stage-themed medals
- Tutorial modal on first challenge (level 20)
- Green ✓ icon when a challenge is beaten with 3 stars
- Automatic migration for already-completed challenges

### Compatibilidad

**ES**

- Sin cuenta: el juego funciona igual que antes
- Los saves locales existentes no se pierden al actualizar ni al vincular
- Retos ya completados con 3★ quedan como superados con medalla
- Con 1–2★ conservas el desbloqueo y puedes perseguir la medalla
- El progreso de retos se sincroniza al vincular cuenta

**EN**

- Without an account: the game works exactly as before
- Existing local saves are not lost when updating or linking an account
- Challenges already cleared with 3★ count as mastered with medal
- With 1–2★ you keep unlock progress and can still chase the medal
- Challenge progress syncs when you link an account

---

## [1.1.0] — 2026-06-26 — 100 niveles y nuevas mecánicas / 100 levels and new mechanics

**versionCode:** 2

### Destacado (modal in-app)

**ES**

- Campaña ampliada a 100 niveles en tres etapas del taller
- Nuevas mecánicas: tuercas en bloque y bulones bloqueados
- Interfaz por etapas con temas visuales (taller, garaje, fábrica)
- Aviso de actualización disponible en Play Store
- Soporte en español e inglés

**EN**

- Campaign expanded to 100 levels across three workshop stages
- New mechanics: block nuts and locked bolts
- Stage-based UI with visual themes (workshop, garage, factory)
- In-app notice when a Play Store update is available
- Spanish and English support

### Añadido

**ES**

- Niveles 31–100 (etapas «El garaje apretado» y «La línea de montaje»)
- Mecánica multiNut (movimiento en bloque)
- Mecánica lockedBolt (bulones bloqueados)
- Coach marks para nuevas mecánicas
- Plugin @capawesome/capacitor-app-update
- i18n ES / EN

**EN**

- Levels 31–100 (stages «The cramped garage» and «The assembly line»)
- multiNut mechanic (block movement)
- lockedBolt mechanic (locked bolts)
- Coach marks for new mechanics
- @capawesome/capacitor-app-update plugin
- ES / EN i18n

### Cambiado

**ES**

- Nomenclatura jugable del taller (Aprendiz de banco, Caja de herramientas, etc.)

**EN**

- Playable workshop naming (Apprentice bench, Toolbox, etc.)

### Compatibilidad

**ES**

- Saves existentes sin migración; unlockedLevel conservado

**EN**

- Existing saves without migration; unlockedLevel preserved

---

## [1.0.0] — 2026-06-16 — Lanzamiento inicial / Initial release

**versionCode:** 1

### Destacado (modal in-app)

**ES**

- 30 niveles de puzzle con dificultad progresiva
- Ordena tuercas por color entre bulones
- Progreso con estrellas y desbloqueo lineal
- 100 % offline — sin cuenta ni conexión necesaria

**EN**

- 30 puzzle levels with progressive difficulty
- Sort nuts by color across bolts
- Progress with stars and linear unlock
- 100% offline — no account or connection required

### Añadido

**ES**

- 30 niveles (fácil, medio, difícil)
- Motor de puzzle y validación de solvabilidad
- Progreso en localStorage
- Onboarding de movimientos
- Publicación en Google Play

**EN**

- 30 levels (easy, medium, hard)
- Puzzle engine and solvability validation
- localStorage progress
- Moves onboarding
- Google Play release

---
