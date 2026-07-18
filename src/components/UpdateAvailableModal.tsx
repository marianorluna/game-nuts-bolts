import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AppUpdate,
  FlexibleUpdateInstallStatus,
  type AppUpdateInfo,
} from '@capawesome/capacitor-app-update'
import type { PluginListenerHandle } from '@capacitor/core'
import {
  completeNativeAppUpdate,
  openAppStoreListing,
  startNativeAppUpdate,
} from '../services/appUpdateService'
import { useTranslation } from '../i18n/useTranslation'

type UpdatePhase = 'prompt' | 'downloading' | 'ready' | 'error'

interface UpdateAvailableModalProps {
  open: boolean
  currentVersion?: string
  availableVersion?: string
  updateInfo: AppUpdateInfo
  onDismiss: () => void
}

export function UpdateAvailableModal({
  open,
  currentVersion,
  availableVersion,
  updateInfo,
  onDismiss,
}: UpdateAvailableModalProps) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<UpdatePhase>('prompt')
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) {
      setPhase('prompt')
      setProgress(0)
      setBusy(false)
    }
  }, [open])

  useEffect(() => {
    if (phase !== 'downloading') return

    let listener: PluginListenerHandle | undefined

    const attachListener = async () => {
      listener = await AppUpdate.addListener(
        'onFlexibleUpdateStateChange',
        (state) => {
          if (
            state.installStatus === FlexibleUpdateInstallStatus.DOWNLOADING &&
            state.bytesDownloaded !== undefined &&
            state.totalBytesToDownload
          ) {
            setProgress(
              Math.round(
                (state.bytesDownloaded / state.totalBytesToDownload) * 100,
              ),
            )
          }

          if (state.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
            setPhase('ready')
            setBusy(false)
          }

          if (state.installStatus === FlexibleUpdateInstallStatus.FAILED) {
            setPhase('error')
            setBusy(false)
          }
        },
      )
    }

    void attachListener()

    return () => {
      void listener?.remove()
    }
  }, [phase])

  const handleUpdate = async () => {
    setBusy(true)
    try {
      const mode = await startNativeAppUpdate(updateInfo)
      if (mode === 'flexible') {
        setPhase('downloading')
      } else {
        onDismiss()
        setBusy(false)
      }
    } catch {
      setPhase('error')
      setBusy(false)
    }
  }

  const handleOpenStore = async () => {
    setBusy(true)
    try {
      await openAppStoreListing()
      onDismiss()
    } finally {
      setBusy(false)
    }
  }

  const handleRestart = async () => {
    setBusy(true)
    try {
      await completeNativeAppUpdate()
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 p-4"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#3d2a6b] to-[#2d1b4e] p-6 text-center shadow-2xl"
          >
            <div className="mb-2 text-4xl">🔄</div>
            <h2 className="mb-2 text-xl font-bold text-white">
              {t('update.title')}
            </h2>

            {phase === 'prompt' && (
              <>
                <p className="mb-1 text-sm text-purple-200">
                  {t('update.prompt')}
                </p>
                {currentVersion && availableVersion ? (
                  <p className="mb-6 text-sm text-purple-100">
                    {t('update.versionRange', {
                      current: currentVersion,
                      available: availableVersion,
                    })}
                  </p>
                ) : availableVersion ? (
                  <p className="mb-6 text-sm text-purple-100">
                    {t('update.versionAvailable', {
                      available: availableVersion,
                    })}
                  </p>
                ) : (
                  <div className="mb-6" />
                )}
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleUpdate()}
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-60"
                  >
                    {t('update.updateNow')}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onDismiss}
                    className="rounded-xl border border-white/20 py-3 font-semibold text-white transition active:scale-95 disabled:opacity-60"
                  >
                    {t('update.later')}
                  </button>
                </div>
              </>
            )}

            {phase === 'downloading' && (
              <>
                <p className="mb-4 text-sm text-purple-200">
                  {t('update.downloading')}
                </p>
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
                    style={{ width: `${Math.max(progress, 8)}%` }}
                  />
                </div>
                <p className="text-xs text-purple-300">{progress}%</p>
              </>
            )}

            {phase === 'ready' && (
              <>
                <p className="mb-6 text-sm text-purple-200">
                  {t('update.ready')}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRestart()}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-60"
                >
                  {t('update.restart')}
                </button>
              </>
            )}

            {phase === 'error' && (
              <>
                <p className="mb-6 text-sm text-purple-200">
                  {t('update.error')}
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleOpenStore()}
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-60"
                  >
                    {t('update.openStore')}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onDismiss}
                    className="rounded-xl border border-white/20 py-3 font-semibold text-white transition active:scale-95 disabled:opacity-60"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
