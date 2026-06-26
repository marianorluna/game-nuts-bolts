interface AppLogoProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<AppLogoProps['size']>, string> = {
  xs: 'h-10 w-10 md:h-11 md:w-11',
  sm: 'h-14 w-14 md:h-16 md:w-16',
  md: 'h-16 w-16 md:h-20 md:w-20',
  lg: 'h-28 w-28 md:h-32 md:w-32',
}

export function AppLogo({ className = '', size = 'md' }: AppLogoProps) {
  return (
    <img
      src="/logo.png"
      alt=""
      draggable={false}
      aria-hidden="true"
      className={`object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)] ${SIZE_CLASSES[size]} ${className}`}
    />
  )
}
