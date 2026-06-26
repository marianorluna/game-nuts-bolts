import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import { HomeScreen } from './components/HomeScreen'
import { LevelScreen } from './components/LevelScreen'
import { SplashScreen } from './components/SplashScreen'
import { UpdateAvailableModal } from './components/UpdateAvailableModal'
import { useAppUpdateCheck } from './hooks/useAppUpdateCheck'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const screen = useGameStore((s) => s.screen)
  const { update, dismiss } = useAppUpdateCheck(!showSplash)

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-[#3d2a6b] to-[#2d1b4e]">
      {screen === 'home' ? <HomeScreen /> : <LevelScreen />}

      {update?.available && update.info && update.currentVersion && update.availableVersion && (
        <UpdateAvailableModal
          open
          currentVersion={update.currentVersion}
          availableVersion={update.availableVersion}
          updateInfo={update.info}
          onDismiss={dismiss}
        />
      )}
    </div>
  )
}
