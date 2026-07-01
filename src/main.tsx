import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n/I18nProvider'
import { initProgressSync, mergeProgressOnSession } from './application/syncProgress'
import {
  bindAuthStateListener,
  createInfrastructure,
  restoreAuthSession,
} from './infrastructure'

const infrastructure = createInfrastructure()
if (infrastructure) {
  bindAuthStateListener(infrastructure.auth)
  initProgressSync(infrastructure)
  void restoreAuthSession(infrastructure.auth).then((user) => {
    if (user) void mergeProgressOnSession(user.id)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
