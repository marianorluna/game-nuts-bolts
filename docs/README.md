# Documentación — Nuts & Bolts

## Contenido del juego (campañas, niveles, mecánicas)

| Documento                                            | Descripción                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| [CONTENT_ARCHITECTURE.md](./CONTENT_ARCHITECTURE.md) | Jerarquía, **lore y nomenclatura**, convenciones y rangos reservados |
| [MECHANICS_REGISTRY.md](./MECHANICS_REGISTRY.md)     | Catálogo de mecánicas: reglas, estado, archivos del motor            |
| [CONTENT_CHANGELOG.md](./CONTENT_CHANGELOG.md)       | Historial de expansiones y decisiones de diseño                      |
| [EXTENSION_PLAYBOOK.md](./EXTENSION_PLAYBOOK.md)     | Checklists para extender el juego sin romper progreso                |
| [LEVELS.md](./LEVELS.md)                             | Informe de validación por nivel (dificultad, movimientos, métricas)  |

### Estado actual

- **100 niveles** publicados — Campaña *El Taller* (v1.1.0+)
- **Cuenta y nube** opcionales (v1.2.0) ✅
- **Fase 0:** documentación base ✅
- **Fase 1:** 60 niveles + UI por etapas ✅
- **Fase 2:** 100 niveles + multiNut + lockedBolt ✅
- **Sección 2:** pendiente — niveles 101–200

## Funciones sociales y ranking (v1.2.0+)

| Documento                                                  | Descripción                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| [SOCIAL_FEATURES_ROADMAP.md](./SOCIAL_FEATURES_ROADMAP.md) | **Prompts incrementales** — avance, checklists y verificaciones |
| [RANKING_RULES.md](./RANKING_RULES.md)                     | Criterios de orden del leaderboard (6 niveles de desempate)     |
| [BACKEND_DECISION.md](./BACKEND_DECISION.md)               | Por qué Supabase y alternativas descartadas                     |
| [MIGRATION_PLAYBOOK.md](./MIGRATION_PLAYBOOK.md)           | Migración segura jugadores beta _(Prompt 5)_                    |

**Estado:** Prompt 0 ✅ · Prompts 1–4 ✅ · Prompt 5 pendiente · Backend: Supabase

## Audio y música ambiente (v1.2.1+)

| Documento                                      | Descripción                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| [AUDIO_ROADMAP.md](./AUDIO_ROADMAP.md)          | **Prompts A1–A2** — SFX ampliados, música ambiente, volumen, APK |
| [AUDIO_CREDITS.md](./AUDIO_CREDITS.md)         | Licencias y procedencia de archivos en `public/audio/`            |

**Estado:** v1.2.0 sin assets de audio (SFX procedural) · Prompt A1 (v1.2.1) ⬜ · Prompt A2 (v1.3.1) ⬜

**Prompts copiables:** integrados en [SOCIAL_FEATURES_ROADMAP.md](./SOCIAL_FEATURES_ROADMAP.md) (secciones A1 y A2, bloque «Texto para copiar en el chat»). Este doc amplía contexto, peso APK y licencias.

## Publicación

| Documento                                      | Descripción                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| [SCRIPTS.md](./SCRIPTS.md)                     | **Referencia de comandos npm** — flujo de release y uso eventual  |
| [CHANGELOG.md](./CHANGELOG.md)                 | **Releases de la app** (semver) — generado desde `release-notes.json` |
| [PLAYSTORE.md](./PLAYSTORE.md)                 | Guía para publicar en Google Play                                 |
| [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)       | Dónde está la política de privacidad, URL pública y flujo de deploy |
| [../LICENSE](../LICENSE)                       | Licencia propietaria del código y contenido (All Rights Reserved)   |
