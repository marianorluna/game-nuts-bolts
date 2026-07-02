import type { AuthUser } from '../infrastructure/contracts/AuthRepository'
import { getUserDisplayInitial } from '../domain/authDisplay'

interface UserAvatarProps {
  user: AuthUser
  className?: string
}

export function UserAvatar({ user, className = '' }: UserAvatarProps) {
  const initial = getUserDisplayInitial(user)

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        draggable={false}
        referrerPolicy="no-referrer"
        className={`h-full w-full rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <span
      className={`flex h-full w-full items-center justify-center rounded-full bg-amber-400/30 font-bold uppercase text-white ${className}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}
