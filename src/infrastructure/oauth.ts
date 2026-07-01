import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { getSupabaseClient } from './supabase/client'

export const OAUTH_REDIRECT_PATH = 'login-callback'
export const OAUTH_REDIRECT_SCHEME = `com.nutsandbolts.puzzle://${OAUTH_REDIRECT_PATH}`

export function getOAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return OAUTH_REDIRECT_SCHEME
  }
  return `${window.location.origin}/${OAUTH_REDIRECT_PATH}`
}

function extractOAuthCode(url: string): string | null {
  const queryStart = url.indexOf('?')
  const hashStart = url.indexOf('#')

  if (queryStart !== -1) {
    const queryEnd = hashStart !== -1 ? hashStart : url.length
    const code = new URLSearchParams(url.slice(queryStart + 1, queryEnd)).get('code')
    if (code) return code
  }

  if (hashStart !== -1) {
    const code = new URLSearchParams(url.slice(hashStart + 1)).get('code')
    if (code) return code
  }

  return null
}

async function exchangeOAuthCode(code: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.exchangeCodeForSession(code)
  if (error) throw error
}

async function handleOAuthCallbackUrl(url: string): Promise<boolean> {
  const code = extractOAuthCode(url)
  if (!code) return false

  await exchangeOAuthCode(code)

  if (Capacitor.isNativePlatform()) {
    await Browser.close().catch(() => undefined)
  }

  return true
}

function cleanWebOAuthUrl(): void {
  if (Capacitor.isNativePlatform()) return
  window.history.replaceState({}, document.title, window.location.pathname)
}

/**
 * Web: intercambia ?code= al volver del proveedor.
 * Native: escucha deep link com.nutsandbolts.puzzle://login-callback
 */
export function initOAuthHandlers(): () => void {
  if (!Capacitor.isNativePlatform()) {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      void exchangeOAuthCode(code)
        .then(() => cleanWebOAuthUrl())
        .catch((err) => console.error('[oauth] web callback failed', err))
    }
    return () => undefined
  }

  const listener = App.addListener('appUrlOpen', (event) => {
    void handleOAuthCallbackUrl(event.url).catch((err) => {
      console.error('[oauth] deep link failed', err)
    })
  })

  return () => {
    void listener.then((handle) => handle.remove())
  }
}

export async function openOAuthUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, presentationStyle: 'popover' })
    return
  }

  window.location.assign(url)
}
