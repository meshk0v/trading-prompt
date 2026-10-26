import { useEffect, useState } from 'react'
import PairFlag from './PairFlag'

const TV_SYMBOL: Record<string, string> = {
  'BTC/USD': 'BINANCE:BTCUSDT', 'ETH/USD': 'BINANCE:ETHUSDT',
  'BNB/USD': 'BINANCE:BNBUSDT', 'XRP/USD': 'BINANCE:XRPUSDT',
  'SOL/USD': 'BINANCE:SOLUSDT', 'ADA/USD': 'BINANCE:ADAUSDT',
  'AVAX/USD': 'BINANCE:AVAXUSDT', 'DOT/USD': 'BINANCE:DOTUSDT',
  'MATIC/USD': 'BINANCE:MATICUSDT', 'LINK/USD': 'BINANCE:LINKUSDT',
  'LTC/USD': 'BINANCE:LTCUSDT', 'ATOM/USD': 'BINANCE:ATOMUSDT',
  'DOGE/USD': 'BINANCE:DOGEUSDT', 'TRX/USD': 'BINANCE:TRXUSDT',
  'EUR/USD': 'FX:EURUSD', 'GBP/USD': 'FX:GBPUSD', 'USD/JPY': 'FX:USDJPY',
  'XAU/USD': 'TVC:GOLD',  'AUD/USD': 'FX:AUDUSD', 'USD/CHF': 'FX:USDCHF',
  'GBP/JPY': 'FX:GBPJPY', 'NZD/USD': 'FX:NZDUSD', 'USD/CAD': 'FX:USDCAD',
  'EUR/GBP': 'FX:EURGBP', 'EUR/JPY': 'FX:EURJPY', 'OIL/USD': 'TVC:USOIL',
  'USD/TRY': 'FX:USDTRY', 'EUR/CHF': 'FX:EURCHF', 'AUD/CAD': 'FX:AUDCAD',
  'USD/ZAR': 'FX:USDZAR', 'USD/NOK': 'FX:USDNOK', 'GBP/CHF': 'FX:GBPCHF',
  'EUR/AUD': 'FX:EURAUD', 'XAG/USD': 'TVC:SILVER',
}

const TV_INTERVAL: Record<string, string> = {
  M1: '1',
  M2: '2',
  M3: '3',
  M4: '4',
  M5: '5',
  M10: '10',
  M12: '12',
  M15: '15',
  M20: '20',
  M30: '30',
  H1: '60',
  H2: '120',
  H3: '180',
  H4: '240',
  H6: '360',
  H8: '480',
  H12: '720',
  D1: 'D',
  W1: 'W',
  MN: 'M',
}

function TradingViewWidget({ pair, timeframe = 'D1' }: { pair: string; timeframe?: string }) {
  const symbol = TV_SYMBOL[pair] ?? `FX:${pair.replace('/', '')}`
  const encoded = encodeURIComponent(symbol)
  const interval = TV_INTERVAL[timeframe] ?? 'D'
  const src = `https://s.tradingview.com/widgetembed/?symbol=${encoded}&interval=${interval}&hidesidetoolbar=1&hidetoptoolbar=0&locale=ru&theme=dark&style=1&timezone=Etc%2FUTC&hide_legend=0&hide_volume=0&allow_symbol_change=1&save_image=0&studies=%5B%5D&show_popup_button=0`

  return (
    <iframe
      src={src}
      style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      scrolling="no"
      allowFullScreen={true}
      title={`TradingView ${pair}`}
    />
  )
}

export default function PromptTradingView({ pair, timeframe }: { pair: string; timeframe: string }) {
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!fullscreen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [fullscreen])

  return (
    <>
      <div className="prompt-chart">
        <TradingViewWidget pair={pair} timeframe={timeframe} />
        <button
          type="button"
          className="prompt-chart-open"
          onClick={() => setFullscreen(true)}
          aria-label={`Открыть график ${pair} на всю страницу`}
          title="Открыть график на всю страницу"
        >
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {fullscreen && (
        <div className="prompt-chart-fullscreen" role="dialog" aria-modal="true" aria-label={`График TradingView ${pair}`}>
          <div className="prompt-chart-fullscreen-header">
            <div className="prompt-chart-fullscreen-title">
              <PairFlag pair={pair} size={18} />
              <span>{pair}</span>
              <span className="prompt-chart-timeframe">{timeframe}</span>
            </div>
            <button
              type="button"
              className="prompt-chart-close"
              onClick={() => setFullscreen(false)}
              aria-label="Закрыть полноэкранный график"
              title="Свернуть график"
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 6h4V2M14 6h-4V2M2 10h4v4M14 10h-4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="prompt-chart-fullscreen-body">
            <TradingViewWidget pair={pair} timeframe={timeframe} />
          </div>
        </div>
      )}
    </>
  )
}
