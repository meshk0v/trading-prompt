import { assertCandles, lastAtr, isNum } from './utils.js';
import { findSwings } from './swings.js';

/** Price of a trend line at a bar index (lines are defined in bar-index space). */
export const valueAt = (line, index) => line.p1.price + line.slope * (index - line.p1.index);

/**
 * Trend lines through pairs of swing points.
 * support: through swing LOWS, closes must not break below the line.
 * resistance: through swing HIGHS, closes must not break above the line.
 * touches counts the 2 anchors + other swings within tolerance.
 *
 * @param {import('./utils.js').Candle[]} candles
 * @param {Object} [o]
 * @param {number} [o.left=3]
 * @param {number} [o.right=3]
 * @param {number} [o.maxSwings=10]    use the last N swings of each type
 * @param {number} [o.tolAtr=0.25]     tolerance in ATR
 * @param {number} [o.minTouches=3]
 * @param {number} [o.minSpan=5]       min bars between anchors
 * @param {number} [o.maxViolations=0] allowed closes beyond the line
 * @param {number} [o.top=3]           lines per type
 */
export function findTrendlines(candles, o = {}) {
  assertCandles(candles, 10);
  const { left = 3, right = 3, maxSwings = 10, tolAtr = 0.25, minTouches = 3, minSpan = 5, maxViolations = 0, top = 3 } = o;
  const n = candles.length;
  const tol = lastAtr(candles) * tolAtr;
  const swings = o.swings ?? findSwings(candles, { left, right });
  const res = { support: [], resistance: [] };

  for (const [type, name] of [['low', 'support'], ['high', 'resistance']]) {
    const pts = swings.filter((s) => s.type === type).slice(-maxSwings);
    const found = [];
    for (let i = 0; i < pts.length - 1; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const p1 = pts[i], p2 = pts[j];
        if (p2.index - p1.index < minSpan) continue;
        const slope = (p2.price - p1.price) / (p2.index - p1.index);
        const at = (idx) => p1.price + slope * (idx - p1.index);

        let violations = 0;
        for (let k = p1.index; k < n; k++) {
          const c = candles[k].close;
          if (name === 'support' ? c < at(k) - tol : c > at(k) + tol) {
            if (++violations > maxViolations) break;
          }
        }
        if (violations > maxViolations) continue;

        const touchIdx = [p1.index, p2.index];
        for (let k = 0; k < pts.length; k++) {
          if (k === i || k === j || pts[k].index < p1.index) continue;
          if (Math.abs(pts[k].price - at(pts[k].index)) <= tol) touchIdx.push(pts[k].index);
        }
        if (touchIdx.length < minTouches) continue;

        const span = p2.index - p1.index;
        const flat = Math.abs(slope * span) < tol;
        found.push({
          type: name,
          trend: flat ? 'flat' : slope > 0 ? 'up' : 'down',
          p1, p2, slope, touches: touchIdx.length, touchIndices: touchIdx.sort((a, b) => a - b),
          violations,
          valueNow: at(n - 1),
          score: touchIdx.length * 2 + (span / n) * 3 + (p2.index / n) * 2,
        });
      }
    }
    found.sort((a, b) => b.score - a.score);
    const picked = [];
    for (const l of found) {
      const dup = picked.some(
        (q) => Math.abs(q.valueNow - l.valueNow) <= tol && Math.abs(valueAt(q, l.p1.index) - l.p1.price) <= tol
      );
      if (!dup) picked.push(l);
      if (picked.length >= top) break;
    }
    res[name] = picked;
  }
  return res;
}

/**
 * Channel: a parallel line through the most extreme opposite point since the anchor.
 * support line -> upper line at the highest high; resistance line -> lower line at the lowest low.
 */
export function trendChannel(candles, line) {
  const n = candles.length;
  let off = 0;
  for (let k = line.p1.index; k < n; k++) {
    const v = valueAt(line, k);
    off = line.type === 'support' ? Math.max(off, candles[k].high - v) : Math.min(off, candles[k].low - v);
  }
  return {
    base: line,
    offset: off,
    baseNow: line.valueNow,
    oppositeNow: line.valueNow + off,
    width: Math.abs(off),
  };
}

/**
 * Linear regression channel over the last `period` closes: mid line +/- mult * stddev.
 * @returns {{slope,intercept,startIndex,mid,upper,lower,stdev,r2,trend}}
 */
export function regressionChannel(candles, { period = 50, mult = 2 } = {}) {
  assertCandles(candles, 3);
  const n = candles.length;
  const m = Math.min(period, n);
  const start = n - m;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < m; i++) {
    const y = candles[start + i].close;
    sx += i; sy += y; sxx += i * i; sxy += i * y;
  }
  const den = m * sxx - sx * sx;
  const slope = den === 0 ? 0 : (m * sxy - sx * sy) / den;
  const intercept = (sy - slope * sx) / m;
  let ssRes = 0, ssTot = 0;
  const mean = sy / m;
  for (let i = 0; i < m; i++) {
    const y = candles[start + i].close;
    const f = intercept + slope * i;
    ssRes += (y - f) ** 2;
    ssTot += (y - mean) ** 2;
  }
  const stdev = Math.sqrt(ssRes / m);
  const mid = intercept + slope * (m - 1);
  return {
    slope, intercept, startIndex: start, mid,
    upper: mid + mult * stdev, lower: mid - mult * stdev, stdev,
    r2: ssTot === 0 ? 1 : 1 - ssRes / ssTot,
    trend: slope > 0 ? 'up' : slope < 0 ? 'down' : 'flat',
  };
}
