import biNumLogo from '../imports/trading-prompt-logo.png'

const Binum_LOGO = ({ size = 32, opacity = 1 }: { size?: number; opacity?: number }) => {
  const renderedSize = Math.round(size * 0.72)

  return (
    <img src={biNumLogo} alt="Trading Prompt" width={renderedSize} height={renderedSize} style={{ display: 'block', flexShrink: 0, objectFit: 'contain', opacity }} />
  )
}

export default Binum_LOGO
