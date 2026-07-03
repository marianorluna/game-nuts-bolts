import { useEffect, useState } from 'react'
import {
  dismissWhatsNew,
  getWhatsNewContent,
  shouldShowWhatsNew,
} from '../services/releaseNotesService'
import { useTranslation } from '../i18n/useTranslation'

export function useWhatsNew(enabled: boolean) {
  const { locale } = useTranslation()
  const [open, setOpen] = useState(false)
  const content = enabled ? getWhatsNewContent(locale) : null

  useEffect(() => {
    if (!enabled) {
      setOpen(false)
      return
    }
    setOpen(shouldShowWhatsNew())
  }, [enabled])

  const dismiss = () => {
    dismissWhatsNew()
    setOpen(false)
  }

  return { open, content, dismiss }
}
