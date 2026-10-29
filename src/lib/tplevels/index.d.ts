// Types for the parts of tplevels used by the site (the library itself is plain JavaScript).

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume?: number }

/** Result of analyzeLevels: levels, zones and indicators; read only by the functions below. */
export type LevelsResult = Record<string, unknown>

export function analyzeLevels(candles: Candle[], opts?: Record<string, unknown>): LevelsResult

export function buildPrompt(
  r: LevelsResult,
  candles: Candle[],
  o?: {
    symbol?: string
    timeframe?: string
    bars?: number
    lang?: 'ru' | 'en'
    levels?: boolean
    indicators?: boolean
    lastBarOpen?: boolean | null
    volumeKind?: 'real' | 'tick' | null
    digits?: number
  },
): string

export function candlesTable(candles: Candle[], n?: number, o?: { digits?: number }): string
