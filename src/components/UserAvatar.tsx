import type { CSSProperties } from 'react'

type UserAvatarProps = { src: string; name: string; size: number; style?: CSSProperties }

/** The user's uploaded photo, or the first letter of the name when there is none. */
export default function UserAvatar({ src, name, size, style }: UserAvatarProps) {
  if (src) {
    return <img src={src} alt="Фото пользователя" style={{ width: size, height: size, flexShrink: 0, objectFit: 'cover', ...style }} />
  }
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(139,124,255,0.14)', color: '#B9AFFF', fontFamily: 'Outfit, sans-serif',
        fontSize: Math.round(size * 0.42), fontWeight: 700, ...style,
      }}
    >
      {(name.trim()[0] || '?').toUpperCase()}
    </div>
  )
}
