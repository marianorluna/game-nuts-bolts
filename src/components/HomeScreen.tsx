import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import {
  ALL_CAMPAIGNS,
  getCampaignProgress,
} from '../domain/content/campaignStructure'
import { SettingsModal } from './SettingsModal'
import { CreditsModal } from './CreditsModal'
import { AppFooter } from './AppFooter'
import { CampaignCard } from './CampaignCard'
import { AppLogo } from './AppLogo'
import { getCampaignGridContainerClass } from './campaignGridLayout'

export function HomeScreen() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [creditsOpen, setCreditsOpen] = useState(false)
  const openCampaign = useGameStore((s) => s.openCampaign)
  const progress = useGameStore((s) => s.progress)
  const soundEnabled = useGameStore((s) => s.settings.soundEnabled)

  const isCompleted = (id: number) => (progress.levels[id]?.completed ?? false)
  const campaignCount = ALL_CAMPAIGNS.length

  return (
    <div className="home-ambient-bg flex h-dvh max-h-dvh flex-col overflow-hidden px-4 pt-safe sm:px-6 md:px-8">
      <div className="home-ambient-glows pointer-events-none absolute inset-0" aria-hidden="true" />

      <header className="relative z-10 flex h-14 shrink-0 items-center justify-center md:h-16">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl text-white backdrop-blur-sm transition hover:bg-white/25 md:h-12 md:w-12 md:text-2xl"
          aria-label="Configuración"
        >
          {soundEnabled ? '⚙️' : '🔇'}
        </button>
        <div className="flex items-center justify-center">
          <div className="relative flex items-center">
            <AppLogo
              size="sm"
              className="absolute right-full top-1/2 mr-2 shrink-0 -translate-y-1/2 md:mr-3"
            />
            <h1
              className="text-3xl font-extrabold leading-none tracking-tight text-white md:text-4xl"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}
            >
              Nuts & Bolts
            </h1>
          </div>
        </div>
      </header>

      <main className={`relative z-10 ${getCampaignGridContainerClass(campaignCount)}`}>
        {ALL_CAMPAIGNS.map((campaign) => {
          const { completed, total } = getCampaignProgress(campaign, isCompleted)
          const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

          return (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              completed={completed}
              total={total}
              progressPercent={progressPercent}
              onSelect={() => openCampaign(campaign.id)}
            />
          )
        })}
      </main>

      <div className="relative z-10">
        <AppFooter />
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenCredits={() => {
          setSettingsOpen(false)
          setCreditsOpen(true)
        }}
      />
      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </div>
  )
}
