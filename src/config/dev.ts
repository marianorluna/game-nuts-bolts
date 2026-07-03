/** Desbloquea todos los niveles y etapas en `npm run dev` cuando `VITE_UNLOCK_ALL_LEVELS=true`. */
export const DEV_UNLOCK_ALL_LEVELS =
  import.meta.env.DEV && import.meta.env.VITE_UNLOCK_ALL_LEVELS === 'true'

/** Muestra todas las medallas desbloqueadas en el medallero (solo diseño, no afecta progreso). */
export const DEV_PREVIEW_ALL_MEDALS =
  import.meta.env.DEV && import.meta.env.VITE_PREVIEW_ALL_MEDALS === 'true'
