# Reglas de ranking — Nuts & Bolts

Sistema de **puntos acumulativos** con desempate secuencial. Implementación: `src/domain/progress/playerRanking.ts`.

**Relacionado:** [SOCIAL_FEATURES_ROADMAP.md](./SOCIAL_FEATURES_ROADMAP.md) · [BACKEND_DECISION.md](./BACKEND_DECISION.md)

---

## Idea general

Entre dos jugadores se comparan criterios **en orden**. Solo se pasa al siguiente criterio si hay **empate** en el anterior. Los criterios 1–3 suman puntos visibles; el 4–6 desempatan con reglas de “+1 punto” conceptual al ganador de ese criterio.

Ejemplo (nivel máx. 100):

| Paso | Jugador A | Jugador B |
|------|-----------|-----------|
| 1. Niveles completados | 100 pts | 100 pts → empate |
| 2. Estrellas (1 pt/★) | +290 → 390 | +290 → 390 → empate |
| 3. Ponderado 3★/2★/1★ | +290 → 690 | +290 → 690 → empate |
| 4. Movimientos nivel 100 | 32 movs | 31 movs → **B gana** (+1) |

---

## Criterios (en orden)

| # | Métrica | Puntos / regla | Solo si empate en anteriores |
|---|---------|----------------|------------------------------|
| 1 | **Niveles completados** | +1 por cada nivel con `completed === true` | — (siempre) |
| 2 | **Estrellas totales** | +1 por cada estrella en cualquier nivel | Sí |
| 3 | **Ponderado por nivel** | +3 si el nivel tiene 3★, +2 si 2★, +1 si 1★ | Sí |
| 4 | **Movimientos por nivel** | Del id **más alto al más bajo**, gana quien tenga menos `bestMoves` en cada nivel completado; si empatan en un nivel, se sigue con el siguiente | Sí |
| 5 | **Movimientos totales** | Gana quien tenga menor suma de `bestMoves` en niveles completados | Sí |
| 6 | **`rankSnapshotAt`** | Gana quien **antes** completó el nivel que llevó su avance al techo actual | Sí |

Si todo empata → **mismo puesto**.

---

## `rankSnapshotAt` (criterio 6)

Se actualiza **solo** al completar un nivel que **sube `unlockedLevel`** (llegar antes al último nivel desbloqueado).

```typescript
shouldUpdateRankSnapshot(before, after)
// true cuando after.unlockedLevel > before.unlockedLevel
```

Mejorar estrellas en niveles viejos **no** cambia el snapshot.

---

## Puntos acumulados en UI (criterios 1–3)

```typescript
computeRankingPointsThrough3(progress)
// {
//   completedLevels: 100,      // criterio 1
//   starPoints: 290,           // criterio 2
//   weightedTierPoints: 290,   // criterio 3
//   cumulativeThrough3: 680,   // suma para mostrar en leaderboard
// }
```

Los criterios 4–6 son desempates entre pares; no se suman de forma lineal en un solo número global.

---

## API de dominio

```typescript
import {
  comparePlayerRank,
  sortRankingEntries,
  computeRankingPointsThrough3,
  shouldUpdateRankSnapshot,
} from '../domain/progress'

// comparePlayerRank(a, b) < 0  →  a queda más arriba que b
```

---

## Columnas en Supabase (Prompt 1 / 6)

Tablas: `nb_player_progress` — filtrar siempre por `game_id = 'nuts-and-bolts'`.

| Columna | Criterio |
|---------|----------|
| `game_id` | Aislamiento multi-juego (siempre en WHERE) |
| `completed_levels` | 1 |
| `total_stars` | 2 |
| `weighted_tier_points` | 3 |
| `moves_tiebreak_key` | 4 (clave ordenable por nivel, alto→bajo) |
| `total_best_moves` | 5 |
| `rank_snapshot_at` | 6 |
| `last_played_at` | (Prompt 6/8) última sync — no entra en el orden del ranking |

Migración incremental si el esquema Prompt 1 ya estaba aplicado: [schema-prompt6.sql](./supabase/schema-prompt6.sql).

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-07-01 | Reglas iniciales: 6 criterios lexicográficos. |
| 2026-07-01 | Sistema de puntos acumulativos 1–3; criterio 1 = niveles completados; snapshot al subir `unlockedLevel`. |
