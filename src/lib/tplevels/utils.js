/**
 * @typedef {Object} Candle
 * @property {number} time    open time, ms (seconds are auto-detected)
 * @property {number} open
 * @property {number} high
 * @property {number} low
 * @property {number} close
 * @property {number} [volume]
 */

export const isNum = Number.isFinite;
const DAY = 86400000;

export function assertCandles(candles, min = 1) {
  if (!Array.isArray(candles)) throw new TypeError('candles must be an array');
  if (candles.length < min) throw new RangeError(`need at least ${min} candles, got ${candles.length}`);
}

/** time in ms; values below 1e11 are treated as seconds */
export const toMs = (t) => (t < 1e11 ? t * 1000 : t);

/** Wilder ATR. Same length as input, NaN during warm-up. */
export function atr(candles, period = 14) {
  const n = candles.length;
  const out = new Array(n).fill(NaN);
  if (n < period || n === 0) return out;
  const tr = candles.map((c, i) =>
    i === 0
      ? c.high - c.low
      : Math.max(c.high - c.low, Math.abs(c.high - candles[i - 1].close), Math.abs(c.low - candles[i - 1].close))
  );
  let s = 0;
  for (let i = 0; i < period; i++) s += tr[i];
  out[period - 1] = s / period;
  for (let i = period; i < n; i++) out[i] = (out[i - 1] * (period - 1) + tr[i]) / period;
  return out;
}

/** last valid ATR; falls back to the mean candle range on short series */
export function lastAtr(candles, period = 14) {
  const a = atr(candles, period);
  for (let i = a.length - 1; i >= 0; i--) if (isNum(a[i])) return a[i];
  return candles.reduce((s, c) => s + (c.high - c.low), 0) / Math.max(1, candles.length);
}

export function decimals(x) {
  if (!isFinite(x) || x === 0) return 0;
  let d = 0;
  while (d < 12 && Math.abs(Math.round(x * 10 ** d) - x * 10 ** d) > 1e-9 * Math.max(1, Math.abs(x * 10 ** d))) d++;
  return d;
}
export const roundTo = (v, d) => Number(v.toFixed(d));

export function autoDigits(price) {
  const p = Math.abs(price);
  return p < 1 ? 6 : p < 10 ? 5 : p < 1000 ? 3 : 2;
}

export function periodKey(t, period, offH = 0) {
  const s = toMs(t) + offH * 3600000;
  const day = Math.floor(s / DAY);
  if (period === 'day') return day;
  if (period === 'week') return day - ((((day + 3) % 7) + 7) % 7); // Monday-based
  if (period === 'month') {
    const d = new Date(s);
    return d.getUTCFullYear() * 12 + d.getUTCMonth();
  }
  throw new Error("period must be 'day' | 'week' | 'month'");
}

/** Groups candles into calendar periods. */
export function groupByPeriod(candles, period = 'day', tzOffsetHours = 0) {
  const groups = [];
  let cur = null;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const k = periodKey(c.time, period, tzOffsetHours);
    if (!cur || cur.key !== k) {
      cur = { key: k, startIndex: i, endIndex: i, start: c.time, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume || 0 };
      groups.push(cur);
    } else {
      cur.endIndex = i;
      if (c.high > cur.high) cur.high = c.high;
      if (c.low < cur.low) cur.low = c.low;
      cur.close = c.close;
      cur.volume += c.volume || 0;
    }
  }
  return groups;
}
