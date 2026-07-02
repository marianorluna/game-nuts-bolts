import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import { HomeScreen } from './components/HomeScreen'
import { CampaignScreen } from './components/CampaignScreen'
import { LevelScreen } from './components/LevelScreen'
import { SplashScreen } from './components/SplashScreen'
import { UpdateAvailableModal } from './components/UpdateAvailableModal'
import { GameSessionGuard } from './components/GameSessionGuard'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAppUpdateCheck } from './hooks/useAppUpdateCheck'
import { getThemeBackground, SECTION_1_FUNDAMENTOS } from './domain/content/campaignStructure'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const screen = useGameStore((s) => s.screen)
  const session = useGameStore((s) => s.session)
  const homeStageId = useGameStore((s) => s.homeStageId)
  const goHome = useGameStore((s) => s.goHome)
  const { update, dismiss } = useAppUpdateCheck(!showSplash)

  const homeStage =
    SECTION_1_FUNDAMENTOS.stages.find((s) => s.id === homeStageId) ??
    SECTION_1_FUNDAMENTOS.stages[0]!
  const themeLevelId =
    screen === 'game' && session
      ? session.levelId
      : screen === 'campaign'
        ? homeStage.levelFrom
        : SECTION_1_FUNDAMENTOS.stages[0]!.levelFrom
  const themeClass = getThemeBackground(themeLevelId)

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  return (
    <ErrorBoundary onReset={goHome}>
      <div className={`min-h-dvh w-full transition-colors duration-500 ${themeClass}`}>
        <GameSessionGuard />
        {screen === 'home' && <HomeScreen />}
        {screen === 'campaign' && <CampaignScreen />}
        {screen === 'game' && <LevelScreen />}

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
    </ErrorBoundary>
  )
}
