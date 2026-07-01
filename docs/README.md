# Documentación — Nuts & Bolts

## Contenido del juego (campañas, niveles, mecánicas)

| Documento | Descripción |
|-----------|-------------|
| [CONTENT_ARCHITECTURE.md](./CONTENT_ARCHITECTURE.md) | Jerarquía, **lore y nomenclatura**, convenciones y rangos reservados |
| [MECHANICS_REGISTRY.md](./MECHANICS_REGISTRY.md) | Catálogo de mecánicas: reglas, estado, archivos del motor |
| [CONTENT_CHANGELOG.md](./CONTENT_CHANGELOG.md) | Historial de expansiones y decisiones de diseño |
| [EXTENSION_PLAYBOOK.md](./EXTENSION_PLAYBOOK.md) | Checklists para extender el juego sin romper progreso |

### Estado actual

- **30 niveles** publicados (v1.0.0)
- **Roadmap:** 100 niveles (Sección 1, Campaña 1) — ver changelog
- **Fase 0:** documentación base ✅
- **Fase 1:** 60 niveles publicados + UI por etapas ✅
- **Fase 2:** 100 niveles + multiNut + lockedBolt ✅
- **Sección 2:** pendiente — niveles 101–200

## Funciones sociales y ranking (v2.0+)

| Documento | Descripción |
|-----------|-------------|
| [SOCIAL_FEATURES_ROADMAP.md](./SOCIAL_FEATURES_ROADMAP.md) | **Prompts incrementales** — avance, checklists y verificaciones |
| [RANKING_RULES.md](./RANKING_RULES.md) | Criterios de orden del leaderboard (6 niveles de desempate) |
| [BACKEND_DECISION.md](./BACKEND_DECISION.md) | Por qué Supabase y alternativas descartadas |
| [MIGRATION_PLAYBOOK.md](./MIGRATION_PLAYBOOK.md) | Migración segura jugadores beta *(Prompt 5)* |

**Estado:** Prompt 0 ✅ · Prompt 1 pendiente · Backend: Supabase

## Publicación

| Documento | Descripción |
|-----------|-------------|
| [PLAYSTORE.md](./PLAYSTORE.md) | Guía para publicar en Google Play |

## Comandos útiles

```bash
npm run validate:levels   # validar todos los niveles hornados
npm run bake:levels       # regenerar bakedLevels (usar append-only tras Fase 1)
npm test                  # tests unitarios (dominio, merge de progreso)
```
