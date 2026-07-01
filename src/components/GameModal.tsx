import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '../i18n/useTranslation'

interface GameModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  zIndexClass?: string
}

export function GameModal({
  open,
  onClose,
  title,
  children,
  zIndexClass = 'z-[200]',
}: GameModalProps) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/60 p-4`}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl bg-gradient-to-b from-[#3d2a6b] to-[#2d1b4e] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg text-white"
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
