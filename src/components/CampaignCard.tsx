import type { CampaignMeta } from '../domain/content/campaignStructure'
import { getCampaignCardTheme } from '../domain/content/campaignStructure'

interface CampaignCardProps {
  campaign: CampaignMeta
  completed: number
  total: number
  progressPercent: number
  onSelect: () => void
}

export function CampaignCard({
  campaign,
  completed,
  total,
  progressPercent,
  onSelect,
}: CampaignCardProps) {
  const theme = getCampaignCardTheme(campaign.themeId)
  const { available } = campaign

  return (
    <button
      type="button"
      disabled={!available}
      onClick={onSelect}
      aria-label={
        available
          ? `Entrar a ${campaign.name}`
          : `${campaign.name} — próximamente`
      }
      className={`
        group relative flex w-full max-w-md flex-col items-center justify-center
        overflow-hidden rounded-2xl border-2 p-4 text-center transition
        active:scale-[0.98] md:p-5
        ${theme.cardGradient}
        ${
          available
            ? `${theme.borderActive} hover:brightness-110`
            : `cursor-not-allowed ${theme.borderLocked} saturate-[0.85] brightness-90`
        }
      `}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${theme.patternClass}`}
        aria-hidden="true"
      />
      {!available && (
        <div
          className="pointer-events-none absolute inset-0 bg-black/20"
          aria-hidden="true"
        />
      )}

      {!available && (
        <span
          className={`absolute right-2.5 top-2.5 z-10 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider md:text-[10px] ${theme.badgeClass}`}
        >
          Próximamente
        </span>
      )}

      <div className="relative z-10 mb-1.5 flex items-center justify-center md:mb-2">
        <div
          className={`absolute h-14 w-14 rounded-full blur-2xl md:h-16 md:w-16 ${theme.glowColor} ${available ? 'opacity-100' : 'opacity-50'}`}
          aria-hidden="true"
        />
        <span className="relative text-4xl md:text-5xl" aria-hidden="true">
          {campaign.emoji}
        </span>
      </div>

      <h2 className={`relative z-10 mb-0.5 text-lg font-extrabold md:text-xl ${theme.titleText}`}>
        {campaign.name}
      </h2>
      <p className={`relative z-10 mb-2 w-full text-xs leading-snug md:text-sm ${theme.taglineText}`}>
        {campaign.tagline}
      </p>

      {available && total > 0 && (
        <div className="relative z-10 w-full">
          <div className={`mb-1 flex justify-between text-[10px] font-medium ${theme.taglineText}`}>
            <span>
              {completed}/{total}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className={`h-1.5 overflow-hidden rounded-full ${theme.progressTrack}`}>
            <div
              className={`h-full rounded-full bg-gradient-to-r ${theme.progressFrom} ${theme.progressTo} transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {!available && (
        <span className="relative z-10 text-xl text-white/50 md:text-2xl" aria-hidden="true">
          🔒
        </span>
      )}

      {available && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 transition-opacity group-hover:opacity-40 ${theme.titleText}`}
          aria-hidden="true"
        />
      )}
    </button>
  )
}
