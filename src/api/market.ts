import { request } from './auth'

/** [time (unix seconds, candle open, UTC), open, high, low, close, tick volume] */
export type Bar = [number, number, number, number, number, number]

export type MarketData = {
  pair: string
  symbol: string
  timeframe: string
  price: { value: number | null; time: number | null; marketOpen: boolean }
  /** Closed candles, oldest first. */
  bars: Bar[]
}

export type CalendarEvent = {
  time: number
  currency: string
  name: string
  importance: 'medium' | 'high'
  actual: number | null
  forecast: number | null
  previous: number | null
  unit: string
}

/** Candles of a prompt builder timeframe (biquote.io through our API; M1 history is collected by us). */
export function fetchMarketData(pair: string, timeframe: string, limit: number): Promise<MarketData> {
  return request<MarketData>('market', undefined, { pair, timeframe, limit })
}

/** Economic calendar for the instrument's currencies: two days back, three days ahead. */
export async function fetchCalendar(pair: string): Promise<{ currencies: string[]; events: CalendarEvent[] }> {
  return request('calendar', undefined, { pair })
}
