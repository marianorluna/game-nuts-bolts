import { getMedalVisual } from '../domain/challenges/medalVisuals'

interface MedalBadgeProps {
  levelId: number
  earned: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'h-14 w-14 text-lg',
  md: 'h-20 w-20 text-2xl',
  lg: 'h-24 w-24 text-3xl',
}

export function MedalBadge({
  levelId,
  earned,
  size = 'md',
  className = '',
}: MedalBadgeProps) {
  const visual = getMedalVisual(levelId)
  const sizeClass = SIZE_CLASSES[size]

  return (
    <div
      className={`relative flex items-center justify-center ${sizeClass} ${className}`}
      aria-hidden={!earned}
    >
      <div
        className={`absolute inset-0 rotate-[30deg] rounded-lg border-2 ${
          earned
            ? `bg-gradient-to-br ${visual.ringClass} border-white/30 shadow-lg`
            : 'border-white/15 bg-white/5'
        }`}
        style={{
          clipPath:
            'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
        }}
      />
      <div
        className={`relative z-10 flex h-[72%] w-[72%] items-center justify-center rounded-md ${
          earned ? visual.innerClass : 'bg-white/5'
        }`}
        style={{
          clipPath:
            'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
        }}
      >
        <span className={earned ? 'opacity-100' : 'opacity-25 grayscale'}>
          {visual.icon}
        </span>
      </div>
    </div>
  )
}
