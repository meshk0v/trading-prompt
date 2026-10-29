import { assertCandles, atr, lastAtr, isNum } from './utils.js';
import { findSwings } from './swings.js';

/* ---------- Support / resistance zones (clusters of swing points) ---------- */

/**
 * Horizontal S/R zones: swing highs/lows that lie close to each other are merged.
 * kind is relative to the last close: 'support' (zone below), 'resistance' (above), 'inside'.
 * `flipped` = both swing highs and swing lows formed here (role reversal).
 */
export function srZones(candles, o = {}) {
  assertCandles(candles, 10);
  const { left = 3, right = 3, tolAtr = 0.5, maxWidthAtr = 1.5, minTouches = 2, maxZones = 8 } = o;
  const n = candles.length;
  const a = lastAtr(candles);
  const tol = a * tolAtr;
  const sw = [...(o.swings ?? findSwings(candles, { left, right }))].sort((x, y) => x.price - y.price);

  const clusters = [];
  let cur = null;
  for (const s of sw) {
    if (cur && s.price - cur.members[cur.members.length - 1].price <= tol && s.price - cur.members[0].price <= a * maxWidthAtr) {
      cur.members.push(s);
    } else {
      cur = { members: [s] };
      clusters.push(cur);
    }
  }
  const last = candles[n - 1].close;
  const zones = clusters
    .filter((c) => c.members.length >= minTouches)
    .map((c) => {
      let low = Math.min(...c.members.map((m) => m.price));
      let high = Math.max(...c.members.map((m) => m.price));
      const minW = a * 0.3;
      if (high - low < minW) { const mid = (low + high) / 2; low = mid - minW / 2; high = mid + minW / 2; }
      const highs = c.members.filter((m) => m.type === 'high').length;
      const lows = c.members.length - highs;
      const recency = c.members.reduce((s, m) => s + m.index / n, 0);
      return {
        type: 'sr',
        kind: last > high ? 'support' : last < low ? 'resistance' : 'inside',
        low, high, mid: (low + high) / 2,
        touches: c.members.length, highs, lows, flipped: highs > 0 && lows > 0,
        firstIndex: Math.min(...c.members.map((m) => m.index)),
        lastIndex: Math.max(...c.members.map((m) => m.index)),
        strength: c.members.length + recency,
      };
    });
  zones.sort((x, y) => y.strength - x.strength);
  return zones.slice(0, maxZones).sort((x, y) => x.mid - y.mid);
}

/* ---------- Supply / demand (base + impulse) ---------- */

/**
 * Demand: small-bodied base candles followed by a strong bullish impulse. Supply: mirror.
 * Zone = base range (demand: lowest low .. highest body top; supply: lowest body bottom .. highest high).
 * status: 'fresh' (price has not come back), 'tested' (touched `tests` times), 'broken' (close beyond far edge).
 */
export function supplyDemandZones(candles, o = {}) {
  assertCandles(candles, 20);
  const { period = 14, impulseAtr = 1.5, baseMax = 3, baseBodyAtr = 0.6, includeBroken = false, maxZones = 6 } = o;
  const n = candles.length;
  const at = atr(candles, period);
  const zones = [];

  for (let i = 1; i < n; i++) {
    const c = candles[i];
    const a = at[i - 1];
    if (!isNum(a)) continue;
    if (Math.abs(c.close - c.open) < impulseAtr * a) continue;
    const dir = c.close > c.open ? 1 : -1;

    const base = [];
    for (let s = i - 1; s >= 0 && base.length < baseMax; s--) {
      if (Math.abs(candles[s].close - candles[s].open) <= baseBodyAtr * a) base.unshift(s);
      else break;
    }
    if (!base.length) continue;

    const bc = base.map((k) => candles[k]);
    let low, high;
    if (dir > 0) {
      low = Math.min(...bc.map((x) => x.low));
      high = Math.max(...bc.map((x) => Math.max(x.open, x.close)));
      if (c.close <= high) continue;
    } else {
      high = Math.max(...bc.map((x) => x.high));
      low = Math.min(...bc.map((x) => Math.min(x.open, x.close)));
      if (c.close >= low) continue;
    }

    let tests = 0, broken = false, inside = false;
    for (let k = i + 1; k < n; k++) {
      const x = candles[k];
      if (dir > 0 ? x.close < low : x.close > high) { broken = true; break; }
      if (x.low <= high && x.high >= low) { if (!inside) { tests++; inside = true; } } else inside = false;
    }
    if (broken && !includeBroken) continue;

    zones.push({
      type: dir > 0 ? 'demand' : 'supply',
      low, high, mid: (low + high) / 2,
      baseStart: base[0], baseEnd: base[base.length - 1], impulseIndex: i,
      time: candles[base[0]].time,
      strength: Math.abs(c.close - c.open) / a,
      tests,
      status: broken ? 'broken' : tests === 0 ? 'fresh' : 'tested',
    });
  }
  return zones.slice(-maxZones);
}

/* ---------- Fair value gaps (imbalance, 3-candle gap) ---------- */

