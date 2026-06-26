import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { AUTHOR } from '../config/author'
import { useTranslation } from '../i18n/useTranslation'
import type { LocalePreference } from '../i18n/types'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  onOpenCredits?: () => void
}

const LOCALE_OPTIONS: { value: LocalePreference; labelKey: 'settings.languageAuto' | 'settings.languageEs' | 'settings.languageEn' }[] = [
  { value: 'auto', labelKey: 'settings.languageAuto' },
  { value: 'es', labelKey: 'settings.languageEs' },
  { value: 'en', labelKey: 'settings.languageEn' },
]

export function SettingsModal({ open, onClose, onOpenCredits }: SettingsModalProps) {
  const { t, localePreference, setLocalePreference } = useTranslation()
  const soundEnabled = useGameStore((s) => s.settings.soundEnabled)
  const toggleSound = useGameStore((s) => s.toggleSound)

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
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{t('settings.title')}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg text-white"
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>

            <button
              type="button"
              onClick={toggleSound}
              className="flex w-full items-center justify-between rounded-xl bg-white/10 px-4 py-4 transition active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{soundEnabled ? '🔊' : '🔇'}</span>
                <div className="text-left">
                  <p className="font-semibold text-white">{t('settings.sound')}</p>
                  <p className="text-sm text-purple-200">
                    {soundEnabled ? t('settings.soundOn') : t('settings.soundOff')}
                  </p>
                </div>
              </div>
              <div
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  soundEnabled ? 'bg-amber-400' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </button>

            <div className="mt-3 rounded-xl bg-white/10 px-4 py-4">
              <p className="mb-3 font-semibold text-white">{t('settings.language')}</p>
              <div className="flex gap-2">
                {LOCALE_OPTIONS.map(({ value, labelKey }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLocalePreference(value)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition active:scale-95 md:text-sm ${
                      localePreference === value
                        ? 'bg-amber-400 text-stone-900'
                        : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {onOpenCredits && (
              <button
                type="button"
                onClick={onOpenCredits}
                className="mt-3 flex w-full items-center gap-3 rounded-xl bg-white/10 px-4 py-4 transition active:scale-[0.98] hover:bg-white/15"
              >
                <span className="text-2xl">{AUTHOR.avatar}</span>
                <div className="text-left">
                  <p className="font-semibold text-white">{t('settings.credits')}</p>
                  <p className="text-sm text-purple-200">{t('settings.creditsSubtitle')}</p>
                </div>
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
