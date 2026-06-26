/** Desbloquea todos los niveles en `npm run dev` cuando `VITE_UNLOCK_ALL_LEVELS=true`. */
export const DEV_UNLOCK_ALL_LEVELS =
  import.meta.env.DEV && import.meta.env.VITE_UNLOCK_ALL_LEVELS === 'true'
