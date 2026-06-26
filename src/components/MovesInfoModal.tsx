import { motion, AnimatePresence } from 'framer-motion'
import { getStarThresholds } from '../domain/gameEngine'

interface MovesInfoModalProps {
  open: boolean
  onClose: () => void
  minMoves: number
  currentMoves?: number
}

export function MovesInfoModal({
  open,
  onClose,
  minMoves,
  currentMoves,
}: MovesInfoModalProps) {
  const { threeStars, twoStars } = getStarThresholds(minMoves)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#3d2a6b] to-[#2d1b4e] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Movimientos</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg text-white"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {currentMoves !== undefined && (
              <p className="mb-4 text-center text-4xl font-black text-white">
                {currentMoves}
              </p>
            )}

            <div className="space-y-3 text-sm leading-relaxed text-purple-100">
              <p>
                Para ganar{' '}
                <span className="font-semibold text-amber-300">3 estrellas ⭐⭐⭐ </span>
                debes completar el nivel con un{' '}
                <span className="font-bold text-white">máximo de {threeStars} movimientos</span>.
              </p>
              <p>
                Para{' '}
                <span className="font-semibold text-amber-200">2 estrellas ⭐⭐ </span>
                el máximo es de{' '}
                <span className="font-bold text-white">{twoStars} movimientos</span>.
              </p>
              <p className="text-purple-200">
                Si usas más movimientos, igual puedes completar el nivel y ganar 1 estrella ⭐.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-white/15 py-3 font-semibold text-white transition active:scale-95"
            >
              Entendido
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
