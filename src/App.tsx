import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import { HomeScreen } from './components/HomeScreen'
import { LevelScreen } from './components/LevelScreen'
import { SplashScreen } from './components/SplashScreen'
import { UpdateAvailableModal } from './components/UpdateAvailableModal'
import { useAppUpdateCheck } from './hooks/useAppUpdateCheck'
import { getThemeBackground } from './domain/content/campaignStructure'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const screen = useGameStore((s) => s.screen)
  const session = useGameStore((s) => s.session)
  const progress = useGameStore((s) => s.progress)
  const { update, dismiss } = useAppUpdateCheck(!showSplash)

  const themeLevelId =
    screen === 'game' && session ? session.levelId : progress.unlockedLevel
  const themeClass = getThemeBackground(themeLevelId)

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  return (
    <div className={`min-h-dvh w-full transition-colors duration-500 ${themeClass}`}>
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
