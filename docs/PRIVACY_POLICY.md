# Política de privacidad — ubicación y publicación

Documentación interna sobre dónde vive el texto legal, cómo se publica y qué actualizar al cambiar funciones del juego.

## URL pública (Play Store y enlaces externos)

**https://games.marianorluna.com/nuts-and-bolts/privacy.html**

Esta es la URL que debe figurar en Google Play Console (**Monitorizar y mejorar → Políticas y programas → Contenido de la aplicación → Política de privacidad**).

## Repositorio de despliegue (fuente de verdad online)

| Campo | Valor |
| ----- | ----- |
| Repositorio | [github.com/marianorluna/nuts-and-bolts-web](https://github.com/marianorluna/nuts-and-bolts-web) |
| Ruta del archivo | `nuts-and-bolts/privacy.html` |
| Hosting | [Vercel](https://vercel.com) |
| Dominio | `games.marianorluna.com` (CNAME en Namecheap → `cname.vercel-dns.com`) |

El repo `nuts-and-bolts-web` es estático: solo contiene `vercel.json` y la carpeta `nuts-and-bolts/`. Cada push a `main` redeploya automáticamente si Vercel está conectado al repo.

## Copia local en este proyecto

| Campo | Valor |
| ----- | ----- |
| Ruta | `files-test/privacy.html` |
| Git | Ignorado (`.gitignore`) — borrador de trabajo, no se publica desde aquí |

Edita aquí para probar el texto; cuando esté listo, copia el mismo contenido a `nuts-and-bolts-web` y haz push.

## Flujo para actualizar la política

1. Editar `files-test/privacy.html` en `game-simple` (borrador).
2. Copiar el archivo a `nuts-and-bolts-web/nuts-and-bolts/privacy.html`.
3. Commit y push en `nuts-and-bolts-web` → Vercel publica en unos minutos.
4. Verificar la URL pública en el navegador.
5. Si cambian los datos recogidos, actualizar también **Seguridad de los datos** en Play Console.

**No hace falta cambiar la URL** en Play Console si la ruta sigue siendo la misma; solo el contenido de la página.

## Qué debe reflejar el texto

| Versión | Funciones relevantes para la política |
| ------- | ------------------------------------- |
| v1.x | Solo almacenamiento local en el dispositivo |
| v1.2.1 | Cuenta opcional (Google / email), sync de progreso vía Supabase _(incluye v1.2.0)_ |
| v1.3.0 | Ranking global con opt-in (`show_in_leaderboard`, default off) |
| v1.4.0 | Push FCM (aviso «te superaron» en ranking); permiso Android + controles en Ajustes |
| v1.5.0 | Push engagement: re-engagement, updates, racha, hitos, resumen semanal, sync; preferencias granulares; jobs programados; **opt-out** (on por defecto) |

Decisiones de privacidad del producto: [BACKEND_DECISION.md](./BACKEND_DECISION.md#privacidad-y-ranking) · Roadmap: [SOCIAL_FEATURES_ROADMAP.md](./SOCIAL_FEATURES_ROADMAP.md)

## Contacto del responsable

**Mariano Luna** — [contacto@marianorluna.com](mailto:contacto@marianorluna.com)

## Historial

| Fecha | Cambio |
| ----- | ------ |
| 2026-06-16 | Política v1: sin cuentas ni recopilación en servidor |
| 2026-07-02 | Política v1.2: sync opcional, Supabase, ranking próximo con opt-in |
| 2026-07-17 | Política v1.4: push FCM opt-in, token, Firebase/Google como procesador, controles en Ajustes |
| 2026-07-17 | Política v1.5: categorías push granulares (engagement / ranking / contenido), racha diaria en progreso, jobs de recordatorio; opt-out (default on, desactivar en Ajustes) |
| 2026-07-17 | Push: cambio de opt-in a opt-out (defaults on + permiso sistema) |

## Texto a publicar en privacy.html (v1.5.0) — extracto notificaciones

Incluir (o sustituir la sección de notificaciones v1.4) en `nuts-and-bolts-web/nuts-and-bolts/privacy.html`:

**ES — Notificaciones push**  
Si vinculas una cuenta, las notificaciones quedan activadas por defecto (puedes desactivarlas en Ajustes). En Android pedimos el permiso del sistema antes de registrar el dispositivo. Podemos enviar avisos mediante Firebase Cloud Messaging (Google). Guardamos un token de dispositivo asociado a tu cuenta y preferencias por categoría (ranking, recordatorios de inactividad, racha, resumen semanal, hitos, sync, nueva versión y contenido). Puedes desactivar categorías o el interruptor principal en cualquier momento; al desactivar el interruptor principal o cerrar sesión, eliminamos el token de este dispositivo. Finalidad: avisos de juego. Base jurídica: consentimiento (permiso del sistema y controles en la app).

**EN — Push notifications**  
If you link an account, notifications are on by default (you can turn them off in Settings). On Android we request the system permission before registering the device. We may send alerts via Firebase Cloud Messaging (Google). We store a device token linked to your account and per-category preferences (ranking, inactivity reminders, streak, weekly summary, milestones, sync, app updates, and content). You can disable categories or the master switch anytime; disabling the master switch or signing out removes this device’s token. Purpose: game alerts. Legal basis: consent (system permission and in-app controls).