/** Bullish: low[i] > high[i-2]; bearish: high[i] < low[i-2]. status: open / partial / filled. */
export function fairValueGaps(candles, o = {}) {
  assertCandles(candles, 3);
  const { period = 14, minAtr = 0.1, includeFilled = false, maxZones = 10 } = o;
  const n = candles.length;
  const at = atr(candles, period);
  const out = [];

  for (let i = 2; i < n; i++) {
    const a0 = candles[i - 2], c2 = candles[i];
    let low, high, type;
    if (c2.low > a0.high) { low = a0.high; high = c2.low; type = 'bullish'; }
    else if (c2.high < a0.low) { low = c2.high; high = a0.low; type = 'bearish'; }
    else continue;
    const size = high - low;
    if (isNum(at[i]) && size < minAtr * at[i]) continue;

    let fill = 0;
    for (let k = i + 1; k < n; k++) {
      const f = type === 'bullish' ? (high - candles[k].low) / size : (candles[k].high - low) / size;
      if (f > fill) fill = f;
      if (fill >= 1) break;
    }
    fill = Math.min(1, Math.max(0, fill));
    const status = fill >= 1 ? 'filled' : fill > 0 ? 'partial' : 'open';
    if (status === 'filled' && !includeFilled) continue;
    out.push({ type, low, high, mid: (low + high) / 2, size, index: i, time: candles[i - 1].time, fillPct: fill * 100, status });
  }
  return out.slice(-maxZones);
}

/* ---------- Order blocks (simplified SMC) ---------- */

/**
 * Bullish OB: the last bearish candle before the leg that closes above the last confirmed swing high (BOS).
 * Bearish OB: mirror. A simplified, rule-based version - there is no single canonical definition.
 */
export function orderBlocks(candles, o = {}) {
  assertCandles(candles, 15);
  const { left = 3, right = 3, includeBroken = false, maxZones = 6, lookback = 5 } = o;
  const n = candles.length;
  const sw = o.swings ?? findSwings(candles, { left, right });
  const highs = sw.filter((s) => s.type === 'high');
  const lows = sw.filter((s) => s.type === 'low');
  let hp = -1, lp = -1, brokenH = -1, brokenL = -1;
  const found = new Map();

  const add = (type, idx, bos) => {
    const key = `${type}:${idx}`;
    if (found.has(key)) return;
    const c = candles[idx];
    found.set(key, { type, low: c.low, high: c.high, mid: (c.low + c.high) / 2, index: idx, time: c.time, bosIndex: bos });
  };

  for (let i = 0; i < n; i++) {
    while (hp + 1 < highs.length && highs[hp + 1].index + right <= i) hp++;
    while (lp + 1 < lows.length && lows[lp + 1].index + right <= i) lp++;
    const H = hp >= 0 ? highs[hp] : null;
    const L = lp >= 0 ? lows[lp] : null;

    if (H && H.index !== brokenH && candles[i].close > H.price && H.index < i) {
      brokenH = H.index;
      let o2 = H.index;
      for (let k = H.index; k <= i; k++) if (candles[k].low < candles[o2].low) o2 = k;
      for (let k = o2; k >= Math.max(0, o2 - lookback); k--) {
        if (candles[k].close < candles[k].open) { add('bullish', k, i); break; }
      }
    }
    if (L && L.index !== brokenL && candles[i].close < L.price && L.index < i) {
      brokenL = L.index;
      let o2 = L.index;
      for (let k = L.index; k <= i; k++) if (candles[k].high > candles[o2].high) o2 = k;
      for (let k = o2; k >= Math.max(0, o2 - lookback); k--) {
        if (candles[k].close > candles[k].open) { add('bearish', k, i); break; }
      }
    }
  }

  const out = [];
  for (const ob of found.values()) {
    let tests = 0, broken = false, inside = false;
    for (let k = ob.bosIndex + 1; k < n; k++) {
      const x = candles[k];
      if (ob.type === 'bullish' ? x.close < ob.low : x.close > ob.high) { broken = true; break; }
      if (x.low <= ob.high && x.high >= ob.low) { if (!inside) { tests++; inside = true; } } else inside = false;
    }
    if (broken && !includeBroken) continue;
    out.push({ ...ob, tests, status: broken ? 'broken' : tests === 0 ? 'fresh' : 'tested' });
  }
  return out.sort((a, b) => a.index - b.index).slice(-maxZones);
}

/* ---------- Consolidation ranges ---------- */

/** Sideways ranges: at least `minBars` bars whose total high-low range is within `rangeAtr` * ATR. */
export function consolidationRanges(candles, o = {}) {
  assertCandles(candles, 10);
  const { minBars = 10, rangeAtr = 3, maxZones = 5 } = o;
  const n = candles.length;
  const at = atr(candles);
  const fb = lastAtr(candles);
  const out = [];
  let i = 0;
  while (i + minBars <= n) {
    const a = isNum(at[i + minBars - 1]) ? at[i + minBars - 1] : fb;
    const thr = a * rangeAtr;
    let hi = -Infinity, lo = Infinity;
    for (let k = i; k < i + minBars; k++) { hi = Math.max(hi, candles[k].high); lo = Math.min(lo, candles[k].low); }
    if (hi - lo > thr) { i++; continue; }
    let j = i + minBars;
    while (j < n && Math.max(hi, candles[j].high) - Math.min(lo, candles[j].low) <= thr) {
      hi = Math.max(hi, candles[j].high); lo = Math.min(lo, candles[j].low); j++;
    }
    const lastC = candles[n - 1].close;
    out.push({
      type: 'range', low: lo, high: hi, mid: (lo + hi) / 2,
      startIndex: i, endIndex: j - 1, bars: j - i, active: j === n,
      breakout: j === n ? null : candles[j].close > hi ? 'up' : candles[j].close < lo ? 'down' : null,
    });
    i = j;
  }
  return out.slice(-maxZones);
}
