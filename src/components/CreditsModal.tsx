import { motion, AnimatePresence } from 'framer-motion'
import { AUTHOR } from '../config/author'
import { APP_VERSION } from '../config/version'
import { useTranslation } from '../i18n/useTranslation'

interface CreditsModalProps {
  open: boolean
  onClose: () => void
}

export function CreditsModal({ open, onClose }: CreditsModalProps) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-2xl bg-gradient-to-b from-[#3d2a6b] to-[#2d1b4e] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{t('credits.title')}</h2>
                <p className="mt-1 text-sm text-purple-200">{t('credits.madeWith')}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg text-white"
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>

            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl">
                {AUTHOR.avatar}
              </div>
              <h3 className="text-lg font-bold text-white">{AUTHOR.name}</h3>
              <p className="mt-1 text-sm font-medium text-amber-300">{t('author.role')}</p>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-xs font-bold tracking-widest text-purple-300">
                {t('credits.contactMe')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AUTHOR.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                    rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-3 text-sm font-medium text-white transition active:scale-[0.98] hover:bg-white/15"
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 px-4 py-3 text-center">
              <p className="text-xs text-purple-300">
                {t('credits.appVersion', { version: APP_VERSION })}
              </p>
              <p className="mt-1 text-[10px] text-purple-400/70">
                {t('credits.stack')}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
