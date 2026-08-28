# Changelog — Nuts & Bolts

Historial de **releases de la app** (semver + `versionCode`).

**Fuente de verdad:** `src/data/release-notes.json` — el modal «Novedades» usa `userSummary`; este archivo y Play Store usan `highlights`.

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
3. Edita `src/data/release-notes.json` — `userSummary` (modal), `highlights`, secciones y `published: true`
4. `npm run release:prepare`
5. Copia `playStoreNotes` (ES/EN) de [CHANGELOG.md](./CHANGELOG.md) a las notas de la versión en Play Console

---

## [Unreleased] — Planificado

### v1.3.0 (versionCode 5) — Ranking global en vivo

### Previsto

**ES**

- Ranking global con actualizaciones en tiempo real
- Aparece en el ranking solo si lo activas (privado por defecto)
- Tu posición en el inicio y feed de actividad reciente
- Sigue funcionando sin red con el último ranking guardado

**EN**

- Global leaderboard with real-time updates
- Appear on the ranking only if you opt in (private by default)
- Your position on Home plus a recent activity feed
- Works offline with the last cached ranking

### Añadido

**ES**

- Pantalla de ranking con top jugadores y posición propia
- Toggle «Aparecer en el ranking» (default off)
- Supabase Realtime en progreso y eventos
- Feed de eventos (nivel, subida de puesto, opt-in)
- Columna last_played_at para re-engagement futuro
- Hook rank_up preparado para notificaciones push

**EN**

- Leaderboard screen with top players and your own rank
- «Appear on the leaderboard» toggle (default off)
- Supabase Realtime on progress and events
- Event feed (level, rank up, opt-in)
- last_played_at column for future re-engagement
- rank_up hook ready for push notifications

### v1.4.0 (versionCode 6) — Notificaciones de ranking

### Previsto

**ES**

- Aviso push cuando otro jugador te supera en el ranking
- Notificaciones nativas de Android (opt-in)

**EN**

- Push alert when another player overtakes you on the leaderboard
- Native Android notifications (opt-in)

### Añadido

**ES**

- Infraestructura FCM + Capacitor + Supabase Edge Functions
- Preferencias de notificaciones en Configuración
- Push «te superaron» con rate limit 3/día

**EN**

- FCM + Capacitor + Supabase Edge Functions infrastructure
- Notification preferences in Settings
- «Overtaken» push with 3/day rate limit

### v1.7.0 (versionCode 12) — Audio y música ambiente

### Previsto

**ES**

- Música de fondo opcional en menú y partida
- Sonidos y música se configuran por separado en Ajustes
- Nuevos efectos: bulones bloqueados, bloques, estrellas y más

**EN**

- Optional background music in menu and during levels
- Sound effects and music can be toggled separately in Settings
- New effects: locked bolts, nut blocks, stars, and more

### v1.7.1 (versionCode 13) — Ambiente por etapa

### Previsto

**ES**

- Música distinta para cada etapa del taller
- Control de volumen de música y efectos
- Sonidos al sincronizar tu progreso en la nube

**EN**

- Different music for each workshop stage
- Music and sound effect volume controls
- Sounds when syncing your cloud progress

---

## [1.6.0] — 2026-08-28 — El mostrador de ferretería / The hardware counter

**versionCode:** 11

### Modal in-app (resumen jugador)

- 100 niveles, 3 etapas

### Destacado (Play Store / changelog)

**ES**

- 100 niveles nuevos (101–200): la Sección 2 del taller
- Dos mecánicas nuevas: bulones de distinta altura y pedidos de color fijo
- 5 retos nuevos con medallas coleccionables (120, 140, 160, 180, 200)
- Tema visual de ferretería en tres etapas nuevas
- Tu progreso y estrellas de niveles 1–100 se conservan

**EN**

- 100 new levels (101–200): Section 2 of the workshop
- Two new mechanics: bolts of different heights and fixed-color orders
- 5 new challenges with collectible medals (120, 140, 160, 180, 200)
- Hardware-store visual theme across three new stages
- Your progress and stars for levels 1–100 are preserved

### Notas Play Console (copiar y pegar)

**ES**

