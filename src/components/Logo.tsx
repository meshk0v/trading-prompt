import logoUrl from '../assets/logo.png'

export default function Logo({ size = 32, opacity }: { size?: number; opacity?: number }) {
  return (
    <img
      className="logo"
      src={logoUrl}
      alt="Trading Prompt"
      width={size}
      height={size}
      style={opacity === undefined ? undefined : { opacity }}
    />
  )
}
