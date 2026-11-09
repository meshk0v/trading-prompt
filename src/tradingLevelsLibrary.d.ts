export type TradingCandle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  trades?: number
  buyVolume?: number
}

declare const TPL: {
  analyzeLevels: (candles: TradingCandle[], options?: Record<string, unknown>) => Record<string, any>
  analyzeTicks: (rows: unknown[], options?: Record<string, unknown>) => Record<string, any> | null
  analyzeCalendar: (events: unknown[], options?: Record<string, unknown>) => Record<string, any>
  inferCountries: (symbol: string) => {
    kind: string
    currencies: string[]
    countries: string[]
  }
  buildPrompt: (
    result: Record<string, any>,
    candles: TradingCandle[],
    options?: Record<string, unknown>,
  ) => string
  buildReport: (
    result: Record<string, any>,
    candles: TradingCandle[],
    options?: Record<string, unknown>,
  ) => string
  renderChart: (
    candles: TradingCandle[],
    result: Record<string, any>,
    options?: Record<string, unknown> & { canvas?: HTMLCanvasElement },
  ) => HTMLCanvasElement
  chartToBlob: (canvas: HTMLCanvasElement) => Promise<Blob>
  CHART_KEYS: string[]
  CHART_PRESETS: Record<string, {
    w: number
    h: number
    fs: number
    bars: number
    label: string
    maxPanels: number
  }>
  TOGGLES: Array<{
    id: string
    chart?: boolean
    label: string
    items: Array<[string, string]>
  }>
  TOGGLE_KEYS: string[]
}

export default TPL