- 100 niveles nuevos: el mostrador de ferretería (101–200)
- Bulones de distinta altura y pedidos de color fijo
- 5 retos nuevos con medallas (120, 140, 160, 180, 200)
- Sin perder progreso ni estrellas de niveles anteriores

**EN**

- 100 new levels: the hardware counter (101–200)
- Variable-height bolts and fixed-color orders
- 5 new challenges with medals (120, 140, 160, 180, 200)
- No loss of progress or stars from earlier levels

### Añadido

**ES**

- Sección 2: El mostrador de ferretería (niveles 101–200)
- Mecánica variableCapacity: bulones con altura 3, 4 o 5
- Mecánica fixedColorBolt: bulones que solo aceptan un color
- Etapas 4–6 con tema hardware y coach marks en niveles 131 y 166
- Retos 120, 140, 160, 180 y 200 con medallas en el medallero
- Modal de fin de contenido actualizado al nivel 200

**EN**

- Section 2: The hardware counter (levels 101–200)
- variableCapacity mechanic: bolts with height 3, 4, or 5
- fixedColorBolt mechanic: bolts that only accept one color
- Stages 4–6 with hardware theme and coach marks at levels 131 and 166
- Challenges 120, 140, 160, 180 and 200 with medals in the gallery
- End-of-content modal updated for level 200

### Compatibilidad

**ES**

- Layouts de niveles 1–100 sin cambios (checksum de hornado)
- Saves existentes conservan unlockedLevel y estrellas
- Jugadores que completaron el nivel 100 ven el nuevo fin de contenido al llegar al 200

**EN**

- Level layouts 1–100 unchanged (bake checksum)
- Existing saves keep unlockedLevel and stars
- Players who finished level 100 see the updated end-of-content at level 200

---

## [1.5.3] — 2026-07-22 — Compatibilidad con Android 16 / Android 16 compatibility

**versionCode:** 10

### Destacado (Play Store / changelog)

**ES**

- Compatible con Android 16 (API 36) — requerido por Google Play
- Actualización interna de motor (Capacitor 8) sin cambios en el juego

**EN**

- Compatible with Android 16 (API 36) — required by Google Play
- Internal engine update (Capacitor 8) with no gameplay changes

### Notas Play Console (copiar y pegar)

**ES**

- Actualización de compatibilidad con Android 16 (API 36)
- Sin cambios en el juego ni en las funciones existentes

**EN**

- Compatibility update for Android 16 (API 36)
- No changes to gameplay or existing features

### Cambiado

**ES**

- Motor actualizado a Capacitor 8 para cumplir requisitos de Google Play (targetSdk 36)
- Mínimo Android requerido: Android 7 (API 24), antes Android 6 (API 23)

**EN**

- Engine updated to Capacitor 8 to meet Google Play requirements (targetSdk 36)
- Minimum Android version raised to Android 7 (API 24), previously Android 6 (API 23)

---

## [1.5.2] — 2026-07-18 — Nombre en el ranking y versiones claras / Leaderboard name and clear versions

**versionCode:** 9

### Destacado (Play Store / changelog)

**ES**

- Elige o cambia tu nombre en el ranking desde Ajustes (único, sin ofensas)
- Si no tienes nombre, se asigna uno tipo Player_XXXXX en lugar de «Jugador»
- Los retos pesan más en el ranking (10 pts por estrella) y el listado muestra niveles y estrellas
- El aviso de nueva versión muestra semver (p. ej. v1.5.1 → v1.5.2), no el código interno de Play

**EN**

- Choose or change your leaderboard name in Settings (unique, no offensive words)
- If you have no name, you get a Player_XXXXX nick instead of generic «Player»
- Challenges weigh more on the ranking (10 pts per star) and entries show levels and stars
- The update prompt shows semver (e.g. v1.5.1 → v1.5.2), not Play’s internal version code

### Notas Play Console (copiar y pegar)

**ES**

- Novedad: elige tu nombre en el ranking desde Ajustes
- Mejora: los retos cuentan más en el ranking; el listado muestra niveles y estrellas
- Mejora: el aviso de actualización muestra la versión correctamente

**EN**

- New: choose your leaderboard name in Settings
- Improvement: challenges weigh more on the ranking; entries show levels and stars
- Improvement: the update prompt shows the version correctly

