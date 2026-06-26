import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '../i18n/useTranslation'

interface EndOfContentModalProps {
  open: boolean
  onClose: () => void
}

export function EndOfContentModal({ open, onClose }: EndOfContentModalProps) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#3d2a6b] to-[#2d1b4e] p-6 text-center shadow-2xl"
          >
            <div className="mb-3 text-5xl">🔨</div>
            <h2 className="mb-2 text-2xl font-bold text-white">
              {t('endOfContent.title')}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-purple-100">
              {t('endOfContent.message')}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-bold text-white shadow-lg transition hover:brightness-110 active:scale-95"
            >
              {t('common.gotIt')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
