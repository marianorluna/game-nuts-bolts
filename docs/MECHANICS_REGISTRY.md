# Registro de mecánicas — Nuts & Bolts

Catálogo central de reglas de juego: implementadas, en desarrollo y planificadas.  
Actualizar este archivo **antes** de implementar una mecánica nueva y marcarla como `activa` al cerrar la fase.

**Documentos relacionados:** [CONTENT_ARCHITECTURE.md](./CONTENT_ARCHITECTURE.md) · [EXTENSION_PLAYBOOK.md](./EXTENSION_PLAYBOOK.md)

---

## Resumen

| Mecánica | ID | Estado | Sección 1 | Introducción |
|----------|-----|--------|-----------|--------------|
| Puzzle clásico | `classic` | **activa** | 1–100 (base) | Nivel 1 |
| Movimiento en bloque | `multiNut` | **activa** | 61–100 | Etapa 3, niveles 61–64 |
| Bulón bloqueado | `lockedBolt` | **activa** | 81–100 | Etapa 3, niveles 81–84 |
| Capacidad variable | `variableCapacity` | planificada | — | Sección 2 |
| Bulón color fijo | `fixedColorBolt` | planificada | — | Sección 2 |
| Tuerca oculta | `hiddenNut` | planificada | — | Sección 2–3 |
| Tuerca pegajosa | `stickyNut` | planificada | — | Campaña 2 |
| Límite de movimientos | `moveLimit` | planificada | — | Retos / diarios |

### Regla de cadencia

- **Una mecánica nueva cada 100–150 niveles** en la campaña principal
- Las mecánicas viejas no se eliminan de golpe: dejan de introducirse en etapas nuevas y se mezclan en retos
- Máximo **1 mecánica nueva por etapa**; tutorial en los primeros 4 niveles

---

## Entradas detalladas

### classic — Puzzle clásico (1 tuerca por movimiento)

- **Estado:** activa
- **Introducida en:** Nivel 1 (Etapa 1)
- **Reglas:**
  - Solo se mueve la tuerca superior de un bulón
  - Destino válido: bulón vacío o mismo color en la cima
  - Capacidad fija por nivel (actualmente 4)
  - Victoria: cada bulón vacío o lleno de un solo color
- **Motor:** `src/domain/gameEngine.ts` — `getMovableCount` (retorna 1), `canMove`, `moveNuts`, `isSolved`
- **Validación:** `src/domain/levelValidator.ts` — BFS sobre `canMove` + `moveNuts`
- **UI:** `GameBoard`, `BoltStack`, `NutPiece`
- **Flag:** sin flag; ausencia de `mechanics` = clásico
- **Compatibilidad:** comportamiento por defecto de todos los niveles 1–30

---

### multiNut — Movimiento en bloque

- **Estado:** activa
- **Introducida en:** Etapa 3, niveles 61–64 (tutorial)
- **Reglas:**
  - Si hay 2+ tuercas del mismo color en la cima, se mueven juntas como un bloque
  - El bloque debe caber en el destino (espacio + color compatible)
  - Cuenta como **1 movimiento**
- **Motor:** `gameEngine.getMovableCount` (contar contiguas), `canMove`, `moveNuts`
- **Validación:** BFS existente — delega en el motor; sin cambio de API del solver
- **UI:** coach mark en nivel 61 (patrón `MovesCoachMark.tsx`)
- **Flag:** `mechanics: ['multiNut']` en `LevelDefinition`
- **Compatibilidad:** omitido = clásico (1 tuerca). Niveles 1–60 sin cambios.

---

### lockedBolt — Bulón bloqueado

- **Estado:** activa
- **Introducida en:** Etapa 3, niveles 81–84 (tutorial hand-crafted)
- **Reglas:**
  - Bulón con `locked: true` no puede ser origen ni destino
  - Se desbloquea cuando existe un bulón **completo** del color indicado en `unlockWhenColor`
  - Estado de locks forma parte del estado del BFS
- **Motor:** `gameEngine.canMove` + estado de sesión; `BoltConfig` en `LevelDefinition`
- **Validación:** BFS extendido — estado `(bolts, unlockedBoltIndices)`
- **UI:** overlay de candado en `BoltStack.tsx`
- **Flag:** `boltConfigs[i].locked`, `boltConfigs[i].unlockWhenColor`
- **Compatibilidad:** sin `boltConfigs` = ningún bulón bloqueado
- **Decisión:** postergado a nivel 81 para no solapar tutorial de multiNut

```typescript
interface BoltConfig {
  locked?: boolean
  unlockWhenColor?: NutColor
  maxCapacity?: number  // reservado para variableCapacity
}
```

---

### variableCapacity — Capacidad variable por bulón

- **Estado:** planificada
- **Introducida en:** Sección 2, Etapa 1 (niveles 101+)
- **Reglas:** cada bulón puede tener `maxCapacity` distinto (3, 4 o 5)
- **Motor:** `canMove` usa capacidad del bulón destino, no solo `level.capacity`
- **Validación:** BFS con capacidades por índice de bulón
- **UI:** altura visual distinta en `BoltStack`
- **Flag:** `boltConfigs[i].maxCapacity` o `level.capacity` como default
- **Notas:** no mezclar en la misma etapa que se introduce multiNut por primera vez

---

### fixedColorBolt — Bulón de color fijo

- **Estado:** planificada
- **Introducida en:** Sección 2
- **Reglas:** bulón solo acepta tuercas de un color específico (aunque esté vacío)
- **Motor:** check adicional en `canMove` para destino con color fijo
- **Validación:** BFS estándar con regla extra
- **UI:** indicador de color en el bulón (borde o fondo teñido)
- **Flag:** `boltConfigs[i].fixedColor?: NutColor`

---

### hiddenNut — Tuerca oculta

- **Estado:** planificada
- **Introducida en:** Sección 2–3
- **Reglas:** tuercas bajo la cima muestran `?` hasta quedar expuestas
- **Motor:** modelo `Nut { color, hidden? }` o capa de visibilidad en sesión
- **Validación:** BFS con estado de visibilidad al mover
- **UI:** skin `?` en `NutPiece`
- **Complejidad:** alta — requiere cambiar `Bolt = NutColor[]` a estructura rica

---

### stickyNut — Tuerca pegajosa

- **Estado:** planificada
- **Introducida en:** Campaña 2
- **Reglas:** dos tuercas marcadas deben moverse siempre juntas aunque sean de distinto color
- **Motor:** extensión de `getMovableCount` con pares vinculados
- **Complejidad:** alta

---

### moveLimit — Límite de movimientos (derrota)

- **Estado:** planificada
- **Introducida en:** retos especiales / desafíos diarios (no campaña lineal inicial)
- **Reglas:** superar `moveLimit` = derrota (distinto de perder estrellas)
- **Motor:** check en `gameStore` tras cada movimiento
- **UI:** contador con umbral rojo
- **Flag:** `moveLimit?: number` en nivel o modo de juego paralelo
- **Notas:** no aplicar en progresión lineal hasta validar con playtesting

---

## Cómo añadir una entrada nueva

1. Copiar la plantilla de una entrada existente
2. Asignar `MechanicId` en `src/domain/types.ts` con comentario: `// Ver docs/MECHANICS_REGISTRY.md#{id}`
3. Estado inicial: `planificada`
4. Al implementar: `en desarrollo` → `activa`
5. Si se abandona: `retirada` con motivo y niveles afectados

---

## Historial de este documento

| Fecha | Cambio |
|-------|--------|
| 2026-06-26 | Creación inicial (Fase 0). 8 mecánicas catalogadas. |
