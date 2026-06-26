# Changelog de contenido — Nuts & Bolts

Historial de expansiones de niveles, mecánicas y decisiones de diseño.  
Entradas más recientes arriba. Cada fase o release de contenido debe añadir una entrada.

**Documentos relacionados:** [CONTENT_ARCHITECTURE.md](./CONTENT_ARCHITECTURE.md) · [MECHANICS_REGISTRY.md](./MECHANICS_REGISTRY.md)

---

## [Fase 1.1] — 2026-06-26 — Nomenclatura jugable (lore del taller)

### Cambiado

- Sección 1: «Fundamentos» → **«Aprendiz de banco»**
- Etapa 1: **«Caja de herramientas»** (puzzle clásico)
- Etapa 2: «Presión» → **«El garaje apretado»**
- Etapa 3 (metadata): «Nuevas reglas» → **«La línea de montaje»**
- Hitos en `WinModal`: textos alineados con el taller (niveles 20, 30, 40, 60)
- Retos con nombre jugable: Inspección de la caja, Prueba de torque, etc.
- Blurb bajo cada etapa en `HomeScreen`
- [CONTENT_ARCHITECTURE.md](./CONTENT_ARCHITECTURE.md): sección «Lore y nomenclatura», roadmap Campaña 1 (secciones 2–6) y campañas 2–4

### Compatibilidad

- Slugs (`stage-1-fundamentos`, etc.) y layouts **sin cambios**
- Saves sin migración

### Decisiones

- **Dual naming:** `name` = jugador, `designLabel` = docs de diseño, `id` = estable en código
- Los slugs históricos (`fundamentos`, `presion`) se conservan; solo cambia la UI

---

## [Fase 1] — 2026-06-26 — Niveles 31–60 + infraestructura de etapas

### Añadido

- 30 niveles nuevos (ids 31–60), Etapa 2 «Presión»
- `src/domain/content/campaignStructure.ts` con jerarquía Campaña/Sección/Etapa
- Campos opcionales en `LevelDefinition`: `stageId`, `isChallenge`, `mechanics`
- Hornado append-only: `npm run bake:levels -- --from=31`
- `HomeScreen` agrupado por etapas con barra de progreso de Sección 1
- Temas visuales por etapa (`workshop` / `garage`) en `App.tsx`
- Hitos en `WinModal` al completar niveles 30, 40 y 60
- Badge ⚡ en retos (20, 40, 60)

### Compatibilidad

- Layouts de niveles 1–30 preservados (verificación de checksum en bake)
- Saves existentes sin migración; `unlockedLevel: 31` desbloquea nivel 31

### Decisiones

- Etapa 3 visible solo en metadata; niveles 61–100 quedan para Fase 2
- `minSolutionMoves` del nivel 60 ajustado a q(34) por tiempo de generación

---

## [Fase 2] — 2026-06-26 — Niveles 61–100 + mecánicas nuevas

### Añadido

- 40 niveles nuevos (ids 61–100), Etapa 3 «La línea de montaje»
- Mecánica **multiNut** (movimiento en bloque) en niveles 61–100
- Mecánica **lockedBolt** (bulones bloqueados) en niveles 81–100
- `BoltConfig`, `GamePlayContext` en motor y sesión
- BFS extendido con reglas de mecánicas en `levelValidator.ts`
- Tutoriales hand-crafted 81–84 (`handCraftedLevels.ts`)
- UI: candado en bulones, coach mark nivel 61, hitos 80 y 100
- Tema visual `factory` para etapa 3

### Compatibilidad

- Niveles 1–60 congelados (layouts y minMoves intactos)
- Saves sin migración; `unlockedLevel: 61` desbloquea nivel 61

### Validación

- `npm run validate:levels` — 100/100 niveles solubles con sus reglas
- Script `scripts/test-handcrafted.ts` para tutoriales 81–84

---

## [Unreleased] — Sección 2 (planificada)

### Objetivo

Completar Sección 1 (niveles 61–100) con mecánicas nuevas.

### Planificado

- Niveles 61–100, Etapa 3 «La línea de montaje»
- Mecánica `multiNut` (61–80)
- Mecánica `lockedBolt` (81–100)
- Retos en niveles 80 y 100
- Coach mark multiNut en nivel 61
- Celebración de cierre de Sección 1 en nivel 100

### Decisiones

- `lockedBolt` postergado a nivel 81 para no solapar el tutorial de `multiNut`
- Layouts con locks serán mayormente hand-crafted en specs (generador no modela locks al inicio)

---

## [Fase 0] — 2026-06-26 — Documentación base

### Añadido

- `docs/CONTENT_ARCHITECTURE.md` — jerarquía Campaña/Sección/Etapa, convenciones, rangos reservados
- `docs/MECHANICS_REGISTRY.md` — catálogo de 8 mecánicas
- `docs/EXTENSION_PLAYBOOK.md` — checklists de expansión
- `docs/CONTENT_CHANGELOG.md` — este archivo
- `docs/README.md` — índice de documentación de contenido

### Estado del juego

- **30 niveles** publicados (ids 1–30)
- Organización UI: por dificultad (FÁCIL / MEDIO / DIFÍCIL)
- Una sola mecánica activa: puzzle clásico (1 tuerca por movimiento)
- Progreso: `unlockedLevel` lineal en `localStorage`

### Decisiones

- Expansión en dos fases de contenido: primero 31–60 sin motor nuevo, luego 61–100 con mecánicas
- Sección 1 de Campaña 1 = 100 niveles («Fundamentos»)
- Documentación viva en `docs/` sincronizada con cada fase de implementación

---

## [v1.0.0] — Lanzamiento inicial

### Añadido

- 30 niveles (ids 1–30)
- Dificultades: easy (1–10), medium (11–20), hard (21–30)
- Pipeline generar → hornear → validar (`levelGenerator`, `bake-levels`, `validate-levels`)
- Progreso con estrellas y desbloqueo lineal
- Onboarding: coach mark de movimientos

### Niveles congelados

Los layouts de niveles 1–30 en `bakedLevels.ts` **no deben regenerarse** tras publicación.

---

## Plantilla para nuevas entradas

```markdown
## [vX.Y] — YYYY-MM-DD — Título breve

### Añadido

- ...

### Cambiado

- ...

### Compatibilidad

- ...

### Decisiones

- ...
```
