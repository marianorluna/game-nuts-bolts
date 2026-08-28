import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import { HomeScreen } from './components/HomeScreen'
import { CampaignScreen } from './components/CampaignScreen'
import { LevelScreen } from './components/LevelScreen'
import { LeaderboardScreen } from './components/LeaderboardScreen'
import { SplashScreen } from './components/SplashScreen'
import { UpdateAvailableModal } from './components/UpdateAvailableModal'
import { WhatsNewModal } from './components/WhatsNewModal'
import { GameSessionGuard } from './components/GameSessionGuard'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAppUpdateCheck } from './hooks/useAppUpdateCheck'
import { useWhatsNew } from './hooks/useWhatsNew'
import { CAMPAIGN_1_TALLER, getFlattenedStages, getThemeBackground } from './domain/content/campaignStructure'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const screen = useGameStore((s) => s.screen)
  const session = useGameStore((s) => s.session)
  const homeStageId = useGameStore((s) => s.homeStageId)
  const goHome = useGameStore((s) => s.goHome)
  const whatsNew = useWhatsNew(!showSplash)
  const { update, dismiss } = useAppUpdateCheck(!showSplash && !whatsNew.open)

  const campaignStages = getFlattenedStages(CAMPAIGN_1_TALLER)
  const homeStage =
    campaignStages.find((s) => s.id === homeStageId) ?? campaignStages[0]!
  const themeLevelId =
    screen === 'game' && session
      ? session.levelId
      : screen === 'campaign'
        ? homeStage.levelFrom
        : campaignStages[0]!.levelFrom
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
        {screen === 'leaderboard' && <LeaderboardScreen />}

        {update?.available && update.info && (
          <UpdateAvailableModal
            open
            currentVersion={update.currentVersion}
            availableVersion={update.availableVersion}
            updateInfo={update.info}
            onDismiss={dismiss}
          />
        )}

        <WhatsNewModal
          open={whatsNew.open}
          content={whatsNew.content}
          onDismiss={whatsNew.dismiss}
        />
      </div>
    </ErrorBoundary>
  )
}
