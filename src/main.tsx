import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n/I18nProvider'
import { initPushBootstrap } from './application/pushBootstrap'
import { initProgressSync, mergeProgressOnSession } from './application/syncProgress'
import {
  bindAuthStateListener,
  completeWebOAuthCallback,
  createInfrastructure,
  initOAuthHandlers,
  restoreAuthSession,
} from './infrastructure'

const infrastructure = createInfrastructure()

if (infrastructure) {
  bindAuthStateListener(infrastructure.auth)
  initProgressSync(infrastructure)
  initPushBootstrap(infrastructure)
  initOAuthHandlers()
  void (async () => {
    try {
      await completeWebOAuthCallback()
    } catch (err) {
      console.error('[oauth] web callback failed', err)
    }
    const user = await restoreAuthSession(infrastructure.auth)
    if (user) void mergeProgressOnSession(user.id)
  })()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
