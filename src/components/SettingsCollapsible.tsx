import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface SettingsCollapsibleProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
}

export function SettingsCollapsible({
  title,
  subtitle,
  icon,
  open,
  onToggle,
  children,
}: SettingsCollapsibleProps) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl bg-white/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 transition active:scale-[0.98] hover:bg-white/5"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {icon != null && <span className="shrink-0 text-2xl">{icon}</span>}
          <div className="min-w-0 text-left">
            <p className="font-semibold text-white">{title}</p>
            {subtitle != null && subtitle !== '' && (
              <p className="truncate text-sm text-purple-200">{subtitle}</p>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 text-sm text-purple-200 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
