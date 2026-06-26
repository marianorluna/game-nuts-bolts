import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AUTHOR } from '../config/author'
import { APP_VERSION } from '../config/version'
import { AppLogo } from './AppLogo'

interface SplashScreenProps {
  onComplete: () => void
}

const SPLASH_DURATION_MS = 2800

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [ready, setReady] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), SPLASH_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const dismiss = () => {
    if (exiting) return
    setExiting(true)
    window.setTimeout(onComplete, 450)
  }

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-[300] flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#3d2a6b] via-[#35235f] to-[#2d1b4e] px-6"
          onClick={dismiss}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') dismiss()
          }}
          aria-label="Pantalla de inicio. Toca para continuar."
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -right-16 bottom-1/4 h-72 w-72 rounded-full bg-purple-400/10 blur-3xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
            className="relative mb-6"
          >
            <motion.div
              animate={{ rotate: [0, -4, 4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <AppLogo size="lg" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-center text-4xl font-extrabold tracking-tight text-white"
          >
            Nuts & Bolts
          </motion.h1>

          <motion.p
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-2 text-center text-sm text-purple-200"
          >
            Ordena las tuercas por color
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 h-1 w-48 overflow-hidden rounded-full bg-white/10"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: SPLASH_DURATION_MS / 1000, ease: 'easeInOut' }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-sm font-medium text-amber-300">Toca para continuar</p>
          </motion.div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-0 left-0 right-0 pb-safe px-6 py-6 text-center"
          >
            <p className="text-xs text-purple-300/80">
              por <span className="font-semibold text-purple-200">{AUTHOR.name}</span>
            </p>
            <p className="mt-1 text-[10px] text-purple-400/60">v{APP_VERSION}</p>
          </motion.footer>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
