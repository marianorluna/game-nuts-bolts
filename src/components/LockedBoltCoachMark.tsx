import { useId } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from '../i18n/useTranslation'

interface LockedBoltCoachMarkProps {
  onDismiss: () => void
}

const BUBBLE_PATH =
  'M14 0 H230 A14 14 0 0 1 244 14 V100 A14 14 0 0 1 230 114 H134 L122 128 L110 114 H14 A14 14 0 0 1 0 100 V14 A14 14 0 0 1 14 0 Z'

export function LockedBoltCoachMark({ onDismiss }: LockedBoltCoachMarkProps) {
  const { t } = useTranslation()
  const gradientId = useId()
  const glowFilterId = `${gradientId}-glow`

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="pointer-events-auto absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 pb-4"
      role="status"
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 244 128"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a5260" />
            <stop offset="100%" stopColor="#2a3d4a" />
          </linearGradient>
          <filter
            id={glowFilterId}
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
          >
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={BUBBLE_PATH}
          fill="rgba(34, 211, 238, 0.22)"
          filter={`url(#${glowFilterId})`}
        />
        <path
          d={BUBBLE_PATH}
          fill={`url(#${gradientId})`}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="relative px-4 pb-5 pt-3 text-center">
        <p className="text-sm font-medium leading-snug text-cyan-100">
          {t('level.coachLockedBolt')}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 w-full rounded-xl bg-white/15 py-2 text-xs font-semibold text-white transition active:scale-95"
        >
          {t('common.gotIt')}
        </button>
      </div>
    </motion.div>
  )
}