### Añadido

**ES**

- Nombre visible en el ranking editable en Ajustes (único por juego, filtro de palabras ofensivas)
- Nombre provisional Player_XXXXX cuando la cuenta no trae nombre (p. ej. email)

**EN**

- Editable leaderboard display name in Settings (unique per game, offensive-word filter)
- Provisional Player_XXXXX name when the account has no display name (e.g. email)

### Cambiado

**ES**

- Criterio 3 del ranking: niveles reto (20, 40, 60, 80, 100) suman 10 pts por estrella (30/20/10); normales siguen en 3/2/1
- Cada entrada del ranking muestra niveles completados y estrellas totales (antes solo niveles)

**EN**

- Ranking criterion 3: challenge levels (20, 40, 60, 80, 100) score 10 pts per star (30/20/10); normal levels stay at 3/2/1
- Each leaderboard entry shows completed levels and total stars (previously levels only)

### Corregido

**ES**

- No mostrar versionCode crudo (p. ej. v8) en el modal de actualización; resolver semver local y remoto (nb_app_releases)

**EN**

- Do not show raw versionCode (e.g. v8) in the update modal; resolve semver locally and remotely (nb_app_releases)

---

## [1.5.1] — 2026-07-18 — Fix notificaciones de recordatorios / Reminder notifications fix

**versionCode:** 8

### Destacado (Play Store / changelog)

**ES**

- Los recordatorios push (racha, volver a jugar, novedades) ya se muestran en Android
- Canales de notificación Ranking y Recordatorios creados correctamente

**EN**

- Reminder pushes (streak, comeback, updates) now show on Android
- Ranking and Reminders notification channels created correctly

### Notas Play Console (copiar y pegar)

**ES**

- Corrección: las notificaciones de recordatorios vuelven a mostrarse
- Canales Android Ranking y Recordatorios

**EN**

- Fix: reminder notifications now display correctly
- Android Ranking and Reminders channels

### Corregido

**ES**

- Crear canales Android rank_alerts y engagement antes de registrar FCM (las push de engagement no aparecían en bandeja)

**EN**

- Create Android rank_alerts and engagement channels before FCM registration (engagement pushes were not shown in the tray)

---

## [1.5.0] — 2026-07-17 — Notificaciones y recordatorios / Notifications and reminders

**versionCode:** 7

### Destacado (Play Store / changelog)

**ES**

- Ranking global en vivo y aviso si te superan (opt-in)
- Recordatorio si llevas días sin jugar
- Preferencias granulares: engagement, ranking y contenido

**EN**

- Live leaderboard and overtaken alerts (opt-in)
- Reminder if you have not played in a few days
- Granular preferences: engagement, ranking, and content

### Notas Play Console (copiar y pegar)

**ES**

- Ranking global en vivo (opt-in)
- Notificaciones push opcionales: ranking, recordatorios y novedades
- Controla cada categoría en Ajustes

**EN**

- Live global leaderboard (opt-in)
- Optional push notifications: ranking, reminders, and updates
- Control each category in Settings

### Añadido

**ES**

- Preferencias push: re-engagement, racha, resumen semanal, hitos, sync, updates y contenido
- Jobs programados (cron) y rate limit anti-spam
- Racha diaria sincronizada con el progreso en la nube
- Política de privacidad v1.5.0 (categorías granulares)

**EN**

- Push preferences: re-engagement, streak, weekly summary, milestones, sync, updates, and content
- Scheduled jobs (cron) and anti-spam rate limits
- Daily streak synced with cloud progress
- Privacy policy v1.5.0 (granular categories)

---

## [1.2.1] — 2026-07-03 — Cuenta en la nube y retos con medallas / Cloud save and challenge medals

**versionCode:** 4

> **Play Store:** publicación única en esta versión. Incluye v1.2.0 (versionCode 3) — no publicadas por separado en Play.

### Destacado (Play Store / changelog)

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

### Modal in-app (resumen jugador)

- 70 niveles, 2 etapas

### Destacado (Play Store / changelog)

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

### Modal in-app (resumen jugador)

- 30 niveles

### Destacado (Play Store / changelog)

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
