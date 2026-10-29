import { assertCandles, atr, isNum } from './utils.js';

/**
 * Fractal swings: a bar is a swing high if its high is strictly above `left`
 * bars before it and not below `right` bars after it (mirror for lows).
 * A swing is only known `right` bars after it formed (no repainting).
 * @returns {{index:number,time:number,type:'high'|'low',price:number}[]}
 */
export function findSwings(candles, { left = 3, right = 3 } = {}) {
  assertCandles(candles);
  const out = [];
  const n = candles.length;
  for (let i = left; i < n - right; i++) {
    let isH = true, isL = true;
    for (let k = 1; k <= left; k++) {
      if (candles[i - k].high >= candles[i].high) isH = false;
      if (candles[i - k].low <= candles[i].low) isL = false;
    }
    for (let k = 1; k <= right; k++) {
      if (candles[i + k].high > candles[i].high) isH = false;
      if (candles[i + k].low < candles[i].low) isL = false;
    }
    if (isH) out.push({ index: i, time: candles[i].time, type: 'high', price: candles[i].high });
    if (isL) out.push({ index: i, time: candles[i].time, type: 'low', price: candles[i].low });
  }
  return out;
}

/**
 * ZigZag: alternating pivots, a reversal is confirmed when price retraces
 * from the extreme by `percent` (fraction, e.g. 0.01) or by `atrMult` * ATR.
 * The last pivot may be unconfirmed (`confirmed: false`) - it is the current extreme.
 */
export function zigzag(candles, { percent = null, atrMult = 2.5, period = 14 } = {}) {
  assertCandles(candles);
  const n = candles.length;
  const at = atr(candles, period);
  const fallback = candles.reduce((s, c) => s + (c.high - c.low), 0) / Math.max(1, n);
  const thr = (i) =>
    percent != null ? candles[i].close * percent : (isNum(at[i]) ? at[i] : fallback) * atrMult;
  const mk = (i, type, price, confirmed = true) => ({ index: i, time: candles[i].time, type, price, confirmed });

  const piv = [];
  let dir = 0, hiI = 0, loI = 0, ext = 0, extI = 0;
  for (let i = 1; i < n; i++) {
    const c = candles[i];
    const t = thr(i);
    if (dir === 0) {
      if (c.high > candles[hiI].high) hiI = i;
      if (c.low < candles[loI].low) loI = i;
      if (c.high - candles[loI].low >= t && loI < i) {
        piv.push(mk(loI, 'low', candles[loI].low));
        dir = 1; ext = c.high; extI = i;
      } else if (candles[hiI].high - c.low >= t && hiI < i) {
        piv.push(mk(hiI, 'high', candles[hiI].high));
        dir = -1; ext = c.low; extI = i;
      }
      continue;
    }
    if (dir === 1) {
      if (c.high >= ext) { ext = c.high; extI = i; }
      else if (ext - c.low >= t) {
        piv.push(mk(extI, 'high', ext));
        dir = -1; ext = c.low; extI = i;
      }
    } else {
      if (c.low <= ext) { ext = c.low; extI = i; }
      else if (c.high - ext >= t) {
        piv.push(mk(extI, 'low', ext));
        dir = 1; ext = c.high; extI = i;
      }
    }
  }
  if (dir !== 0) piv.push(mk(extI, dir === 1 ? 'high' : 'low', ext, false));
  return piv;
}
