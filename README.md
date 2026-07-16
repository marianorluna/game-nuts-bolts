# Nuts & Bolts

**Puzzle de ordenar tuercas por color** — disponible en Android.

[![Versión](https://img.shields.io/badge/versión-1.2.1-blue)](docs/CHANGELOG.md)
[![Niveles](https://img.shields.io/badge/niveles-100-orange)](docs/LEVELS.md)

<p align="center">
  <img src="public/logo.png" alt="Nuts & Bolts" width="120" />
</p>

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=com.nutsandbolts.puzzle">Descargar en Google Play</a>
</p>

---

## El juego

Nuts & Bolts es un puzzle relajante en el que mueves tuercas de colores entre bulones hasta dejar cada uno ordenado. La mecánica es sencilla: toca un bulón para seleccionarlo y otro para mover la tuerca superior (o el bloque de tuercas del mismo color, según el nivel).

El progreso es lineal: completas niveles, ganas estrellas y desbloqueas los siguientes. Puedes jugar sin conexión; la cuenta y la nube son opcionales.

## Características

| Área | Qué incluye |
|------|-------------|
| **Campaña** | 100 niveles en la campaña *El Taller*, repartidos en tres etapas con ambientación distinta |
| **Estrellas** | Hasta 3 por nivel según los movimientos usados |
| **Deshacer** | Límite de deshaceres según la dificultad del nivel |
| **Mecánicas** | Puzzle clásico, tuercas en bloque (*multiNut*) y bulones bloqueados (*lockedBolt*) |
| **Idiomas** | Español e inglés (detección automática o manual en Configuración) |
| **Progreso** | Guardado local; cuenta opcional con Google o correo para respaldo en la nube |
| **Sincronización** | Offline-first: juegas sin red y el progreso se sincroniza al volver a tener conexión |
| **Actualizaciones** | Aviso en la app cuando hay una versión nueva en Play Store |
| **Novedades** | Modal «Qué hay de nuevo» al actualizar |

## Contenido publicado

### Campaña: El Taller (100 niveles)

| Etapa | Niveles | Ambiente | Mecánicas |
|-------|---------|----------|-----------|
| Caja de herramientas | 1–30 | Taller | Clásico |
| El garaje apretado | 31–60 | Garaje | Clásico |
| La línea de montaje | 61–100 | Fábrica | Bloques de tuercas (desde 61) y bulones bloqueados (desde 81) |

Niveles de reto en los hitos 20, 40, 60, 80 y 100.

### Próximamente en el menú

*La Obra* y *La Fábrica* aparecen como campañas bloqueadas; el contenido de la Sección 2 está en desarrollo.

## Cómo se juega

1. **Seleccionar** — Toca un bulón con tuercas para marcarlo como origen.
2. **Mover** — Toca un bulón válido (vacío o con el mismo color arriba) para trasladar la(s) tuerca(s).
3. **Ganar** — Cada bulón queda vacío o lleno de un solo color.
4. **Estrellas** — Menos movimientos, más estrellas; puedes repetir niveles para mejorar tu puntuación.

La app incluye tutoriales contextuales (movimientos, bloques, bulones bloqueados) en los primeros niveles de cada mecánica.

## Privacidad

- Sin cuenta: el progreso se guarda solo en el dispositivo.
- Con cuenta: se sincroniza el avance de niveles y estrellas vía Supabase.
- [Política de privacidad](https://games.marianorluna.com/nuts-and-bolts/privacy.html)

## Historial de versiones

| Versión | Fecha | Resumen |
|---------|-------|---------|
| **1.2.1** | 2026-07-03 | Cuenta/nube + retos con medallas _(producción)_ |
| **1.2.0** | — | Cuenta y sync _(fusionada en 1.2.1; no publicada sola)_ |
| **1.1.0** | 2026-06-26 | 100 niveles, nuevas mecánicas, i18n ES/EN |
| **1.0.0** | 2026-06-16 | Lanzamiento inicial (30 niveles) |

Detalle completo en [docs/CHANGELOG.md](docs/CHANGELOG.md).

## Desarrollo

Repositorio del juego (React + Capacitor). Para ejecutarlo en local:

```bash
npm install
npm run dev
```

Documentación técnica, scripts de release y guía de Play Store:

- [docs/README.md](docs/README.md) — índice de documentación
- [docs/SCRIPTS.md](docs/SCRIPTS.md) — comandos npm y flujo de release
- [docs/PLAYSTORE.md](docs/PLAYSTORE.md) — publicación en Android
- [docs/SOCIAL_FEATURES_ROADMAP.md](docs/SOCIAL_FEATURES_ROADMAP.md) — ranking y social (siguiente: v1.3.0)
- [docs/AUDIO_ROADMAP.md](docs/AUDIO_ROADMAP.md) — plan de audio (v1.3.1 / v1.4.1, tras ranking)

### Stack

React 19 · Vite · TypeScript · Tailwind CSS 4 · Framer Motion · Zustand · Capacitor 7 · Supabase

## Autor

**Mariano Luna** — [marianorluna.com](https://marianorluna.com) · [GitHub](https://github.com/marianorluna)

© Mariano Luna. Código y contenido propietarios. Ver [LICENSE](LICENSE).
