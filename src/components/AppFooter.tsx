import { useState } from 'react'
import { AUTHOR } from '../config/author'
import { CreditsModal } from './CreditsModal'

export function AppFooter() {
  const [creditsOpen, setCreditsOpen] = useState(false)

  return (
    <>
      <footer
        className="shrink-0 py-3 text-center"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      >
        <button
          type="button"
          onClick={() => setCreditsOpen(true)}
          className="text-xs text-purple-300/80 transition hover:text-purple-200"
        >
          {AUTHOR.name} © {new Date().getFullYear()}
        </button>
      </footer>
      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </>
  )
}
