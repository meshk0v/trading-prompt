import {
  ADX,
  ATR,
  BollingerBands,
  CCI,
  EMA,
  MACD,
  OBV,
  RSI,
  SMA,
  StochasticOscillator,
  VWAP,
  WilliamsR,
} from 'trading-signals'
import type { Bar } from '../api/market'

/** How a value is printed: like a price, a price difference (one more digit), 0–100 scale, or a whole number. */
export type ValueKind = 'price' | 'delta' | 'scale' | 'count'

export type IndicatorColumn = { title: string; kind: ValueKind; values: (number | null)[] }

type Candle = { open: number; high: number; low: number; close: number; volume: number }
type Column = { title: string; kind: ValueKind; next: (candle: Candle, time: number) => number | null }

/** Columns of one indicator from the prompt settings, fed candle by candle. */
type Definition = () => Column[]

const simple = (title: string, kind: ValueKind, update: (candle: Candle) => number | null): Column => ({
  title,
  kind,
  next: candle => update(candle),
})

/** Several columns read from one indicator result (MACD lines, Bollinger bands, %K and %D). */
function split<T>(update: (candle: Candle) => T | null, columns: [string, ValueKind, (result: T) => number][]) {
  let last: T | null = null
  return columns.map(([title, kind, read], index) => ({
    title,
    kind,
    next: (candle: Candle) => {
      if (index === 0) last = update(candle)
      return last === null ? null : read(last)
    },
  }))
}

/** Volume-weighted average price of the current UTC day; the volume is the tick volume. */
function sessionVwap(): Column {
  let day = -1
  let vwap = new VWAP()
  return {
    title: 'VWAP',
    kind: 'price',
    next: (candle, time) => {
      const candleDay = Math.floor(time / 86400)
      if (candleDay !== day) {
        day = candleDay
        vwap = new VWAP()
      }
      return vwap.update({ ...candle, volume: Math.max(candle.volume, 1) }, false)
    },
  }
}

/** Ids and parameters match the indicator list in the prompt settings (data/promptSettings.ts). */
const DEFINITIONS: Record<string, Definition> = {
  sma: () =>
    [20, 50, 200].map(period => {
      const sma = new SMA(period)
      return simple(`SMA ${period}`, 'price', candle => sma.update(candle.close, false))
    }),
  ema: () =>
    [12, 26, 50].map(period => {
      const ema = new EMA(period)
      // EMA returns a value from the first candle; it is reliable only after `period` candles.
      return simple(`EMA ${period}`, 'price', candle => {
        const value = ema.update(candle.close, false)
        return ema.isStable ? value : null
      })
    }),
  macd: () => {
    const macd = new MACD(new EMA(12), new EMA(26), new EMA(9))
    return split(
      candle => macd.update(candle.close, false),
      [
        ['MACD 12/26', 'delta', result => result.macd],
        ['MACD Signal 9', 'delta', result => result.signal],
        ['MACD Hist', 'delta', result => result.histogram],
      ],
    )
  },
  adx: () => {
    const adx = new ADX(14)
    return [simple('ADX 14', 'scale', candle => adx.update(candle, false))]
  },
  rsi: () => {
    const rsi = new RSI(14)
    return [simple('RSI 14', 'scale', candle => rsi.update(candle.close, false))]
  },
  stoch: () => {
    const stoch = new StochasticOscillator({ kPeriod: 14, kSlowingPeriod: 3, dPeriod: 3 })
    return split(
      candle => stoch.update(candle, false),
      [
        ['Stoch %K 14/3', 'scale', result => result.stochK],
        ['Stoch %D 3', 'scale', result => result.stochD],
      ],
    )
  },
  cci: () => {
    const cci = new CCI(20)
    return [simple('CCI 20', 'scale', candle => cci.update(candle, false))]
  },
  williams: () => {
    const williams = new WilliamsR(14)
    return [simple('Williams %R 14', 'scale', candle => williams.update(candle, false))]
  },
  bb: () => {
    const bands = new BollingerBands(20, 2)
    return split(
      candle => bands.update(candle.close, false),
      [
        ['BB 20/2 upper', 'price', result => result.upper],
        ['BB 20/2 middle', 'price', result => result.middle],
        ['BB 20/2 lower', 'price', result => result.lower],
      ],
    )
  },
  atr: () => {
    const atr = new ATR(14)
    return [simple('ATR 14', 'delta', candle => atr.update(candle, false))]
  },
  obv: () => {
    const obv = new OBV(2)
    return [simple('OBV', 'count', candle => obv.update(candle, false))]
  },
  vwap: () => [sessionVwap()],
}

/**
 * Indicators selected in the prompt settings, calculated over all candles (so long periods like
 * SMA 200 have enough history) and returned for the last `count` candles.
 */
export function calculateIndicators(bars: Bar[], ids: string[], count: number): IndicatorColumn[] {
  const columns = ids.flatMap(id => DEFINITIONS[id]?.() ?? [])
  const values = columns.map(() => [] as (number | null)[])
  for (const [time, open, high, low, close, volume] of bars) {
    const candle = { open, high, low, close, volume }
    columns.forEach((column, index) => {
      const value = column.next(candle, time)
      values[index].push(value === null || !Number.isFinite(value) ? null : value)
    })
  }
  return columns.map((column, index) => ({
    title: column.title,
    kind: column.kind,
    values: values[index].slice(-count),
  }))
}
