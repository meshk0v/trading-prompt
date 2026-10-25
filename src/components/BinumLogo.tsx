import biNumLogo from '../imports/logo_yellow_white_48.png'

const Binum_LOGO = ({ size = 32, opacity = 1 }: { size?: number; opacity?: number }) => (
  <img src={biNumLogo} alt="Trading Prompt" width={size} height={size} style={{ display: 'block', flexShrink: 0, objectFit: 'contain', opacity }} />
)

export default Binum_LOGO
