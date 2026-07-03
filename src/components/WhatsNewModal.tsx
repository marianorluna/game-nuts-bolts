import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '../i18n/useTranslation'
import type { WhatsNewContent } from '../services/releaseNotesService'

interface WhatsNewModalProps {
  open: boolean
  content: WhatsNewContent | null
  onDismiss: () => void
}

export function WhatsNewModal({ open, content, onDismiss }: WhatsNewModalProps) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {open && content && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[240] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-2xl bg-gradient-to-b from-[#3d2a6b] to-[#2d1b4e] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 text-center">
              <div className="mb-2 text-4xl">✨</div>
              <p className="text-sm font-medium text-amber-300">
                {t('whatsNew.versionBadge', { version: content.version })}
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">{content.title}</h2>
              <p className="mt-2 text-sm text-purple-200">{t('whatsNew.subtitle')}</p>
            </div>

            <ul className="mb-6 space-y-3 text-left">
              {content.highlights.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-purple-100"
                >
                  <span className="mt-0.5 shrink-0 text-amber-400" aria-hidden>
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={onDismiss}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-bold text-white shadow-lg transition active:scale-95"
            >
              {t('whatsNew.continue')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
