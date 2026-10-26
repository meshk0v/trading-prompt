import logoUrl from '../assets/logo.png'

export default function Logo({ size = 32, opacity = 1 }: { size?: number; opacity?: number }) {
  return <img src={logoUrl} alt="Trading Prompt" width={size} height={size} style={{ display: 'block', flexShrink: 0, objectFit: 'contain', opacity }} />
}
