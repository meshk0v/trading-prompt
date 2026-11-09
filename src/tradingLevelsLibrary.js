const TPL=(()=>{
/**
 * @typedef {Object} Candle
 * @property {number} time    open time, ms (seconds are auto-detected)
 * @property {number} open
 * @property {number} high
 * @property {number} low
 * @property {number} close
 * @property {number} [volume]
 */

const isNum = Number.isFinite;
const DAY = 86400000;

function assertCandles(candles, min = 1) {
  if (!Array.isArray(candles)) throw new TypeError('candles must be an array');
  if (candles.length < min) throw new RangeError(`need at least ${min} candles, got ${candles.length}`);
}

/** time in ms; values below 1e11 are treated as seconds */
const toMs = (t) => (t < 1e11 ? t * 1000 : t);

/** Wilder ATR. Same length as input, NaN during warm-up. */
function atr(candles, period = 14) {
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
function lastAtr(candles, period = 14) {
  const a = atr(candles, period);
  for (let i = a.length - 1; i >= 0; i--) if (isNum(a[i])) return a[i];
  return candles.reduce((s, c) => s + (c.high - c.low), 0) / Math.max(1, candles.length);
}

function decimals(x) {
  if (!isFinite(x) || x === 0) return 0;
  let d = 0;
  while (d < 12 && Math.abs(Math.round(x * 10 ** d) - x * 10 ** d) > 1e-9 * Math.max(1, Math.abs(x * 10 ** d))) d++;
  return d;
}
const roundTo = (v, d) => Number(v.toFixed(d));

function autoDigits(price) {
  const p = Math.abs(price);
  return p < 1 ? 6 : p < 10 ? 5 : p < 1000 ? 3 : 2;
}

function periodKey(t, period, offH = 0) {
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
function groupByPeriod(candles, period = 'day', tzOffsetHours = 0) {
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


/**
 * Fractal swings: a bar is a swing high if its high is strictly above `left`
 * bars before it and not below `right` bars after it (mirror for lows).
 * A swing is only known `right` bars after it formed (no repainting).
 * @returns {{index:number,time:number,type:'high'|'low',price:number}[]}
 */
function findSwings(candles, { left = 3, right = 3 } = {}) {
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
function zigzag(candles, { percent = null, atrMult = 2.5, period = 14 } = {}) {
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


/** Heuristic steps: minor = 2 orders below price, major = 1 order below. EURUSD 1.08 -> 0.01 / 0.1; BTC 67000 -> 100 / 1000. */
function autoStep(price) {
  const e = Math.floor(Math.log10(Math.abs(price)));
  return { minor: 10 ** (e - 2), major: 10 ** (e - 1) };
}

/**
 * Round (psychological) levels around a price.
 * @param {number} price
 * @param {{step?:number, majorStep?:number, count?:number}} [o] count = levels on each side
 */
function roundLevels(price, { step, majorStep, count = 4 } = {}) {
  const auto = autoStep(price);
  step = step ?? auto.minor;
  majorStep = majorStep ?? Math.max(auto.major, step);
  const d = decimals(step);
  const base = Math.round(price / step);
  const out = [];
  for (let k = -count; k <= count; k++) {
    const v = (base + k) * step;
    const m = v / majorStep;
    out.push({
      kind: 'round',
      price: roundTo(v, d),
      major: Math.abs(m - Math.round(m)) < 1e-6,
      distance: roundTo(v - price, d + 2),
      distancePct: ((v - price) / price) * 100,
    });
  }
  return out;
}



const FIB_RETRACEMENT = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_EXTENSION = [0.618, 1, 1.272, 1.618, 2, 2.618];
const FIB_PROJECTION = [1.272, 1.618, 2, 2.618];

const P = (x) => (typeof x === 'number' ? x : x.price);

/** Retracement of move a->b: 0 = b (the end), 1 = a (the start). */
function fibRetracement(a, b, ratios = FIB_RETRACEMENT) {
  const pa = P(a), pb = P(b);
  return ratios.map((ratio) => ({ kind: 'fib', ratio, price: pb - (pb - pa) * ratio }));
}

/** ABC extension: targets from point c, measured by the length of a->b. */
function fibExtension(a, b, c, ratios = FIB_EXTENSION) {
  const pa = P(a), pb = P(b), pc = P(c);
  return ratios.map((ratio) => ({ kind: 'fib-ext', ratio, price: pc + (pb - pa) * ratio }));
}

/** Projection of move a->b beyond b: price = a + (b - a) * ratio (1.272, 1.618 ...). */
function fibProjection(a, b, ratios = FIB_PROJECTION) {
  const pa = P(a), pb = P(b);
  return ratios.map((ratio) => ({ kind: 'fib-proj', ratio, price: pa + (pb - pa) * ratio }));
}

/**
 * Fibonacci on the last completed ZigZag leg.
 * `includeCurrentLeg: true` also uses the still-forming extreme as point b.
 * @returns {null | {a,b,direction,retracements,projections,currentRatio}}
 */
function autoFib(candles, { includeCurrentLeg = false, percent = null, atrMult = 2.5, pivots } = {}) {
  assertCandles(candles, 5);
  let piv = pivots ?? zigzag(candles, { percent, atrMult });
  if (!includeCurrentLeg) piv = piv.filter((p) => p.confirmed);
  if (piv.length < 2) return null;
  const a = piv[piv.length - 2], b = piv[piv.length - 1];
  const last = candles[candles.length - 1].close;
  return {
    a, b,
    direction: b.price > a.price ? 'up' : 'down',
    retracements: fibRetracement(a, b),
    projections: fibProjection(a, b),
    currentRatio: (b.price - last) / (b.price - a.price), // 0.5 = price is at 50% of the leg
  };
}


/**
 * Pivot points from one period's OHLC.
 * methods: 'classic' | 'fibonacci' | 'woodie' (TradingView style) | 'camarilla' | 'demark'
 */
function pivotPoints({ high: H, low: L, close: C, open: O }, method = 'classic') {
  const R = H - L;
  switch (method) {
    case 'classic': {
      const p = (H + L + C) / 3;
      return { P: p, R1: 2 * p - L, R2: p + R, R3: H + 2 * (p - L), S1: 2 * p - H, S2: p - R, S3: L - 2 * (H - p) };
    }
    case 'fibonacci': {
      const p = (H + L + C) / 3;
      return { P: p, R1: p + 0.382 * R, R2: p + 0.618 * R, R3: p + R, S1: p - 0.382 * R, S2: p - 0.618 * R, S3: p - R };
    }
    case 'woodie': {
      const p = (H + L + 2 * C) / 4;
      return { P: p, R1: 2 * p - L, R2: p + R, R3: H + 2 * (p - L), S1: 2 * p - H, S2: p - R, S3: L - 2 * (H - p) };
    }
    case 'camarilla': {
      const k = 1.1;
      return {
        P: (H + L + C) / 3,
        R1: C + (R * k) / 12, R2: C + (R * k) / 6, R3: C + (R * k) / 4, R4: C + (R * k) / 2,
        S1: C - (R * k) / 12, S2: C - (R * k) / 6, S3: C - (R * k) / 4, S4: C - (R * k) / 2,
      };
    }
    case 'demark': {
      const x = C < O ? H + 2 * L + C : C > O ? 2 * H + L + C : H + L + 2 * C;
      return { P: x / 4, R1: x / 2 - L, S1: x / 2 - H };
    }
    default:
      throw new Error(`unknown pivot method: ${method}`);
  }
}

/** Pivots for the current period, based on the last COMPLETED period. */
function pivotsFromCandles(candles, { period = 'day', method = 'classic', tzOffsetHours = 0 } = {}) {
  assertCandles(candles);
  const g = groupByPeriod(candles, period, tzOffsetHours);
  if (g.length < 2) return null;
  const prev = g[g.length - 2];
  return {
    method, period,
    basedOn: { start: prev.start, open: prev.open, high: prev.high, low: prev.low, close: prev.close },
    levels: pivotPoints(prev, method),
  };
}


const TAG = { day: 'D', week: 'W', month: 'M' };

/**
 * Previous / current period levels.
 * previous: PDH PDL PDC (PWH.., PMH..), current: DO DH DL (WO.., MO..)
 */
function periodLevels(candles, { period = 'day', tzOffsetHours = 0 } = {}) {
  assertCandles(candles);
  const g = groupByPeriod(candles, period, tzOffsetHours);
  const t = TAG[period];
  const cur = g[g.length - 1];
  const prev = g.length > 1 ? g[g.length - 2] : null;
  const list = [];
  if (prev) {
    list.push({ kind: 'period', name: `P${t}H`, price: prev.high });
    list.push({ kind: 'period', name: `P${t}L`, price: prev.low });
    list.push({ kind: 'period', name: `P${t}C`, price: prev.close });
  }
  list.push({ kind: 'period', name: `${t}O`, price: cur.open });
  list.push({ kind: 'period', name: `${t}H`, price: cur.high });
  list.push({ kind: 'period', name: `${t}L`, price: cur.low });
  return {
    period,
    previous: prev && { start: prev.start, open: prev.open, high: prev.high, low: prev.low, close: prev.close },
    current: { start: cur.start, open: cur.open, high: cur.high, low: cur.low },
    list,
  };
}

/**
 * High/low of trading sessions (hours in UTC + tzOffsetHours, [from, to) ).
 * Returns the last two days, newest first. Names: AsiaH, AsiaL, LondonH ... (previous day: pAsiaH ...)
 */
function sessionRanges(
  candles,
  { sessions = { Asia: [0, 8], London: [7, 16], NewYork: [13, 22] }, tzOffsetHours = 0 } = {}
) {
  assertCandles(candles);
  const days = groupByPeriod(candles, 'day', tzOffsetHours).slice(-2).reverse();
  const out = [];
  days.forEach((d, di) => {
    for (const [name, [from, to]] of Object.entries(sessions)) {
      let hi = -Infinity, lo = Infinity, cnt = 0;
      for (let i = d.startIndex; i <= d.endIndex; i++) {
        const h = new Date(toMs(candles[i].time) + tzOffsetHours * 3600000).getUTCHours();
        if (h >= from && h < to) {
          cnt++;
          if (candles[i].high > hi) hi = candles[i].high;
          if (candles[i].low < lo) lo = candles[i].low;
        }
      }
      if (cnt) {
        const p = di === 0 ? '' : 'p';
        out.push({ kind: 'session', name: `${p}${name}H`, price: hi });
        out.push({ kind: 'session', name: `${p}${name}L`, price: lo });
      }
    }
  });
  return out;
}



/** Price of a trend line at a bar index (lines are defined in bar-index space). */
const valueAt = (line, index) => line.p1.price + line.slope * (index - line.p1.index);

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
function findTrendlines(candles, o = {}) {
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
function trendChannel(candles, line) {
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
function regressionChannel(candles, { period = 50, mult = 2 } = {}) {
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



/* ---------- Support / resistance zones (clusters of swing points) ---------- */

/**
 * Horizontal S/R zones: swing highs/lows that lie close to each other are merged.
 * kind is relative to the last close: 'support' (zone below), 'resistance' (above), 'inside'.
 * `flipped` = both swing highs and swing lows formed here (role reversal).
 */
function srZones(candles, o = {}) {
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
function supplyDemandZones(candles, o = {}) {
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
function fairValueGaps(candles, o = {}) {
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
function orderBlocks(candles, o = {}) {
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
function consolidationRanges(candles, o = {}) {
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


/**
 * Volume profile from candles (candle volume is spread evenly over its high-low range).
 * Gives POC, value area (VAH/VAL) and high/low volume nodes.
 * For exact results feed it tick data aggregated per price level instead.
 */
function volumeProfile(candles, { bins = 48, valueArea = 0.7, from = 0, to = candles.length } = {}) {
  assertCandles(candles, 2);
  const cs = candles.slice(from, to);
  let lo = Infinity, hi = -Infinity;
  for (const c of cs) { if (c.low < lo) lo = c.low; if (c.high > hi) hi = c.high; }
  if (!(hi > lo)) return null;
  const size = (hi - lo) / bins;
  const vol = new Array(bins).fill(0);

  for (const c of cs) {
    const v = c.volume ?? 1;
    const b0 = Math.min(bins - 1, Math.floor((c.low - lo) / size));
    const b1 = Math.min(bins - 1, Math.floor((c.high - lo) / size));
    const share = v / (b1 - b0 + 1);
    for (let b = b0; b <= b1; b++) vol[b] += share;
  }

  const total = vol.reduce((s, x) => s + x, 0);
  let poc = 0;
  for (let b = 1; b < bins; b++) if (vol[b] > vol[poc]) poc = b;

  let l = poc, r = poc, acc = vol[poc];
  while (acc < total * valueArea && (l > 0 || r < bins - 1)) {
    const up = r < bins - 1 ? vol[r + 1] + (r + 2 < bins ? vol[r + 2] : 0) : -1;
    const dn = l > 0 ? vol[l - 1] + (l - 2 >= 0 ? vol[l - 2] : 0) : -1;
    if (up >= dn) { r++; acc += vol[r]; } else { l--; acc += vol[l]; }
  }

  const mean = total / bins;
  const nodes = [];
  for (let b = 1; b < bins - 1; b++) {
    const mid = lo + (b + 0.5) * size;
    if (vol[b] > vol[b - 1] && vol[b] >= vol[b + 1] && vol[b] > mean * 1.2) nodes.push({ kind: 'hvn', price: mid, volume: vol[b] });
    if (vol[b] < vol[b - 1] && vol[b] <= vol[b + 1] && vol[b] < mean * 0.6) nodes.push({ kind: 'lvn', price: mid, volume: vol[b] });
  }

  return {
    poc: lo + (poc + 0.5) * size,
    vah: lo + (r + 1) * size,
    val: lo + l * size,
    low: lo, high: hi, binSize: size,
    bins: vol.map((v, b) => ({ low: lo + b * size, high: lo + (b + 1) * size, volume: v })),
    nodes,
  };
}



const NaNs = (n) => new Array(n).fill(NaN);
const lastOf = (a, k = 0) => a[a.length - 1 - k];
const sign = Math.sign;

/* ---------------- series (TA-Lib style: same length, NaN during warm-up) ---------------- */
function sma(v, p) {
  const out = NaNs(v.length);
  for (let i = p - 1; i < v.length; i++) {
    let s = 0, ok = true;
    for (let k = i - p + 1; k <= i; k++) { if (!isNum(v[k])) { ok = false; break; } s += v[k]; }
    if (ok) out[i] = s / p;
  }
  return out;
}
function ema(v, p) {
  const out = NaNs(v.length), k = 2 / (p + 1);
  let cnt = 0, sum = 0, started = false;
  for (let i = 0; i < v.length; i++) {
    if (!isNum(v[i])) { if (!started) { cnt = 0; sum = 0; } continue; }
    if (!started) { sum += v[i]; if (++cnt === p) { started = true; out[i] = sum / p; } }
    else out[i] = v[i] * k + out[i - 1] * (1 - k);
  }
  return out;
}
function rsi(c, p = 14) {
  const n = c.length, out = NaNs(n);
  if (n <= p) return out;
  let g = 0, l = 0;
  for (let i = 1; i <= p; i++) { const d = c[i] - c[i - 1]; if (d > 0) g += d; else l -= d; }
  g /= p; l /= p;
  const val = () => (g === 0 && l === 0 ? 50 : l === 0 ? 100 : 100 - 100 / (1 + g / l));
  out[p] = val();
  for (let i = p + 1; i < n; i++) {
    const d = c[i] - c[i - 1];
    g = (g * (p - 1) + Math.max(d, 0)) / p; l = (l * (p - 1) + Math.max(-d, 0)) / p;
    out[i] = val();
  }
  return out;
}
function macd(c, f = 12, s = 26, g = 9) {
  const ef = ema(c, f), es = ema(c, s), line = c.map((_, i) => ef[i] - es[i]), signal = ema(line, g);
  return { macd: line, signal, hist: line.map((x, i) => x - signal[i]) };
}
function stochastic(h, l, c, k = 14, d = 3, sm = 3) {
  const raw = NaNs(c.length);
  for (let i = k - 1; i < c.length; i++) {
    let hh = -Infinity, ll = Infinity;
    for (let j = i - k + 1; j <= i; j++) { hh = Math.max(hh, h[j]); ll = Math.min(ll, l[j]); }
    raw[i] = hh === ll ? 50 : (100 * (c[i] - ll)) / (hh - ll);
  }
  const K = sma(raw, sm);
  return { k: K, d: sma(K, d) };
}
/** Wilder ADX with +DI / -DI */
function adx(h, l, c, p = 14) {
  const n = c.length, A = NaNs(n), PD = NaNs(n), MD = NaNs(n), dx = NaNs(n);
  if (n < 2 * p + 1) return { adx: A, plusDI: PD, minusDI: MD };
  let sT = 0, sP = 0, sM = 0;
  for (let i = 1; i < n; i++) {
    const up = h[i] - h[i - 1], dn = l[i - 1] - l[i];
    const pm = up > dn && up > 0 ? up : 0, mm = dn > up && dn > 0 ? dn : 0;
    const tr = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]));
    if (i <= p) { sT += tr; sP += pm; sM += mm; } else { sT += tr - sT / p; sP += pm - sP / p; sM += mm - sM / p; }
    if (i >= p) {
      PD[i] = sT ? (100 * sP) / sT : 0; MD[i] = sT ? (100 * sM) / sT : 0;
      const s = PD[i] + MD[i]; dx[i] = s ? (100 * Math.abs(PD[i] - MD[i])) / s : 0;
    }
  }
  let a = 0; for (let i = p; i < 2 * p; i++) a += dx[i];
  A[2 * p - 1] = a / p;
  for (let i = 2 * p; i < n; i++) A[i] = (A[i - 1] * (p - 1) + dx[i]) / p;
  return { adx: A, plusDI: PD, minusDI: MD };
}
/** Supertrend: dir = 1 (up, line under price) / -1 (down, line above price) */
function supertrend(candles, p = 10, m = 3) {
  const n = candles.length, at = atr(candles, p), line = NaNs(n), dir = NaNs(n);
  let fu = 0, fl = 0, d = 0, started = false;
  for (let i = 0; i < n; i++) {
    if (!isNum(at[i])) continue;
    const c = candles[i], hl2 = (c.high + c.low) / 2, ub = hl2 + m * at[i], lb = hl2 - m * at[i];
    if (!started) { fu = ub; fl = lb; d = c.close > hl2 ? 1 : -1; started = true; }
    else {
      const pc = candles[i - 1].close, pfu = fu, pfl = fl;
      fu = ub < pfu || pc > pfu ? ub : pfu;
      fl = lb > pfl || pc < pfl ? lb : pfl;
      if (d === -1 && c.close > fu) d = 1; else if (d === 1 && c.close < fl) d = -1;
    }
    dir[i] = d; line[i] = d === 1 ? fl : fu;
  }
  return { line, dir };
}
function bollinger(c, p = 20, m = 2) {
  const n = c.length, mid = sma(c, p), up = NaNs(n), lo = NaNs(n), pb = NaNs(n), bw = NaNs(n);
  for (let i = p - 1; i < n; i++) {
    let s = 0; for (let k = i - p + 1; k <= i; k++) s += (c[k] - mid[i]) ** 2;
    const sd = Math.sqrt(s / p);
    up[i] = mid[i] + m * sd; lo[i] = mid[i] - m * sd;
    pb[i] = up[i] === lo[i] ? 0.5 : (c[i] - lo[i]) / (up[i] - lo[i]); bw[i] = (up[i] - lo[i]) / mid[i];
  }
  return { mid, upper: up, lower: lo, pctB: pb, bandwidth: bw };
}
function donchian(h, l, p = 20) {
  const n = h.length, up = NaNs(n), lo = NaNs(n);
  for (let i = p - 1; i < n; i++) {
    let hh = -Infinity, ll = Infinity;
    for (let j = i - p + 1; j <= i; j++) { hh = Math.max(hh, h[j]); ll = Math.min(ll, l[j]); }
    up[i] = hh; lo[i] = ll;
  }
  return { upper: up, lower: lo, mid: up.map((x, i) => (x + lo[i]) / 2) };
}
function obv(c, v) {
  const out = [0];
  for (let i = 1; i < c.length; i++) out.push(out[i - 1] + (c[i] > c[i - 1] ? v[i] : c[i] < c[i - 1] ? -v[i] : 0));
  return out;
}
/** relative volume: volume / mean of previous p bars */
function rvol(v, p = 20) {
  const out = NaNs(v.length);
  for (let i = p; i < v.length; i++) { let s = 0; for (let k = i - p; k < i; k++) s += v[k]; out[i] = s ? v[i] / (s / p) : NaN; }
  return out;
}
/** daily-anchored VWAP (typical price * volume) */
function vwap(candles, tz = 0) {
  const out = NaNs(candles.length);
  for (const d of groupByPeriod(candles, 'day', tz)) {
    let pv = 0, v = 0;
    for (let i = d.startIndex; i <= d.endIndex; i++) {
      const c = candles[i], w = c.volume || 0;
      pv += ((c.high + c.low + c.close) / 3) * w; v += w;
      out[i] = v > 0 ? pv / v : NaN;
    }
  }
  return out;
}
/** Ichimoku snapshot for the last bar (cloud = values from `shift` bars ago). null if < senkou+shift bars. */
function ichimoku(h, l, c, { tenkan = 9, kijun = 26, senkou = 52, shift = 26 } = {}) {
  const n = h.length;
  if (n < senkou + shift) return null;
  const mid = (i, p) => { let hh = -Infinity, ll = Infinity; for (let j = i - p + 1; j <= i; j++) { hh = Math.max(hh, h[j]); ll = Math.min(ll, l[j]); } return (hh + ll) / 2; };
  const i = n - 1, j = i - shift, t = mid(i, tenkan), k = mid(i, kijun);
  const a = (mid(j, tenkan) + mid(j, kijun)) / 2, b = mid(j, senkou);
  return {
    tenkan: t, kijun: k, spanA: a, spanB: b, futureSpanA: (t + k) / 2, futureSpanB: mid(i, senkou),
    cloud: a >= b ? 'bullish' : 'bearish',
    price: c[i] > Math.max(a, b) ? 'above' : c[i] < Math.min(a, b) ? 'below' : 'inside',
    tk: t > k ? 'bullish' : t < k ? 'bearish' : 'flat',
    chikou: c[i] > c[i - shift] ? 'above' : 'below',
  };
}

/* ---------------- price-action helpers ---------------- */
/** Candle patterns on the last `lookback` bars. */
function candlePatterns(candles, { lookback = 3 } = {}) {
  const A = lastAtr(candles), out = [], n = candles.length;
  for (let i = Math.max(1, n - lookback); i < n; i++) {
    const c = candles[i], p = candles[i - 1], body = Math.abs(c.close - c.open), rng = c.high - c.low;
    if (rng <= 0) continue;
    const up = c.high - Math.max(c.open, c.close), lw = Math.min(c.open, c.close) - c.low, add = (name) => out.push({ index: i, barsAgo: n - 1 - i, name });
    if (body <= 0.1 * rng) add('doji');
    if (lw >= 0.6 * rng && body <= 0.3 * rng) add('bullish_pin_bar');
    if (up >= 0.6 * rng && body <= 0.3 * rng) add('bearish_pin_bar');
    if (body >= 0.9 * rng && rng >= 1.2 * A) add(c.close > c.open ? 'bullish_marubozu' : 'bearish_marubozu');
    const pb = Math.abs(p.close - p.open);
    if (p.close < p.open && c.close > c.open && c.open <= p.close && c.close >= p.open && body > pb) add('bullish_engulfing');
    if (p.close > p.open && c.close < c.open && c.open >= p.close && c.close <= p.open && body > pb) add('bearish_engulfing');
    if (c.high < p.high && c.low > p.low) add('inside_bar');
    if (c.high > p.high && c.low < p.low) add('outside_bar');
  }
  return out;
}
/** HH/HL/LH/LL from the last two swing highs and lows. */
function marketStructure(swings) {
  const hs = swings.filter((s) => s.type === 'high').slice(-2), ls = swings.filter((s) => s.type === 'low').slice(-2);
  if (hs.length < 2 || ls.length < 2) return null;
  const h = hs[1].price > hs[0].price ? 'HH' : 'LH', l = ls[1].price > ls[0].price ? 'HL' : 'LL';
  return { trend: h === 'HH' && l === 'HL' ? 'uptrend' : h === 'LH' && l === 'LL' ? 'downtrend' : 'range', labels: [h, l], lastHigh: hs[1].price, lastLow: ls[1].price };
}
/** Regular RSI divergence between the last two swing lows (bullish) / highs (bearish). */
function rsiDivergence(rsiArr, swings, { maxAge = 40 } = {}) {
  const n = rsiArr.length, out = [];
  for (const [type, kind] of [['low', 'bullish'], ['high', 'bearish']]) {
    const s = swings.filter((x) => x.type === type).slice(-2);
    if (s.length < 2 || n - 1 - s[1].index > maxAge) continue;
    const r0 = rsiArr[s[0].index], r1 = rsiArr[s[1].index];
    if (!isNum(r0) || !isNum(r1)) continue;
    const hit = kind === 'bullish' ? s[1].price < s[0].price && r1 > r0 : s[1].price > s[0].price && r1 < r0;
    if (hit) out.push({ type: kind, barsAgo: n - 1 - s[1].index, price: [s[0].price, s[1].price], rsi: [r0, r1] });
  }
  return out;
}

/* ---------------- snapshot ---------------- */
function cross(a, b) {
  const s = sign(lastOf(a) - lastOf(b));
  if (!s) return { state: 'flat', barsAgo: null };
  for (let k = 1; k < a.length; k++) {
    const x = sign(lastOf(a, k) - lastOf(b, k));
    if (!isNum(x)) break;
    if (x !== 0 && x !== s) return { state: s > 0 ? 'bullish' : 'bearish', barsAgo: k - 1 };
  }
  return { state: s > 0 ? 'bullish' : 'bearish', barsAgo: null };
}

/**
 * One representative indicator per class (+ price-action helpers).
 * Volume indicators appear only if the candles carry volume (tick volume counts, see meta.volumeKind).
 * o: { history: N (arrays of last N bars), series: true (full arrays for charts), swings, tzOffsetHours, volumeKind, params }
 */
function analyzeIndicators(candles, o = {}) {
  assertCandles(candles, 30);
  const n = candles.length, tz = o.tzOffsetHours ?? 0;
  const p = { ema: 20, rsi: 14, adx: 14, atr: 14, bb: 20, bbMult: 2, don: 20, stoch: [14, 3, 3], macd: [12, 26, 9], st: [10, 3], ...(o.params || {}) };
  const H = candles.map((c) => c.high), Lw = candles.map((c) => c.low), C = candles.map((c) => c.close), V = candles.map((c) => c.volume || 0);
  const price = C[n - 1], A = lastAtr(candles), hasVolume = V.some((x) => x > 0);
  const swings = o.swings ?? findSwings(candles);
  const E = ema(C, p.ema), R = rsi(C, p.rsi), M = macd(C, ...p.macd), S = stochastic(H, Lw, C, ...p.stoch), X = adx(H, Lw, C, p.adx);
  const ST = supertrend(candles, ...p.st), B = bollinger(C, p.bb, p.bbMult), D = donchian(H, Lw, p.don), AT = atr(candles, p.atr);
  const VW = hasVolume ? vwap(candles, tz) : null, OB = hasVolume ? obv(C, V) : null, RV = hasVolume ? rvol(V, 20) : null;
  const slope = (a, k = 5) => { const d = (lastOf(a) - lastOf(a, k)) / A; return d > 0.3 ? 'up' : d < -0.3 ? 'down' : 'flat'; };
  const safe = (f) => { try { return f(); } catch { return null; } };

  const bwv = B.bandwidth.filter(isNum).slice(-100), atrv = AT.filter(isNum).slice(-50);
  const x = lastOf(X.adx), dir = lastOf(ST.dir);
  let flip = 0; while (flip < n - 1 && lastOf(ST.dir, flip + 1) === dir) flip++;
  const prevHi = Math.max(...H.slice(-p.don - 1, -1)), prevLo = Math.min(...Lw.slice(-p.don - 1, -1));
  const obvDelta = hasVolume ? lastOf(OB) - lastOf(OB, 20) : 0, pxDelta = price - C[n - 21];

  const I = {
    meta: { count: n, price, atr: A, hasVolume, volumeKind: hasVolume ? o.volumeKind ?? 'unknown' : null },
    trend: {
      ema: { period: p.ema, value: lastOf(E), price: price > lastOf(E) ? 'above' : 'below', distanceAtr: (price - lastOf(E)) / A, slope: slope(E) },
      adx: { period: p.adx, value: x, plusDI: lastOf(X.plusDI), minusDI: lastOf(X.minusDI), direction: lastOf(X.plusDI) > lastOf(X.minusDI) ? 'up' : 'down',
        strength: x < 20 ? 'weak' : x < 25 ? 'developing' : x < 40 ? 'strong' : 'very_strong', rising: x > lastOf(X.adx, 3) },
      supertrend: { value: lastOf(ST.line), direction: dir === 1 ? 'up' : 'down', barsSinceFlip: flip },
      ichimoku: safe(() => ichimoku(H, Lw, C)),
      structure: marketStructure(swings),
    },
    momentum: {
      rsi: { period: p.rsi, value: lastOf(R), zone: lastOf(R) >= 70 ? 'overbought' : lastOf(R) <= 30 ? 'oversold' : 'neutral', divergence: rsiDivergence(R, swings) },
      macd: { macd: lastOf(M.macd), signal: lastOf(M.signal), hist: lastOf(M.hist), histTrend: lastOf(M.hist) > lastOf(M.hist, 1) ? 'rising' : 'falling', cross: cross(M.macd, M.signal) },
      stochastic: { k: lastOf(S.k), d: lastOf(S.d), zone: lastOf(S.k) >= 80 ? 'overbought' : lastOf(S.k) <= 20 ? 'oversold' : 'neutral', cross: cross(S.k, S.d) },
    },
    volatility: {
      atr: { period: p.atr, value: A, pct: (A / price) * 100, state: atrv.length ? (A / (atrv.reduce((s, v) => s + v, 0) / atrv.length) > 1.2 ? 'expanding' : A / (atrv.reduce((s, v) => s + v, 0) / atrv.length) < 0.8 ? 'contracting' : 'normal') : 'normal' },
      bollinger: { upper: lastOf(B.upper), mid: lastOf(B.mid), lower: lastOf(B.lower), pctB: lastOf(B.pctB), bandwidth: lastOf(B.bandwidth),
        squeeze: bwv.length >= 30 && lastOf(B.bandwidth) <= [...bwv].sort((a, b) => a - b)[Math.floor(bwv.length * 0.2)],
        position: lastOf(B.pctB) > 1 ? 'above_upper' : lastOf(B.pctB) < 0 ? 'below_lower' : 'inside' },
      donchian: { upper: lastOf(D.upper), lower: lastOf(D.lower), mid: lastOf(D.mid), pos: (price - lastOf(D.lower)) / (lastOf(D.upper) - lastOf(D.lower) || 1), breakout: price > prevHi ? 'up' : price < prevLo ? 'down' : null },
    },
    volume: hasVolume ? {
      vwap: { value: lastOf(VW), price: price > lastOf(VW) ? 'above' : 'below', distanceAtr: (price - lastOf(VW)) / A },
      obv: { value: lastOf(OB), trend: obvDelta > 0 ? 'up' : obvDelta < 0 ? 'down' : 'flat', confirmsPrice: sign(obvDelta) === sign(pxDelta) },
      rvol: { value: lastOf(RV), state: lastOf(RV) > 1.5 ? 'high' : lastOf(RV) < 0.5 ? 'low' : 'normal' },
    } : null,
    patterns: candlePatterns(candles),
  };

  const vote = (name, v) => ({ name, vote: v });
  const items = [
    vote('EMA', I.trend.ema.price === 'above' ? 1 : -1),
    vote('ADX', x >= 20 ? (I.trend.adx.direction === 'up' ? 1 : -1) : 0),
    vote('Supertrend', dir),
    vote('Ichimoku', I.trend.ichimoku ? { above: 1, below: -1, inside: 0 }[I.trend.ichimoku.price] : 0),
    vote('Structure', I.trend.structure ? { uptrend: 1, downtrend: -1, range: 0 }[I.trend.structure.trend] : 0),
    vote('MACD', sign(I.momentum.macd.hist) || 0),
    vote('RSI', lastOf(R) > 55 ? 1 : lastOf(R) < 45 ? -1 : 0),
    vote('Stoch', I.momentum.stochastic.cross.state === 'bullish' ? 1 : I.momentum.stochastic.cross.state === 'bearish' ? -1 : 0),
  ];
  if (hasVolume) items.push(vote('VWAP', I.volume.vwap.price === 'above' ? 1 : -1), vote('OBV', I.volume.obv.trend === 'up' ? 1 : I.volume.obv.trend === 'down' ? -1 : 0));
  I.votes = { bull: items.filter((i) => i.vote > 0).length, bear: items.filter((i) => i.vote < 0).length, neutral: items.filter((i) => i.vote === 0).length, items };

  const N = o.history | 0;
  if (N > 0) {
    const sl = (a) => a.slice(-N).map((v) => (isNum(v) ? +v.toPrecision(7) : null));
    I.history = { time: candles.slice(-N).map((c) => c.time), close: sl(C), ema: sl(E), rsi: sl(R), macdHist: sl(M.hist), adx: sl(X.adx), stochK: sl(S.k), atr: sl(AT), bbPctB: sl(B.pctB), stDir: sl(ST.dir) };
    if (hasVolume) Object.assign(I.history, { vwap: sl(VW), obv: sl(OB), rvol: sl(RV) });
  }
  if (o.series) I.series = { ema: E, stLine: ST.line, stDir: ST.dir, bbUpper: B.upper, bbMid: B.mid, bbLower: B.lower, vwap: VW };
  return I;
}

function indicatorsToCSV(history, digits = 5) {
  const keys = Object.keys(history), n = history.time.length;
  const rows = [keys.join(',')];
  for (let i = 0; i < n; i++) rows.push(keys.map((k) => (k === 'time' ? new Date(history.time[i]).toISOString().slice(0, 16) : history[k][i] == null ? '' : +history[k][i].toFixed(digits))).join(','));
  return rows.join('\n');
}

/** Compact text for LLM prompts. */
function indicatorsNumeric(I, { lang, digits, off = new Set() }) {
  const on = (k) => !off.has(k), w = (ru, en) => (lang === 'en' ? en : ru), f = (v) => (isNum(v) ? v.toFixed(digits) : 'n/a'), n = (v, d = 2) => (isNum(v) ? v.toFixed(d) : 'n/a');
  const T = I.trend, M = I.momentum, V = I.volatility, b = V.bollinger, dn = V.donchian, L = [];
  if (on('ind.ema')) L.push(`- EMA(${T.ema.period}): ${f(T.ema.value)}`);
  if (on('ind.adx')) L.push(`- ADX(${T.adx.period}): ${n(T.adx.value, 1)}, +DI ${n(T.adx.plusDI, 1)}, -DI ${n(T.adx.minusDI, 1)}`);
  if (on('ind.supertrend')) L.push(`- Supertrend: ${f(T.supertrend.value)}`);
  if (T.ichimoku && on('ind.ichimoku')) { const k = T.ichimoku; L.push(`- Ichimoku: Tenkan ${f(k.tenkan)}, Kijun ${f(k.kijun)}, SpanA ${f(k.spanA)}, SpanB ${f(k.spanB)}, FutureSpanA ${f(k.futureSpanA)}, FutureSpanB ${f(k.futureSpanB)}`); }
  if (on('ind.rsi')) L.push(`- RSI(${M.rsi.period}): ${n(M.rsi.value, 1)}`);
  if (on('ind.macd')) L.push(`- MACD: ${f(M.macd.macd)}, signal ${f(M.macd.signal)}, hist ${f(M.macd.hist)}`);
  if (on('ind.stoch')) L.push(`- Stochastic: %K ${n(M.stochastic.k, 1)}, %D ${n(M.stochastic.d, 1)}`);
  L.push(`- ATR(${V.atr.period}): ${f(V.atr.value)}`);
  if (on('ind.bb')) L.push(`- Bollinger: lower ${f(b.lower)}, mid ${f(b.mid)}, upper ${f(b.upper)}, %B ${n(b.pctB)}, bandwidth ${n(b.bandwidth, 4)}`);
  if (on('ind.don')) L.push(`- Donchian: lower ${f(dn.lower)}, mid ${f(dn.mid)}, upper ${f(dn.upper)}`);
  if (I.volume) {
    if (on('ind.vwap')) L.push(`- VWAP: ${f(I.volume.vwap.value)}`);
    if (on('ind.obv')) L.push(`- OBV: ${n(I.volume.obv.value, 0)}`);
    if (on('ind.rvol')) L.push(`- ${w('Относительный объём', 'Relative volume')}: ${n(I.volume.rvol.value)}`);
  }
  return [w('Индикаторы', 'Indicators') + ':', ...L].join('\n');
}

/** explain:false (default) = numbers only; explain:true = verbose with interpretations (slope, zones, tally ...). */
function indicatorsToText(I, { lang = 'ru', digits = 5, explain = false, off = [] } = {}) {
  if (!explain) return indicatorsNumeric(I, { lang, digits, off: new Set(off) });
  const w = (ru, en) => (lang === 'en' ? en : ru), f = (v) => (isNum(v) ? v.toFixed(digits) : 'n/a'), n1 = (v) => (isNum(v) ? v.toFixed(1) : 'n/a');
  const D = { up: w('вверх', 'up'), down: w('вниз', 'down'), flat: w('плоско', 'flat'), above: w('выше', 'above'), below: w('ниже', 'below'), inside: w('внутри', 'inside'),
    bullish: w('бычий', 'bullish'), bearish: w('медвежий', 'bearish'), overbought: w('перекуплен', 'overbought'), oversold: w('перепродан', 'oversold'), neutral: w('нейтрально', 'neutral'),
    weak: w('слабый', 'weak'), developing: w('формируется', 'developing'), strong: w('сильный', 'strong'), very_strong: w('очень сильный', 'very strong'),
    uptrend: w('восходящий', 'uptrend'), downtrend: w('нисходящий', 'downtrend'), range: w('боковик', 'range'),
    expanding: w('растёт', 'expanding'), contracting: w('падает', 'contracting'), normal: w('норма', 'normal'), high: w('высокий', 'high'), low: w('низкий', 'low'),
    rising: w('растёт', 'rising'), falling: w('падает', 'falling'), above_upper: w('выше верхней', 'above upper'), below_lower: w('ниже нижней', 'below lower') };
  const d = (k) => D[k] ?? k, T = I.trend, Mo = I.momentum, Vo = I.volatility, L = [];
  const cr = (c) => (c.barsAgo == null ? d(c.state) : `${d(c.state)}, ${c.barsAgo} ${w('бар назад', 'bars ago')}`);
  L.push(w('Индикаторы', 'Indicators') + ':');
  L.push(`- EMA(${T.ema.period}): ${f(T.ema.value)}, ${w('цена', 'price')} ${d(T.ema.price)} (${T.ema.distanceAtr.toFixed(1)} ATR), ${w('наклон', 'slope')} ${d(T.ema.slope)}`);
  L.push(`- ADX(${T.adx.period}): ${n1(T.adx.value)} (${d(T.adx.strength)}, ${T.adx.rising ? w('растёт', 'rising') : w('падает', 'falling')}), +DI ${n1(T.adx.plusDI)} / -DI ${n1(T.adx.minusDI)}, ${w('направление', 'direction')} ${d(T.adx.direction)}`);
  L.push(`- Supertrend: ${d(T.supertrend.direction)}, ${w('уровень', 'level')} ${f(T.supertrend.value)}, ${w('смена', 'flip')} ${T.supertrend.barsSinceFlip} ${w('бар назад', 'bars ago')}`);
  if (T.ichimoku) { const k = T.ichimoku; L.push(`- Ichimoku: ${w('цена', 'price')} ${d(k.price)} ${w('облака', 'cloud')} (${d(k.cloud)}), Tenkan/Kijun ${d(k.tk)}, ${w('облако', 'cloud')} ${f(Math.min(k.spanA, k.spanB))}–${f(Math.max(k.spanA, k.spanB))}`); }
  if (T.structure) L.push(`- ${w('Структура', 'Structure')}: ${d(T.structure.trend)} (${T.structure.labels.join('/')})`);
  const dv = Mo.rsi.divergence.map((x) => `${d(x.type)} ${w('дивергенция', 'divergence')} (${x.barsAgo} ${w('бар назад', 'bars ago')})`);
  L.push(`- RSI(${Mo.rsi.period}): ${n1(Mo.rsi.value)} (${d(Mo.rsi.zone)})${dv.length ? ', ' + dv.join(', ') : ''}`);
  L.push(`- MACD: ${f(Mo.macd.macd)} / ${f(Mo.macd.signal)}, ${w('гистограмма', 'hist')} ${f(Mo.macd.hist)} (${d(Mo.macd.histTrend)}), ${w('пересечение', 'cross')} ${cr(Mo.macd.cross)}`);
  L.push(`- Stochastic: %K ${n1(Mo.stochastic.k)} / %D ${n1(Mo.stochastic.d)} (${d(Mo.stochastic.zone)}), ${w('пересечение', 'cross')} ${cr(Mo.stochastic.cross)}`);
  L.push(`- ATR(${Vo.atr.period}): ${f(Vo.atr.value)} (${Vo.atr.pct.toFixed(3)}%, ${d(Vo.atr.state)})`);
  const b = Vo.bollinger;
  L.push(`- Bollinger: ${f(b.lower)} / ${f(b.mid)} / ${f(b.upper)}, %B ${b.pctB.toFixed(2)} (${d(b.position)})${b.squeeze ? ', ' + w('сжатие', 'squeeze') : ''}`);
  const dn = Vo.donchian;
  L.push(`- Donchian: ${f(dn.lower)}–${f(dn.upper)}, ${w('позиция', 'position')} ${(dn.pos * 100).toFixed(0)}%${dn.breakout ? ', ' + w('пробой', 'breakout') + ' ' + d(dn.breakout) : ''}`);
  if (I.volume) {
    const v = I.volume, kind = I.meta.volumeKind === 'tick' ? w(' (тиковый объём)', ' (tick volume)') : '';
    L.push(`- VWAP: ${f(v.vwap.value)}, ${w('цена', 'price')} ${d(v.vwap.price)} (${v.vwap.distanceAtr.toFixed(1)} ATR)${kind}`);
    L.push(`- OBV: ${w('тренд', 'trend')} ${d(v.obv.trend)}, ${v.obv.confirmsPrice ? w('подтверждает цену', 'confirms price') : w('расходится с ценой', 'diverges from price')}`);
    L.push(`- ${w('Относительный объём', 'Relative volume')}: ${v.rvol.value.toFixed(2)} (${d(v.rvol.state)})`);
  }
  if (I.patterns.length) L.push(`- ${w('Свечные паттерны', 'Candle patterns')}: ` + I.patterns.map((q) => `${q.name} (${q.barsAgo === 0 ? w('текущая', 'current') : q.barsAgo + ' ' + w('бар назад', 'bars ago')})`).join(', '));
  L.push(`${w('Сводка (подсчёт сигналов, не рекомендация)', 'Tally (signal count, not advice)')}: ${w('бычьих', 'bullish')} ${I.votes.bull}, ${w('медвежьих', 'bearish')} ${I.votes.bear}, ${w('нейтральных', 'neutral')} ${I.votes.neutral}`);
  return L.join('\n');
}



/* Extra TradingView-style indicators. Each def returns { output: array } series; the snapshot takes the last value. */
const nn = (n) => new Array(n).fill(NaN);
const lst = (a) => a[a.length - 1];
const zip = (a, b, f) => a.map((q, i) => f(q, b[i]));
const roll = (v, p, f) => { const out = nn(v.length); for (let i = p - 1; i < v.length; i++) { const w = v.slice(i - p + 1, i + 1); if (w.every(isNum)) out[i] = f(w, i); } return out; };
const rollSum = (v, p) => roll(v, p, (w) => w.reduce((s, q) => s + q, 0));
const rollMax = (v, p) => roll(v, p, (w) => Math.max(...w));
const rollMin = (v, p) => roll(v, p, (w) => Math.min(...w));
const rollStd = (v, p) => roll(v, p, (w) => { const m = w.reduce((s, q) => s + q, 0) / p; return Math.sqrt(w.reduce((s, q) => s + (q - m) ** 2, 0) / p); });
const wma = (v, p) => roll(v, p, (w) => w.reduce((s, q, k) => s + q * (k + 1), 0) / ((p * (p + 1)) / 2));
const roc = (v, p) => v.map((q, i) => (i >= p ? (100 * (q - v[i - p])) / v[i - p] : NaN));
const trueRange = (cs) => cs.map((c, i) => (i ? Math.max(c.high - c.low, Math.abs(c.high - cs[i - 1].close), Math.abs(c.low - cs[i - 1].close)) : c.high - c.low));
const linregEnd = (v, p) => roll(v, p, (w) => {
  const km = (p - 1) / 2, ym = w.reduce((s, q) => s + q, 0) / p; let sxy = 0, sxx = 0;
  w.forEach((y, k) => { sxy += (k - km) * (y - ym); sxx += (k - km) ** 2; });
  return ym + (sxy / sxx) * (p - 1 - km);
});

function kama(c, p = 10, f = 2, s = 30) {
  const out = nn(c.length), fa = 2 / (f + 1), sa = 2 / (s + 1); let prev = NaN;
  for (let i = p; i < c.length; i++) {
    let vol = 0; for (let k = i - p + 1; k <= i; k++) vol += Math.abs(c[k] - c[k - 1]);
    const er = vol ? Math.abs(c[i] - c[i - p]) / vol : 0, sc = (er * (fa - sa) + sa) ** 2;
    prev = isNum(prev) ? prev + sc * (c[i] - prev) : c[i]; out[i] = prev;
  }
  return out;
}
function psar(h, l, af0 = 0.02, step = 0.02, max = 0.2) {
  const out = nn(h.length); if (h.length < 3) return out;
  let up = true, af = af0, ep = h[0], sar = l[0]; out[0] = sar;
  for (let i = 1; i < h.length; i++) {
    sar += af * (ep - sar);
    if (up) {
      sar = Math.min(sar, l[i - 1], i > 1 ? l[i - 2] : l[i - 1]);
      if (l[i] < sar) { up = false; sar = ep; ep = l[i]; af = af0; } else if (h[i] > ep) { ep = h[i]; af = Math.min(af + step, max); }
    } else {
      sar = Math.max(sar, h[i - 1], i > 1 ? h[i - 2] : h[i - 1]);
      if (h[i] > sar) { up = true; sar = ep; ep = h[i]; af = af0; } else if (l[i] < ep) { ep = l[i]; af = Math.min(af + step, max); }
    }
    out[i] = sar;
  }
  return out;
}
function aroon(h, l, p) {
  const up = nn(h.length), dn = nn(h.length);
  for (let i = p; i < h.length; i++) {
    let ih = i, il = i;
    for (let k = i - p; k <= i; k++) { if (h[k] >= h[ih]) ih = k; if (l[k] <= l[il]) il = k; }
    up[i] = (100 * (p - (i - ih))) / p; dn[i] = (100 * (p - (i - il))) / p;
  }
  return { up, down: dn, osc: zip(up, dn, (a, b) => a - b) };
}

const REG = [];
const def = (name, label, fn, o = {}) => REG.push({ name, label, fn, ...o });

// moving averages
def('sma', 'SMA', (x) => ({ 20: sma(x.c, 20), 50: sma(x.c, 50), 200: sma(x.c, 200) }), { price: true });
def('emaLong', 'EMA', (x) => ({ 50: ema(x.c, 50), 200: ema(x.c, 200) }), { price: true });
def('wma', 'WMA(20)', (x) => ({ v: wma(x.c, 20) }), { price: true });
def('vwma', 'VWMA(20)', (x) => ({ v: zip(sma(zip(x.c, x.v, (a, b) => a * b), 20), sma(x.v, 20), (a, b) => a / b) }), { price: true, vol: true });
def('hma', 'HMA(20)', (x) => ({ v: wma(zip(wma(x.c, 10), wma(x.c, 20), (a, b) => 2 * a - b), 4) }), { price: true });
def('kama', 'KAMA(10)', (x) => ({ v: kama(x.c) }), { price: true });
// trend
def('psar', 'Parabolic SAR(0.02,0.02,0.2)', (x) => ({ v: psar(x.h, x.l) }), { price: true });
def('aroon', 'Aroon(14)', (x) => aroon(x.h, x.l, 14));
def('vortex', 'Vortex(14)', (x) => {
  const tr = rollSum(trueRange(x.cs), 14);
  const vp = rollSum(x.h.map((h, i) => (i ? Math.abs(h - x.l[i - 1]) : NaN)), 14), vm = rollSum(x.l.map((l, i) => (i ? Math.abs(l - x.h[i - 1]) : NaN)), 14);
  return { plus: zip(vp, tr, (a, b) => a / b), minus: zip(vm, tr, (a, b) => a / b) };
});
def('chop', 'Choppiness(14)', (x) => ({ v: zip(zip(rollSum(trueRange(x.cs), 14), zip(rollMax(x.h, 14), rollMin(x.l, 14), (a, b) => a - b), (a, b) => a / b), x.c, (r) => (100 * Math.log10(r)) / Math.log10(14)) }));
def('trix', 'TRIX(15)', (x) => { const e = ema(ema(ema(x.c, 15), 15), 15); return { v: e.map((q, i) => (i ? 100 * (q / e[i - 1] - 1) : NaN)) }; });
def('ppo', 'PPO(12,26,9)', (x) => { const p = zip(ema(x.c, 12), ema(x.c, 26), (a, b) => (100 * (a - b)) / b), g = ema(p, 9); return { ppo: p, signal: g, hist: zip(p, g, (a, b) => a - b) }; });
// momentum
def('roc', 'ROC(9)', (x) => ({ v: roc(x.c, 9) }));
def('mom', 'Momentum(10)', (x) => ({ v: x.c.map((q, i) => (i >= 10 ? q - x.c[i - 10] : NaN)) }), { price: true });
def('cci', 'CCI(20)', (x) => {
  const tp = x.h.map((h, i) => (h + x.l[i] + x.c[i]) / 3), m = sma(tp, 20);
  return { v: roll(tp, 20, (w, i) => { const d = w.reduce((s, q) => s + Math.abs(q - m[i]), 0) / 20; return d ? (tp[i] - m[i]) / (0.015 * d) : 0; }) };
});
def('wpr', 'Williams %R(14)', (x) => { const hh = rollMax(x.h, 14), ll = rollMin(x.l, 14); return { v: x.c.map((q, i) => (hh[i] === ll[i] ? -50 : (-100 * (hh[i] - q)) / (hh[i] - ll[i]))) }; });
def('stochrsi', 'Stoch RSI(14,14,3,3)', (x) => {
  const r = rsi(x.c, 14), hh = rollMax(r, 14), ll = rollMin(r, 14), k = sma(r.map((q, i) => (hh[i] === ll[i] ? 50 : (100 * (q - ll[i])) / (hh[i] - ll[i]))), 3);
  return { k, d: sma(k, 3) };
});
def('ao', 'Awesome Osc / Accelerator Osc', (x) => { const hl = x.h.map((h, i) => (h + x.l[i]) / 2), ao = zip(sma(hl, 5), sma(hl, 34), (a, b) => a - b); return { ao, ac: zip(ao, sma(ao, 5), (a, b) => a - b) }; }, { price: true });
def('uo', 'Ultimate Osc(7,14,28)', (x) => {
  const bp = x.c.map((q, i) => (i ? q - Math.min(x.l[i], x.c[i - 1]) : NaN)), tr = x.c.map((q, i) => (i ? Math.max(x.h[i], x.c[i - 1]) - Math.min(x.l[i], x.c[i - 1]) : NaN));
  const a = (p) => zip(rollSum(bp, p), rollSum(tr, p), (s, t) => s / t), a7 = a(7), a14 = a(14), a28 = a(28);
  return { v: a7.map((q, i) => (100 * (4 * q + 2 * a14[i] + a28[i])) / 7) };
});
def('tsi', 'TSI(25,13)', (x) => { const m = x.c.map((q, i) => (i ? q - x.c[i - 1] : NaN)); return { v: zip(ema(ema(m, 25), 13), ema(ema(m.map(Math.abs), 25), 13), (a, b) => (100 * a) / b) }; });
def('fisher', 'Fisher Transform(9)', (x) => {
  const hl = x.h.map((h, i) => (h + x.l[i]) / 2), hh = rollMax(hl, 9), ll = rollMin(hl, 9), fish = nn(hl.length), trig = nn(hl.length);
  let v = 0, f = 0;
  for (let i = 8; i < hl.length; i++) {
    const r = hh[i] - ll[i]; v = Math.max(-0.999, Math.min(0.999, 0.66 * (r ? (hl[i] - ll[i]) / r - 0.5 : 0) + 0.67 * v));
    trig[i] = f; f = 0.5 * Math.log((1 + v) / (1 - v)) + 0.5 * f; fish[i] = f;
  }
  return { fisher: fish, trigger: trig };
});
def('cmo', 'CMO(9)', (x) => ({ v: roll(x.c.map((q, i) => (i ? q - x.c[i - 1] : NaN)), 9, (w) => { const u = w.filter((q) => q > 0).reduce((s, q) => s + q, 0), d = -w.filter((q) => q < 0).reduce((s, q) => s + q, 0); return u + d ? (100 * (u - d)) / (u + d) : 0; }) }));
def('bbp', 'Elder Bull/Bear Power(13)', (x) => { const e = ema(x.c, 13); return { bull: zip(x.h, e, (a, b) => a - b), bear: zip(x.l, e, (a, b) => a - b) }; }, { price: true });
def('bop', 'Balance of Power', (x) => ({ v: x.c.map((q, i) => (x.h[i] === x.l[i] ? 0 : (q - x.o[i]) / (x.h[i] - x.l[i]))) }));
// volatility
def('keltner', 'Keltner(20, 2, ATR10)', (x) => { const m = ema(x.c, 20), a = atr(x.cs, 10); return { lower: zip(m, a, (p, q) => p - 2 * q), mid: m, upper: zip(m, a, (p, q) => p + 2 * q) }; }, { price: true });
def('stdev', 'StDev(20)', (x) => ({ v: rollStd(x.c, 20) }), { price: true });
def('zscore', 'Z-Score(20)', (x) => ({ v: zip(zip(x.c, sma(x.c, 20), (a, b) => a - b), rollStd(x.c, 20), (a, b) => (b ? a / b : 0)) }));
def('hv', 'Historical Volatility(10)', (x) => ({ v: rollStd(x.c.map((q, i) => (i ? Math.log(q / x.c[i - 1]) : NaN)), 10).map((q) => q * 100) }));
def('chandelier', 'Chandelier Exit(22,3)', (x) => { const a = atr(x.cs, 22); return { long: zip(rollMax(x.h, 22), a, (p, q) => p - 3 * q), short: zip(rollMin(x.l, 22), a, (p, q) => p + 3 * q) }; }, { price: true });
def('squeeze', 'Squeeze Momentum(20)', (x) => {
  const m = sma(x.c, 20), sd = rollStd(x.c, 20), k = sma(trueRange(x.cs), 20), hh = rollMax(x.h, 20), ll = rollMin(x.l, 20);
  return { momentum: linregEnd(x.c.map((q, i) => q - ((hh[i] + ll[i]) / 2 + m[i]) / 2), 20), squeezeOn: m.map((q, i) => (q - 2 * sd[i] > q - 1.5 * k[i] && q + 2 * sd[i] < q + 1.5 * k[i] ? 1 : 0)) };
}, { price: true });
// volume
const clv = (x) => x.c.map((q, i) => (x.h[i] === x.l[i] ? 0 : (q - x.l[i] - (x.h[i] - q)) / (x.h[i] - x.l[i])));
const adLine = (x) => { let s = 0; return clv(x).map((q, i) => (s += q * x.v[i])); };
def('ad', 'Accumulation/Distribution', (x) => ({ v: adLine(x) }), { vol: true });
def('cmf', 'Chaikin Money Flow(20)', (x) => ({ v: zip(rollSum(clv(x).map((q, i) => q * x.v[i]), 20), rollSum(x.v, 20), (a, b) => (b ? a / b : 0)) }), { vol: true });
def('mfi', 'MFI(14)', (x) => {
  const tp = x.h.map((h, i) => (h + x.l[i] + x.c[i]) / 3), pos = tp.map((q, i) => (i && q > tp[i - 1] ? q * x.v[i] : 0)), neg = tp.map((q, i) => (i && q < tp[i - 1] ? q * x.v[i] : 0));
  return { v: zip(rollSum(pos, 14), rollSum(neg, 14), (p, n) => (n ? 100 - 100 / (1 + p / n) : 100)) };
}, { vol: true });
def('chaikinOsc', 'Chaikin Oscillator(3,10)', (x) => { const a = adLine(x); return { v: zip(ema(a, 3), ema(a, 10), (p, q) => p - q) }; }, { vol: true });
def('force', 'Force Index(13)', (x) => ({ v: ema(x.c.map((q, i) => (i ? (q - x.c[i - 1]) * x.v[i] : NaN)), 13) }), { vol: true });
def('eom', 'Ease of Movement(14)', (x) => ({ v: sma(x.h.map((h, i) => (i && x.v[i] > 0 ? (1e8 * ((h + x.l[i]) / 2 - (x.h[i - 1] + x.l[i - 1]) / 2) * (h - x.l[i])) / x.v[i] : NaN)), 14) }), { vol: true });
def('volOsc', 'Volume Oscillator(5,10)', (x) => ({ v: zip(ema(x.v, 5), ema(x.v, 10), (a, b) => (100 * (a - b)) / b) }), { vol: true });
def('pvt', 'Price Volume Trend', (x) => { let s = 0; return { v: x.c.map((q, i) => (i ? (s += (x.v[i] * (q - x.c[i - 1])) / x.c[i - 1]) : 0)) }; }, { vol: true });

/** names of all extra indicators */
const EXTRA_NAMES = REG.map((d) => d.name);
const EXTRA_LIST = REG.map((d) => ({ name: d.name, label: d.label, vol: !!d.vol }));

/**
 * Last values of all extra indicators.
 * o: { only: [names], exclude: [names], series: true, volumeKind }. Volume-based ones are skipped without volume.
 * @returns {{meta, indicators: {[name]: {label, price, values: {[output]: number}}}}}
 */
function analyzeExtra(candles, o = {}) {
  assertCandles(candles, 30);
  const x = { o: candles.map((c) => c.open), h: candles.map((c) => c.high), l: candles.map((c) => c.low), c: candles.map((c) => c.close), v: candles.map((c) => c.volume || 0), cs: candles };
  const hasVol = x.v.some((q) => q > 0), indicators = {};
  for (const d of REG) {
    if ((d.vol && !hasVol) || (o.only && !o.only.includes(d.name)) || o.exclude?.includes(d.name)) continue;
    try {
      const s = d.fn(x), values = {};
      for (const k in s) { const v = lst(s[k]); if (isNum(v)) values[k] = v; }
      if (Object.keys(values).length) indicators[d.name] = { label: d.label, price: !!d.price, values, ...(o.series ? { series: s } : {}) };
    } catch { /* skip indicator that cannot be computed on this data */ }
  }
  return { meta: { count: candles.length, volumeKind: hasVol ? o.volumeKind ?? 'unknown' : null }, indicators };
}

/** Numbers only: "- CCI(20): -35.2". Price-scale values use `digits`. */
function extraToText(E, { digits = 5, lang = 'ru' } = {}) {
  const num = (v, price) => (price ? v.toFixed(digits) : Math.abs(v) >= 1000 ? v.toFixed(0) : String(+v.toPrecision(4)));
  const L = [(lang === 'en' ? 'Additional indicators' : 'Дополнительные индикаторы') + ':'];
  for (const d of Object.values(E.indicators)) {
    const ks = Object.keys(d.values);
    L.push(`- ${d.label}: ` + (ks.length === 1 && ks[0] === 'v' ? num(d.values.v, d.price) : ks.map((k) => `${k} ${num(d.values[k], d.price)}`).join(', ')));
  }
  return L.join('\n');
}


/** Catalogue of switchable prompt parts: [{ id, label, items: [[key, label], ...] }]. Keys are used in `off: [...]`. */
const TOGGLES = [
  { id: 'levels', chart: true, label: 'Уровни и зоны', items: [['lvl.round', 'Круглые'], ['lvl.fib', 'Фибоначчи'], ['lvl.pivot', 'Пивоты'], ['lvl.period', 'День/нед/мес'], ['lvl.session', 'Сессии'], ['lvl.trendline', 'Трендовые линии'],
    ['lvl.sr', 'S/R зоны'], ['lvl.supplyDemand', 'Спрос/предложение'], ['lvl.fvg', 'FVG'], ['lvl.orderBlock', 'Order blocks'], ['lvl.range', 'Диапазоны'], ['lvl.volume', 'Профиль объёма']] },
  { id: 'core', chart: true, label: 'Основные индикаторы', items: [['ind.ema', 'EMA'], ['ind.adx', 'ADX'], ['ind.supertrend', 'Supertrend'], ['ind.ichimoku', 'Ichimoku'], ['ind.rsi', 'RSI'], ['ind.macd', 'MACD'], ['ind.stoch', 'Stochastic'],
    ['ind.bb', 'Bollinger'], ['ind.don', 'Donchian'], ['ind.vwap', 'VWAP'], ['ind.obv', 'OBV'], ['ind.rvol', 'Отн. объём'], ['ind.reg', 'Регрессия']] },
  { id: 'extra', chart: true, label: 'Дополнительные индикаторы', items: EXTRA_LIST.map((e) => ['ext.' + e.name, e.label]) },
  { id: 'data', label: 'Данные', items: [['cal', 'Календарь'], ['tk.stats', 'Тики: сводка'], ['tk.buckets', 'Тики: интервалы'], ['tk.raw', 'Тики: сырые'], ['bk.stats', 'Стакан: сводка'], ['bk.levels', 'Стакан: уровни'], ['of.stats', 'Дельта по свечам'], ['tr.stats', 'Сделки: сводка'], ['tr.buckets', 'Сделки: интервалы'], ['tr.profile', 'Сделки: профиль объёма'], ['tr.raw', 'Сделки: сырые'], ['bars', 'Таблица свечей']] },
  { id: 'cols', label: 'Колонки таблицы свечей', items: ['ema', 'rsi', 'macdHist', 'adx', 'stochK', 'atr', 'bbPctB', 'stDir', 'vwap', 'obv', 'rvol', 'delta', 'cvd', 'buyR'].map((k) => ['col.' + k, k]) },
];
const TOGGLE_KEYS = TOGGLES.flatMap((g) => g.items.map((i) => i[0]));

/** Copy of an analyzeLevels result with the switched-off parts emptied (formatters already tolerate empty parts). */
function maskResult(r, off) {
  off = off instanceof Set ? off : new Set(off || []);
  if (!off.size) return r;
  const m = { ...r }, L = (g) => off.has('lvl.' + g);
  if (L('round')) m.round = [];
  if (L('fib')) m.fibonacci = null;
  if (L('pivot')) m.pivots = null;
  if (L('period')) m.periods = null;
  if (L('session')) m.sessions = null;
  if (L('trendline')) m.trendlines = { support: [], resistance: [] };
  if (L('volume')) m.volumeProfile = null;
  if (off.has('ind.reg')) m.regression = null;
  if (off.has('of.stats')) m.orderflow = null;
  m.zones = { ...r.zones };
  for (const [g, key] of [['sr', 'sr'], ['supplyDemand', 'supplyDemand'], ['fvg', 'fvg'], ['orderBlock', 'orderBlocks'], ['range', 'ranges']]) if (L(g)) m.zones[key] = [];
  if (r.extra) m.extra = { ...r.extra, indicators: Object.fromEntries(Object.entries(r.extra.indicators).filter(([k]) => !off.has('ext.' + k))) };
  if (r.indicators?.history) m.indicators = { ...r.indicators, history: Object.fromEntries(Object.entries(r.indicators.history).filter(([k]) => k === 'time' || k === 'close' || !off.has('col.' + k))) };
  return m;
}

/* Tick-history analysis (bid/ask rows, e.g. biquote GET /api/{symbol}/history?count=N, max 1000). Pure functions. */
const TK_BUCKETS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400];

/**
 * Aggregates raw ticks: counts of up/down/flat mid moves (tick rule), spread stats, time buckets, last raw ticks.
 * @param rows  [{ timestamp, bid, ask, mid? }] in any order
 * @param o     { bucketCount = 12, raw = 20 (last raw ticks kept), atr (for rangeAtr) }
 */
function analyzeTicks(rows, { bucketCount = 12, raw = 20, atr = null } = {}) {
  const T = rows.map((x) => ({ t: Date.parse(x.timestamp), bid: +x.bid, ask: +x.ask, mid: x.mid != null ? +x.mid : (+x.bid + +x.ask) / 2 }))
    .filter((x) => Number.isFinite(x.t) && Number.isFinite(x.mid)).sort((a, b) => a.t - b.t);
  const n = T.length;
  if (n < 2) return null;
  const dir = T.map((x, i) => (i ? Math.sign(x.mid - T[i - 1].mid) : 0));
  const up = dir.filter((d) => d > 0).length, dn = dir.filter((d) => d < 0).length;
  const mids = T.map((x) => x.mid), spr = T.map((x) => x.ask - x.bid), spanSec = (T[n - 1].t - T[0].t) / 1000;
  const hi = Math.max(...mids), lo = Math.min(...mids);
  const size = TK_BUCKETS.find((b) => b >= spanSec / bucketCount) ?? TK_BUCKETS[TK_BUCKETS.length - 1], ms = size * 1000, start = Math.floor(T[0].t / ms) * ms;
  const map = new Map();
  T.forEach((x, i) => {
    const k = Math.floor((x.t - start) / ms);
    let b = map.get(k);
    if (!b) map.set(k, (b = { t: start + k * ms, n: 0, up: 0, dn: 0, spr: 0, h: -Infinity, l: Infinity, c: 0 }));
    b.n++; if (dir[i] > 0) b.up++; else if (dir[i] < 0) b.dn++;
    b.spr += spr[i]; b.h = Math.max(b.h, x.mid); b.l = Math.min(b.l, x.mid); b.c = x.mid;
  });
  return {
    n, from: T[0].t, to: T[n - 1].t, spanSec, perSec: spanSec ? n / spanSec : null,
    first: mids[0], last: mids[n - 1], hi, lo, change: mids[n - 1] - mids[0], rangeAtr: atr ? (hi - lo) / atr : null,
    sprAvg: spr.reduce((s, v) => s + v, 0) / n, sprMin: Math.min(...spr), sprMax: Math.max(...spr), sprLast: spr[n - 1],
    up, dn, flat: n - 1 - up - dn, imbalance: up + dn ? (up - dn) / (up + dn) : 0,
    bucketSec: size,
    buckets: [...map.values()].sort((a, b) => a.t - b.t).map((b) => ({ t: b.t, n: b.n, up: b.up, dn: b.dn, delta: b.up - b.dn, spr: b.spr / b.n, h: b.h, l: b.l, c: b.c })),
    raw: raw > 0 ? T.slice(-raw).map((x) => ({ dt: (x.t - T[n - 1].t) / 1000, bid: x.bid, ask: x.ask })) : [],
  };
}

/** TP1 blocks: @ticks (summary), @tkb (time buckets), @tk (last raw ticks). Each can be switched off. */
function ticksCompact(tk, { digits = 5, stats = true, buckets = true, raw = true } = {}) {
  if (!tk) return '';
  const p = (v) => +v.toFixed(digits), q = (v) => +v.toFixed(digits + 1), sg = (v, f) => (v > 0 ? '+' : '') + f(v), hms = (ms) => new Date(ms).toISOString().slice(11, 19), L = [];
  if (stats) L.push(`@ticks n=${tk.n} span_s=${Math.round(tk.spanSec)} per_s=${tk.perSec == null ? '' : +tk.perSec.toFixed(2)} from=${hms(tk.from)} to=${hms(tk.to)} mid=${p(tk.last)} hi=${p(tk.hi)} lo=${p(tk.lo)} chg=${sg(tk.change, p)}${tk.rangeAtr != null ? ' rng_atr=' + +tk.rangeAtr.toFixed(2) : ''} spr_avg=${q(tk.sprAvg)} spr_min=${q(tk.sprMin)} spr_max=${q(tk.sprMax)} spr_last=${q(tk.sprLast)} up=${tk.up} dn=${tk.dn} flat=${tk.flat} imb=${sg(+tk.imbalance.toFixed(2), (v) => v)}`);
  if (buckets && tk.buckets.length) L.push(`@tkb ${tk.bucketSec}s t|n|up|dn|delta|spr|h|l|c`, ...tk.buckets.map((b) => [hms(b.t), b.n, b.up, b.dn, b.delta, q(b.spr), p(b.h), p(b.l), p(b.c)].join('|')));
  if (raw && tk.raw.length) L.push('@tk dt_s|bid|ask', ...tk.raw.map((x) => [+x.dt.toFixed(1), p(x.bid), p(x.ask)].join('|')));
  return L.join('\n');
}


/* Real-volume order flow: per-candle delta from exchange taker-buy volume, and trade-level analysis (e.g. Binance aggTrades). */
const fin = Number.isFinite;

const hasOrderflow = (candles) => candles.some((c) => fin(c.buyVolume));

/**
 * Candles need `volume` and `buyVolume` (taker buy base volume). delta = buy - sell = 2*buy - volume.
 * CVD is anchored at the first loaded candle. Returns null without buyVolume.
 */
function analyzeOrderflow(candles, { window = 20 } = {}) {
  if (!hasOrderflow(candles)) return null;
  const n = candles.length, delta = candles.map((c) => (fin(c.buyVolume) ? 2 * c.buyVolume - c.volume : NaN));
  let s = 0; const cvd = delta.map((d) => (s += fin(d) ? d : 0));
  const buyRatio = candles.map((c) => (fin(c.buyVolume) && c.volume ? c.buyVolume / c.volume : NaN));
  const w = Math.max(1, Math.min(window, n - 1)), win = delta.slice(-w).filter(fin), L = candles[n - 1];
  return { window: w, volume: L.volume, buy: L.buyVolume, sell: L.volume - L.buyVolume, delta: delta[n - 1], buyRatio: buyRatio[n - 1], cvd: cvd[n - 1], cvdChange: cvd[n - 1] - cvd[n - 1 - w],
    deltaSum: win.reduce((a, b) => a + b, 0), deltaAbsAvg: win.reduce((a, b) => a + Math.abs(b), 0) / (win.length || 1), series: { delta, cvd, buyRatio } };
}

/**
 * Trades: [{ t (ms), price, qty, sell }]  sell = true when the aggressor sold (Binance isBuyerMaker = true).
 * o: { bucketCount = 12, raw = 20, bins = 24, atr }
 */
function analyzeTrades(rows, { bucketCount = 12, raw = 20, bins = 24, atr = null } = {}) {
  const T = rows.map((x) => ({ t: +x.t, price: +x.price, qty: +x.qty, sell: !!x.sell })).filter((x) => fin(x.t) && fin(x.price) && fin(x.qty)).sort((a, b) => a.t - b.t);
  const n = T.length;
  if (n < 2) return null;
  let buy = 0, sell = 0, pv = 0, hi = -Infinity, lo = Infinity, maxQty = 0;
  for (const x of T) { if (x.sell) sell += x.qty; else buy += x.qty; pv += x.price * x.qty; hi = Math.max(hi, x.price); lo = Math.min(lo, x.price); maxQty = Math.max(maxQty, x.qty); }
  const vol = buy + sell, spanSec = (T[n - 1].t - T[0].t) / 1000;
  const thr = T.map((x) => x.qty).sort((a, b) => a - b)[Math.floor(0.99 * (n - 1))], big = T.filter((x) => x.qty >= thr);
  const bigDelta = big.reduce((s, x) => s + (x.sell ? -x.qty : x.qty), 0);
  const size = TK_BUCKETS.find((b) => b >= spanSec / bucketCount) ?? TK_BUCKETS[TK_BUCKETS.length - 1], ms = size * 1000, start = Math.floor(T[0].t / ms) * ms, map = new Map();
  for (const x of T) {
    const k = Math.floor((x.t - start) / ms); let b = map.get(k);
    if (!b) map.set(k, (b = { t: start + k * ms, n: 0, buy: 0, sell: 0, pv: 0, h: -Infinity, l: Infinity, c: 0 }));
    b.n++; if (x.sell) b.sell += x.qty; else b.buy += x.qty; b.pv += x.price * x.qty; b.h = Math.max(b.h, x.price); b.l = Math.min(b.l, x.price); b.c = x.price;
  }
  let profile = null;
  if (hi > lo) {
    const bs = (hi - lo) / bins, B = Array.from({ length: bins }, (_, i) => ({ low: lo + i * bs, high: lo + (i + 1) * bs, buy: 0, sell: 0 }));
    for (const x of T) { const b = B[Math.min(bins - 1, Math.floor((x.price - lo) / bs))]; if (x.sell) b.sell += x.qty; else b.buy += x.qty; }
    let poc = 0; B.forEach((b, i) => { if (b.buy + b.sell > B[poc].buy + B[poc].sell) poc = i; });
    const v = (i) => B[i].buy + B[i].sell; let l = poc, r = poc, acc = v(poc);
    while (acc < vol * 0.7 && (l > 0 || r < bins - 1)) {
      const up = r < bins - 1 ? v(r + 1) + (r + 2 < bins ? v(r + 2) : 0) : -1, dn = l > 0 ? v(l - 1) + (l > 1 ? v(l - 2) : 0) : -1;
      if (up >= dn) { r++; acc += v(r); } else { l--; acc += v(l); }
    }
    profile = { poc: (B[poc].low + B[poc].high) / 2, vah: B[r].high, val: B[l].low, bins: B };
  }
  return { n, from: T[0].t, to: T[n - 1].t, spanSec, perSec: spanSec ? n / spanSec : null, volume: vol, buy, sell, delta: buy - sell, deltaPct: vol ? ((buy - sell) / vol) * 100 : 0,
    vwap: pv / vol, first: T[0].price, last: T[n - 1].price, hi, lo, change: T[n - 1].price - T[0].price, rangeAtr: atr ? (hi - lo) / atr : null,
    avgQty: vol / n, maxQty, bigThreshold: thr, bigCount: big.length, bigDelta, bucketSec: size,
    buckets: [...map.values()].sort((a, b) => a.t - b.t).map((b) => ({ t: b.t, n: b.n, buy: b.buy, sell: b.sell, delta: b.buy - b.sell, vwap: b.pv / (b.buy + b.sell), h: b.h, l: b.l, c: b.c })),
    profile, raw: raw > 0 ? T.slice(-raw).map((x) => ({ dt: (x.t - T[n - 1].t) / 1000, price: x.price, qty: x.qty, sell: x.sell })) : [] };
}

/** TP1 blocks: @trades, @trb, @vp, @tr (each can be switched off). */
function tradesCompact(tr, { digits = 5, stats = true, buckets = true, profile = true, raw = true } = {}) {
  if (!tr) return '';
  const p = (v) => +v.toFixed(digits), q = (v) => +v.toPrecision(4), sg = (v, f) => (v > 0 ? '+' : '') + f(v), hms = (ms) => new Date(ms).toISOString().slice(11, 19), L = [];
  if (stats) L.push(`@trades n=${tr.n} span_s=${Math.round(tr.spanSec)} per_s=${tr.perSec == null ? '' : +tr.perSec.toFixed(2)} from=${hms(tr.from)} to=${hms(tr.to)} vol=${q(tr.volume)} buy=${q(tr.buy)} sell=${q(tr.sell)} delta=${sg(tr.delta, q)} dPct=${sg(+tr.deltaPct.toFixed(1), (v) => v)} vwap=${p(tr.vwap)} last=${p(tr.last)} hi=${p(tr.hi)} lo=${p(tr.lo)}${tr.rangeAtr != null ? ' rng_atr=' + +tr.rangeAtr.toFixed(2) : ''} avg=${q(tr.avgQty)} max=${q(tr.maxQty)} big_n=${tr.bigCount} big_delta=${sg(tr.bigDelta, q)}`);
  if (buckets && tr.buckets.length) L.push(`@trb ${tr.bucketSec}s t|n|buy|sell|delta|vwap|h|l|c`, ...tr.buckets.map((b) => [hms(b.t), b.n, q(b.buy), q(b.sell), sg(b.delta, q), p(b.vwap), p(b.h), p(b.l), p(b.c)].join('|')));
  if (profile && tr.profile) L.push(`@vp poc=${p(tr.profile.poc)} vah=${p(tr.profile.vah)} val=${p(tr.profile.val)} low|high|buy|sell`, ...[...tr.profile.bins].reverse().filter((b) => b.buy + b.sell > 0).map((b) => [p(b.low), p(b.high), q(b.buy), q(b.sell)].join('|')));
  if (raw && tr.raw.length) L.push('@tr dt_s|price|qty|side(B=taker buy)', ...tr.raw.map((x) => [+x.dt.toFixed(1), p(x.price), q(x.qty), x.sell ? 'S' : 'B'].join('|')));
  return L.join('\n');
}

/** TP1 line with the last candle's real delta. */
function orderflowCompact(of, digits = 4) {
  if (!of) return '';
  const q = (v) => +v.toPrecision(digits), sg = (v) => (v > 0 ? '+' : '') + q(v);
  return `@of vol=${q(of.volume)} buy=${q(of.buy)} sell=${q(of.sell)} delta=${sg(of.delta)} buyR=${+of.buyRatio.toFixed(3)} cvd=${sg(of.cvd)} cvd${of.window}=${sg(of.cvdChange)} dSum${of.window}=${sg(of.deltaSum)} dAbsAvg${of.window}=${q(of.deltaAbsAvg)}`;
}

/* CME Globex futures: mapping from spot-style names to futures roots, plus candle resampling. */
const CME_MAP = {
  EURUSD: { root: '6E', name: 'Euro FX', tick: 0.00005, inverse: false },
  GBPUSD: { root: '6B', name: 'British Pound', tick: 0.0001, inverse: false },
  AUDUSD: { root: '6A', name: 'Australian Dollar', tick: 0.0001, inverse: false },
  NZDUSD: { root: '6N', name: 'New Zealand Dollar', tick: 0.0001, inverse: false },
  USDJPY: { root: '6J', name: 'Japanese Yen (USD per 1 JPY)', tick: 0.0000005, inverse: true },
  USDCAD: { root: '6C', name: 'Canadian Dollar (USD per 1 CAD)', tick: 0.00005, inverse: true },
  USDCHF: { root: '6S', name: 'Swiss Franc (USD per 1 CHF)', tick: 0.0001, inverse: true },
  XAUUSD: { root: 'GC', name: 'Gold', tick: 0.1, inverse: false },
  XAGUSD: { root: 'SI', name: 'Silver', tick: 0.005, inverse: false },
  SPX500: { root: 'ES', name: 'E-mini S&P 500', tick: 0.25, inverse: false },
  NAS100: { root: 'NQ', name: 'E-mini Nasdaq-100', tick: 0.25, inverse: false },
  US30: { root: 'YM', name: 'E-mini Dow', tick: 1, inverse: false },
  US2000: { root: 'RTY', name: 'E-mini Russell 2000', tick: 0.1, inverse: false },
  USOIL: { root: 'CL', name: 'WTI Crude Oil', tick: 0.01, inverse: false },
  NATGAS: { root: 'NG', name: 'Natural Gas', tick: 0.001, inverse: false },
};
const CME_ALIAS = { US500: 'SPX500', SP500: 'SPX500', SPX: 'SPX500', US100: 'NAS100', NDX: 'NAS100', USTEC: 'NAS100', DJI: 'US30', DJ30: 'US30', RUT: 'US2000', WTI: 'USOIL', XTIUSD: 'USOIL', GOLD: 'XAUUSD', SILVER: 'XAGUSD' };

/** 'EURUSD' | '6E' | 'EUR/USD' | 'ES' -> { spot, root, name, tick, inverse } or null (not a CME-mapped asset) */
function cmeResolve(input = '') {
  const s0 = String(input).toUpperCase().replace(/[^A-Z0-9]/g, ''), s = CME_ALIAS[s0] || s0;
  if (CME_MAP[s]) return { spot: s, ...CME_MAP[s] };
  const e = Object.entries(CME_MAP).find(([, v]) => v.root === s0);
  return e ? { spot: e[0], ...e[1] } : null;
}

/** Aggregate candles into `minutes`-minute buckets aligned to the UTC epoch (volume summed). */
function resampleCandles(candles, minutes) {
  if (minutes <= 1) return candles;
  const ms = minutes * 60000, out = [];
  for (const c of candles) {
    const k = Math.floor(c.time / ms) * ms, last = out[out.length - 1];
    if (last && last.time === k) { last.high = Math.max(last.high, c.high); last.low = Math.min(last.low, c.low); last.close = c.close; last.volume += c.volume || 0; }
    else out.push({ time: k, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume || 0 });
  }
  return out;
}

const finite = Number.isFinite;

/**
 * Order book snapshot -> liquidity metrics.
 * @param book { t (ms), bids: [{px, sz, ct?}], asks: [...] }  (any order)
 * @param o    { levels = 10, atr, tick, bandAtr = 0.25 }
 */
function analyzeBook(book, { levels = 10, atr = null, tick = null, bandAtr = 0.25 } = {}) {
  const norm = (a, desc) => (a || []).map((x) => ({ px: +x.px, sz: +x.sz, ct: x.ct != null ? +x.ct : null })).filter((x) => finite(x.px) && finite(x.sz) && x.sz > 0).sort((a, b) => (desc ? b.px - a.px : a.px - b.px));
  const B = norm(book?.bids, true).slice(0, levels), A = norm(book?.asks, false).slice(0, levels);
  if (!B.length || !A.length) return null;
  const bb = B[0], ba = A[0], mid = (bb.px + ba.px) / 2, spread = ba.px - bb.px;
  const sum = (a, n) => a.slice(0, n).reduce((s, x) => s + x.sz, 0), imb = (n) => { const b = sum(B, n), a = sum(A, n); return b + a ? (b - a) / (b + a) : 0; };
  const band = atr ? atr * bandAtr : null, inBand = (a) => (band == null ? null : a.filter((x) => Math.abs(x.px - mid) <= band).reduce((s, x) => s + x.sz, 0));
  const wall = (a) => { const w = a.reduce((m, x) => (x.sz > m.sz ? x : m), a[0]); return { px: w.px, sz: w.sz, x: w.sz / (sum(a, a.length) / a.length) }; };
  return { t: book.t ?? null, levels: Math.min(B.length, A.length), bestBid: bb.px, bestAsk: ba.px, bidSz: bb.sz, askSz: ba.sz, spread, spreadTicks: tick ? spread / tick : null, mid,
    micro: (bb.px * ba.sz + ba.px * bb.sz) / (bb.sz + ba.sz), imb1: imb(1), imb5: imb(5), imb10: imb(10), depthBid: sum(B, B.length), depthAsk: sum(A, A.length),
    bandBid: inBand(B), bandAsk: inBand(A), band, wallBid: wall(B), wallAsk: wall(A), bids: B, asks: A };
}

/** TP1 blocks: @book (metrics) and @lob (levels). imb > 0 means more resting size on the bid. */
function bookCompact(bk, { digits = 5, stats = true, levels = true } = {}) {
  if (!bk) return '';
  const p = (v) => +v.toFixed(digits), q = (v) => +v.toPrecision(4), sg = (v) => (v > 0 ? '+' : '') + +v.toFixed(2), L = [];
  if (stats) L.push(`@book${bk.t ? ' t=' + new Date(bk.t).toISOString().slice(11, 19) : ''} bid=${p(bk.bestBid)} ask=${p(bk.bestAsk)} spr=${+bk.spread.toPrecision(3)}${bk.spreadTicks != null ? ' spr_tk=' + +bk.spreadTicks.toFixed(1) : ''} mid=${p(bk.mid)} micro=${p(bk.micro)} imb1=${sg(bk.imb1)} imb5=${sg(bk.imb5)} imb10=${sg(bk.imb10)} depB=${q(bk.depthBid)} depA=${q(bk.depthAsk)}${bk.band != null ? ` bandB=${q(bk.bandBid)} bandA=${q(bk.bandAsk)}` : ''} wallB=${p(bk.wallBid.px)}@${q(bk.wallBid.sz)}(x${+bk.wallBid.x.toFixed(1)}) wallA=${p(bk.wallAsk.px)}@${q(bk.wallAsk.sz)}(x${+bk.wallAsk.x.toFixed(1)})`);
  if (levels) { const n = Math.min(bk.bids.length, bk.asks.length); L.push(`@lob ${n} levels: bid_px|bid_sz|ask_px|ask_sz`, ...Array.from({ length: n }, (_, i) => [p(bk.bids[i].px), q(bk.bids[i].sz), p(bk.asks[i].px), q(bk.asks[i].sz)].join('|'))); }
  return L.join('\n');
}













const hasTime = (c) => c.every((x) => isNum(x.time));
const safe = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };

/**
 * Computes every level type in one call.
 * Each section can be tuned via opts.<section> (passed to the underlying function)
 * or turned off with opts.<section> = false.
 * Sections: round, fibonacci, pivots, periods, sessions, trendlines, regression,
 *           sr, supplyDemand, fvg, orderBlocks, ranges, volumeProfile
 */
function analyzeLevels(candles, opts = {}) {
  assertCandles(candles, 20);
  const n = candles.length;
  const last = candles[n - 1];
  const on = (k) => opts[k] !== false;
  const o = (k) => (typeof opts[k] === 'object' && opts[k] ? opts[k] : {});
  const tz = opts.tzOffsetHours ?? 0;
  const times = hasTime(candles);

  const swings = findSwings(candles, o('swings'));
  const pivots = zigzag(candles, o('zigzag'));
  const withSw = (k) => ({ swings, ...o(k) });

  const trend = on('trendlines') ? safe(() => findTrendlines(candles, withSw('trendlines')), { support: [], resistance: [] }) : null;
  const channels = trend
    ? { support: trend.support[0] ? trendChannel(candles, trend.support[0]) : null,
        resistance: trend.resistance[0] ? trendChannel(candles, trend.resistance[0]) : null }
    : null;

  return {
    meta: { count: n, lastClose: last.close, lastTime: last.time, atr: lastAtr(candles) },
    swings: swings.slice(-10),
    round: on('round') ? roundLevels(last.close, o('round')) : null,
    fibonacci: on('fibonacci') ? safe(() => autoFib(candles, { pivots, ...o('fibonacci') })) : null,
    pivots: on('pivots') && times
      ? { day: safe(() => pivotsFromCandles(candles, { period: 'day', tzOffsetHours: tz, ...o('pivots') })),
          week: safe(() => pivotsFromCandles(candles, { period: 'week', tzOffsetHours: tz, ...o('pivots') })) }
      : null,
    periods: on('periods') && times
      ? { day: periodLevels(candles, { period: 'day', tzOffsetHours: tz }),
          week: periodLevels(candles, { period: 'week', tzOffsetHours: tz }),
          month: periodLevels(candles, { period: 'month', tzOffsetHours: tz }) }
      : null,
    sessions: on('sessions') && times ? sessionRanges(candles, { tzOffsetHours: tz, ...o('sessions') }) : null,
    trendlines: trend,
    channels,
    regression: on('regression') ? regressionChannel(candles, o('regression')) : null,
    zones: {
      sr: on('sr') ? srZones(candles, withSw('sr')) : null,
      supplyDemand: on('supplyDemand') ? safe(() => supplyDemandZones(candles, o('supplyDemand')), []) : null,
      fvg: on('fvg') ? fairValueGaps(candles, o('fvg')) : null,
      orderBlocks: on('orderBlocks') ? safe(() => orderBlocks(candles, withSw('orderBlocks')), []) : null,
      ranges: on('ranges') ? consolidationRanges(candles, o('ranges')) : null,
    },
    indicators: on('indicators') ? safe(() => analyzeIndicators(candles, { swings, tzOffsetHours: tz, ...o('indicators') })) : null,
    extra: on('extra') ? safe(() => analyzeExtra(candles, { volumeKind: o('indicators').volumeKind, ...o('extra') })) : null,
    orderflow: on('orderflow') ? safe(() => analyzeOrderflow(candles, o('orderflow'))) : null,
    volumeProfile: on('volumeProfile') && candles.some((c) => isNum(c.volume)) ? volumeProfile(candles, o('volumeProfile')) : null,
  };
}

/** Flat list of every horizontal level / zone / projected line with distance to the last close. */
function flattenLevels(r) {
  const price = r.meta.lastClose;
  const items = [];
  const pt = (group, label, p, extra = {}) => items.push({ group, label, price: p, ...extra });
  const zone = (group, label, z, extra = {}) =>
    items.push({ group, label, price: z.mid ?? (z.low + z.high) / 2, low: z.low, high: z.high, ...extra });

  r.round?.forEach((l) => pt('round', l.major ? 'Round (major)' : 'Round', l.price, { major: l.major }));
  r.fibonacci?.retracements.forEach((l) => pt('fib', `Fib ${l.ratio}`, l.price));
  r.fibonacci?.projections.forEach((l) => pt('fib', `Fib proj ${l.ratio}`, l.price));
  for (const k of ['day', 'week']) {
    const pv = r.pivots?.[k];
    if (pv) for (const [name, v] of Object.entries(pv.levels)) pt('pivot', `Pivot ${k} ${name}`, v);
  }
  if (r.periods) for (const k of ['day', 'week', 'month']) r.periods[k].list.forEach((l) => pt('period', l.name, l.price));
  r.sessions?.forEach((l) => pt('session', l.name, l.price));
  for (const t of ['support', 'resistance']) r.trendlines?.[t].forEach((l) => pt('trendline', `Trendline ${t} (${l.trend})`, l.valueNow, { touches: l.touches }));
  if (r.regression) {
    pt('regression', 'Regression mid', r.regression.mid);
    pt('regression', 'Regression upper', r.regression.upper);
    pt('regression', 'Regression lower', r.regression.lower);
  }
  r.zones.sr?.forEach((z) => zone('sr', `S/R ${z.kind}`, z, { strength: z.strength, touches: z.touches }));
  r.zones.supplyDemand?.forEach((z) => zone('supplyDemand', `${z.type} (${z.status})`, z, { strength: z.strength }));
  r.zones.fvg?.forEach((z) => zone('fvg', `FVG ${z.type} (${z.status})`, z));
  r.zones.orderBlocks?.forEach((z) => zone('orderBlock', `OB ${z.type} (${z.status})`, z));
  r.zones.ranges?.forEach((z) => zone('range', z.active ? 'Range (active)' : 'Range', z));
  if (r.volumeProfile) {
    pt('volume', 'POC', r.volumeProfile.poc);
    pt('volume', 'VAH', r.volumeProfile.vah);
    pt('volume', 'VAL', r.volumeProfile.val);
    r.volumeProfile.nodes.forEach((nd) => pt('volume', nd.kind.toUpperCase(), nd.price));
  }

  for (const it of items) {
    const lo = it.low ?? it.price, hi = it.high ?? it.price;
    it.side = price > hi ? 'below' : price < lo ? 'above' : 'inside'; // side of the level relative to price
    it.distance = it.side === 'below' ? price - hi : it.side === 'above' ? lo - price : 0;
    it.distancePct = (it.distance / price) * 100;
  }
  return items;
}

/** Nearest levels above and below the current price. */
function nearestLevels(r, { above = 5, below = 5, groups = null } = {}) {
  const all = flattenLevels(r).filter((i) => !groups || groups.includes(i.group));
  const by = (a, b) => a.distance - b.distance;
  return {
    above: all.filter((i) => i.side === 'above').sort(by).slice(0, above),
    below: all.filter((i) => i.side === 'below').sort(by).slice(0, below),
    inside: all.filter((i) => i.side === 'inside'),
  };
}

const T = {
  ru: { price: 'Цена', above: 'Уровни выше цены', below: 'Уровни ниже цены', inside: 'Цена внутри зон', trend: 'Трендовые линии', none: 'нет', touches: 'касаний' },
  en: { price: 'Price', above: 'Levels above price', below: 'Levels below price', inside: 'Price is inside zones', trend: 'Trend lines', none: 'none', touches: 'touches' },
};

/** Compact text for LLM prompts. */
function levelsToText(r, { above = 6, below = 6, digits, lang = 'ru', groups = null, explain = false } = {}) {
  const t = T[lang] ?? T.ru;
  const d = digits ?? autoDigits(r.meta.lastClose);
  const f = (x) => x.toFixed(d);
  const fmt = (i) => {
    const p = i.low != null ? `${f(i.low)}–${f(i.high)}` : f(i.price);
    const dist = i.distance ? ` (${i.distancePct.toFixed(2)}%)` : '';
    return `- ${explain ? i.label : i.label.replace(/ \([^)]*\)$/, '')}: ${p}${dist}`;
  };
  const nl = nearestLevels(r, { above, below, groups });
  const lines = [`${t.price}: ${f(r.meta.lastClose)}, ATR: ${f(r.meta.atr)}`];
  lines.push(`${t.above}:`, ...(nl.above.length ? nl.above.map(fmt) : [`- ${t.none}`]));
  lines.push(`${t.below}:`, ...(nl.below.length ? nl.below.map(fmt) : [`- ${t.none}`]));
  if (nl.inside.length) lines.push(`${t.inside}:`, ...nl.inside.map(fmt));
  const tl = [...(r.trendlines?.support ?? []), ...(r.trendlines?.resistance ?? [])];
  if (tl.length) {
    lines.push(`${t.trend}:`);
    for (const l of tl) lines.push(`- ${explain ? l.type + ' ' + l.trend : l.type}: ${f(l.valueNow)} (${l.touches} ${t.touches})`);
  }
  return lines.join('\n');
}

/* Economic calendar helpers (pure functions; fetching is done by the caller, e.g. biquote /api/calendar). */
const CAL_CUR = { USD: ['US'], EUR: ['EU', 'DE', 'FR'], GBP: ['GB'], JPY: ['JP'], AUD: ['AU'], NZD: ['NZ'], CAD: ['CA'], CHF: ['CH'], CNY: ['CN'], CNH: ['CN'], TRY: ['TR'], MXN: ['MX'], ZAR: ['ZA'], SEK: ['SE'], NOK: ['NO'], PLN: ['PL'], SGD: ['SG'], HKD: ['HK'], INR: ['IN'], BRL: ['BR'], KRW: ['KR'] };
const CAL_IDX = [['US30', ['US']], ['DJ', ['US']], ['SPX', ['US']], ['US500', ['US']], ['SP500', ['US']], ['NAS', ['US']], ['USTEC', ['US']], ['NDX', ['US']], ['US2000', ['US']], ['RUT', ['US']],
  ['DE40', ['DE', 'EU']], ['GER', ['DE', 'EU']], ['DAX', ['DE', 'EU']], ['FRA40', ['FR', 'EU']], ['CAC', ['FR', 'EU']], ['EU50', ['EU']], ['STOXX', ['EU']], ['UK100', ['GB']], ['FTSE', ['GB']],
  ['JP225', ['JP']], ['NIKKEI', ['JP']], ['AUS200', ['AU']], ['HK50', ['HK', 'CN']], ['CHINA', ['CN']]];
const CAL_CRYPTO = /^(BTC|ETH|LTC|XRP|SOL|BNB|ADA|DOT|DOGE|AVAX|LINK|MATIC|TRX|TON|XLM|BCH)/;
const CAL_RANK = { low: 1, medium: 2, high: 3 }, CAL_IMP = { low: 'L', medium: 'M', high: 'H' }, CAL_MULT = { thousands: 'K', millions: 'M', billions: 'B', trillions: 'T' };

/** Which calendar countries move this asset. -> { kind, currencies, countries } */
function inferCountries(symbol = '') {
  const s = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const a = s.slice(0, 3), b = s.slice(3, 6);
  if (CAL_CUR[a] && CAL_CUR[b]) return { kind: 'fx', currencies: [a, b], countries: [...new Set([...CAL_CUR[a], ...CAL_CUR[b]])] };
  if (/^X(AU|AG|PT|PD)/.test(s) && CAL_CUR[b]) return { kind: 'metal', currencies: [b], countries: CAL_CUR[b] };
  if (CAL_CRYPTO.test(s)) { const q = (s.match(/(USDT|USDC|USD|EUR|GBP|JPY)$/) || ['USD'])[0].replace(/USD[TC]/, 'USD'); return { kind: 'crypto', currencies: [q], countries: CAL_CUR[q] || ['US'] }; }
  const ix = CAL_IDX.find(([k]) => s.startsWith(k));
  if (ix) return { kind: 'index', currencies: [], countries: ix[1] };
  if (/OIL|WTI|BRENT|XTI|XBR/.test(s)) return { kind: 'oil', currencies: ['USD'], countries: ['US'] };
  return { kind: 'unknown', currencies: [], countries: ['US'] };
}

/** value formatted the way the feed intends: scale suffix + percent sign (null -> '') */
function fmtEventValue(e, v) {
  return v == null ? '' : `${+Number(v).toFixed(e.digits ?? 2)}${CAL_MULT[e.multiplier] || ''}${e.unit === 'percent' ? '%' : ''}`;
}

/**
 * Condense raw calendar events for one asset.
 * @param events raw array from /api/calendar
 * @param o { symbol, countries, minImportance='medium', upcoming=10, recent=8, recentHours=48, holidays=5, now, history: {eventId: rawRows[]} }
 */
function analyzeCalendar(events, o = {}) {
  const now = o.now ?? Date.now(), min = CAL_RANK[o.minImportance || 'medium'];
  const countries = o.countries ?? inferCountries(o.symbol).countries, cs = new Set(countries);
  const rec = (e) => {
    const sur = e.actual != null && e.forecast != null ? e.actual - e.forecast : null;
    return { t: e.time, min: Math.round((Date.parse(e.time) - now) / 6e4), ctry: e.countryCode, imp: CAL_IMP[e.importance] || '?', name: String(e.name).replace(/\|/g, '/'), sector: e.sector, eventId: e.eventId,
      actual: fmtEventValue(e, e.actual), forecast: fmtEventValue(e, e.forecast), previous: fmtEventValue(e, e.revisedPrevious ?? e.previous), revised: e.revisedPrevious != null,
      surprise: sur == null ? '' : (sur > 0 ? '+' : '') + fmtEventValue(e, sur), surprisePct: sur != null && e.forecast ? +((100 * sur) / Math.abs(e.forecast)).toFixed(1) : null, timeMode: e.timeMode };
  };
  const mine = events.filter((e) => cs.has(e.countryCode));
  const real = mine.filter((e) => e.type !== 'holiday' && (CAL_RANK[e.importance] || 0) >= min);
  const t = (e) => Date.parse(e.time);
  const up = real.filter((e) => t(e) > now).sort((a, b) => t(a) - t(b)).slice(0, o.upcoming ?? 10).map((e) => {
    const r = rec(e), h = o.history?.[e.eventId];
    if (h?.length) r.hist = h.slice(0, 6).map((x) => ({ a: fmtEventValue(e, x.actual), f: fmtEventValue(e, x.forecast) }));
    return r;
  });
  const done = real.filter((e) => t(e) <= now && t(e) >= now - (o.recentHours ?? 48) * 36e5 && e.actual != null).sort((a, b) => t(b) - t(a)).slice(0, o.recent ?? 8).map(rec);
  const hol = mine.filter((e) => e.type === 'holiday' && t(e) > now).sort((a, b) => t(a) - t(b)).slice(0, o.holidays ?? 5).map(rec);
  return { countries, minImportance: o.minImportance || 'medium', nextHighInMin: up.find((e) => e.imp === 'H')?.min ?? null, upcoming: up, recent: done, holidays: hol };
}

/** Compact table block for the TP format. */
function calendarCompact(C) {
  const L = [`@cal ctry=${C.countries.join(',')} imp>=${C.minImportance[0].toUpperCase()}${C.nextHighInMin != null ? ' next_H_min=' + C.nextHighInMin : ''}`];
  if (C.upcoming.length) { L.push('up: min|ctry|imp|event|fc|prev|hist a/f'); C.upcoming.forEach((e) => L.push([e.min, e.ctry, e.imp, e.name, e.forecast, e.previous, (e.hist || []).map((h) => `${h.a}/${h.f}`).join(',')].join('|'))); }
  if (C.recent.length) { L.push('done: min|ctry|imp|event|act|fc|prev|surprise'); C.recent.forEach((e) => L.push([e.min, e.ctry, e.imp, e.name, e.actual, e.forecast, e.previous, e.surprise].join('|'))); }
  if (C.holidays.length) { L.push('hol: min|ctry|event'); C.holidays.forEach((e) => L.push([e.min, e.ctry, e.name].join('|'))); }
  return L.join('\n');
}

/** Plain-text block (numbers only). */
function calendarToText(C, { lang = 'ru' } = {}) {
  const w = (ru, en) => (lang === 'en' ? en : ru), L = [`${w('Экономический календарь', 'Economic calendar')} (${C.countries.join(', ')}, ${w('важность', 'importance')} ≥ ${C.minImportance}):`];
  if (C.upcoming.length) L.push(w('Предстоящие', 'Upcoming') + ':', ...C.upcoming.map((e) => `- ${e.min} ${w('мин', 'min')} | ${e.ctry} | ${e.imp} | ${e.name} | ${w('прогноз', 'forecast')} ${e.forecast || 'n/a'} | ${w('пред.', 'prev')} ${e.previous || 'n/a'}${e.hist ? ' | ' + w('прошлые', 'past') + ' ' + e.hist.map((h) => `${h.a}/${h.f}`).join(', ') : ''}`));
  if (C.recent.length) L.push(w('Опубликовано', 'Released') + ':', ...C.recent.map((e) => `- ${e.min} ${w('мин', 'min')} | ${e.ctry} | ${e.imp} | ${e.name} | ${w('факт', 'actual')} ${e.actual} | ${w('прогноз', 'forecast')} ${e.forecast || 'n/a'} | ${w('пред.', 'prev')} ${e.previous || 'n/a'}${e.surprise ? ' | Δ ' + e.surprise : ''}`));
  if (C.holidays.length) L.push(w('Праздники', 'Holidays') + ':', ...C.holidays.map((e) => `- ${e.min} ${w('мин', 'min')} | ${e.ctry} | ${e.name}`));
  return L.join('\n');
}










const iso = (t) => new Date(toMs(t)).toISOString().slice(0, 16);

/** OHLCV of the last n candles; indicator columns (from analyzeIndicators history) are appended when lengths match. */
function candlesTable(candles, n = 30, { indicators = null, digits } = {}) {
  const m = Math.min(n, candles.length), cs = candles.slice(-m), d = digits ?? autoDigits(cs[m - 1].close);
  const H = indicators && indicators.history && indicators.history.time.length === m ? indicators.history : null;
  const extra = H ? Object.keys(H).filter((k) => k !== 'time' && k !== 'close') : [];
  const rows = [['time', 'open', 'high', 'low', 'close', 'volume', ...extra].join(',')];
  cs.forEach((c, i) => {
    const vol = c.volume == null ? '' : c.volume >= 100 ? Math.round(c.volume) : +c.volume.toFixed(2);
    rows.push([iso(c.time), c.open.toFixed(d), c.high.toFixed(d), c.low.toFixed(d), c.close.toFixed(d), vol, ...extra.map((k) => (H[k][i] == null ? '' : H[k][i]))].join(','));
  });
  return rows.join('\n');
}

/**
 * Ready-to-send prompt context: header (asset, timeframe, current price, time) + levels + indicators + candle history.
 * @param r      result of analyzeLevels(candles, { indicators: { history: bars } })
 * @param o      { symbol, timeframe, bars=30, lang='ru', levels=true, indicators=true, above=8, below=8, lastBarOpen, volumeKind, digits }
 */
function buildPrompt(r, candles, o = {}) {
  const off = new Set(o.off || []);
  r = maskResult(r, off); o = { ...o, off };
  if ((o.format ?? 'compact') === 'compact') return buildCompact(r, candles, o);
  const { symbol = '', timeframe = '', bars = 30, lang = 'ru', levels = true, indicators = true, above = 8, below = 8, lastBarOpen = null, volumeKind = null, explain = false, extra = true } = o;
  const w = (ru, en) => (lang === 'en' ? en : ru), last = candles[candles.length - 1], d = o.digits ?? autoDigits(last.close);
  const parts = [[
    `${w('Актив', 'Asset')}: ${symbol || 'n/a'}`,
    `${w('Таймфрейм', 'Timeframe')}: ${timeframe || 'n/a'}`,
    `${w('Текущая цена', 'Current price')}: ${last.close.toFixed(d)}${lastBarOpen ? w(' (последняя свеча ещё формируется)', ' (last candle still forming)') : ''}`,
    `${w('Время последней свечи (UTC)', 'Last candle time (UTC)')}: ${iso(last.time)}`,
  ].join('\n')];
  if (levels) parts.push(levelsToText(r, { above, below, digits: d, lang, explain }));
  if (indicators && r.indicators) { const it = indicatorsToText(r.indicators, { lang, digits: d, explain, off: [...off] }); if (it) parts.push(it); }
  if (indicators && extra && r.extra) parts.push(extraToText(r.extra, { lang, digits: d }));
  if (o.calendar && !off.has('cal')) parts.push(calendarToText(o.calendar, { lang }));
  if (o.ticks) { const tt = ticksCompact(o.ticks, { digits: d, stats: !off.has('tk.stats'), buckets: !off.has('tk.buckets'), raw: !off.has('tk.raw') }); if (tt) parts.push(tt); }
  if (o.notes?.length) parts.push(o.notes.map((n) => '@note ' + n).join('\n'));
  if (o.book) { const bt = bookCompact(o.book, { digits: d, stats: !off.has('bk.stats'), levels: !off.has('bk.levels') }); if (bt) parts.push(bt); }
  if (r.orderflow) parts.push(orderflowCompact(r.orderflow));
  if (o.trades) { const tt = tradesCompact(o.trades, { digits: d, stats: !off.has('tr.stats'), buckets: !off.has('tr.buckets'), profile: !off.has('tr.profile'), raw: !off.has('tr.raw') }); if (tt) parts.push(tt); }
  if (bars > 0 && !off.has('bars')) {
    const m = Math.min(bars, candles.length), tick = volumeKind === 'tick' ? w(', volume = тиковый объём', ', volume = tick volume') : '';
    parts.push(`${w('История', 'History')}: ${w('последние', 'last')} ${m} ${w('свечей', 'candles')} (${w('от старых к новым, цены в той же шкале', 'oldest to newest')}${tick}):\n` + candlesTable(candles, bars, { indicators: indicators ? r.indicators : null, digits: d }));
  }
  return parts.join('\n\n');
}

/* ---------------- compact "TP1" format: sectioned key=value lines + pipe tables, English keys, numbers only ---------------- */
const sp = (v, p = 5) => (Number.isFinite(v) ? +v.toPrecision(p) : '');
function levelTag(i) {
  const L = i.label;
  switch (i.group) {
    case 'round': return i.major ? 'rnd*' : 'rnd';
    case 'fib': return L.startsWith('Fib proj') ? 'fibp' + L.split(' ')[2] : 'fib' + L.split(' ')[1];
    case 'pivot': { const m = L.match(/Pivot (\w+) (\w+)/); return 'pv' + m[1][0].toUpperCase() + '.' + m[2]; }
    case 'trendline': return L.includes('support') ? 'tlS' : 'tlR';
    case 'sr': return 'sr';
    case 'supplyDemand': return L.split(' ')[0];
    case 'fvg': return L.includes('bullish') ? 'fvgB' : 'fvgS';
    case 'orderBlock': return L.includes('bullish') ? 'obB' : 'obS';
    case 'range': return 'range';
    case 'volume': return L.toLowerCase();
    default: return L; // period / session names (PDH, AsiaH ...)
  }
}
const STATUS = { fresh: 'f', tested: 't', open: 'o', partial: 'p', broken: 'b' };

function buildCompact(r, candles, o = {}) {
  const off = o.off instanceof Set ? o.off : new Set(o.off || []), on = (k) => !off.has(k);
  r = maskResult(r, off);
  const { symbol = '', timeframe = '', bars = 30, levels = true, indicators = true, extra = true, above = 10, below = 10, lastBarOpen = null, volumeKind = null } = o;
  const last = candles[candles.length - 1], px = last.close, d = o.digits ?? autoDigits(px), A = r.meta.atr, p = (v) => +v.toFixed(d);
  const out = [
    '#TP1 | levels: tag|lo|hi|dATR=(level-px)/ATR|n|st | times UTC | prices in quote units',
    `@meta sym=${symbol} tf=${timeframe} px=${p(px)} t=${iso(last.time)} live=${lastBarOpen ? 1 : 0} atr=${sp(A)} n=${candles.length} vol=${r.indicators?.meta.hasVolume ? volumeKind || 'yes' : 'none'}${o.source ? ' src=' + String(o.source).replace(/\s+/g, '_') : ''}`,
    ...(o.notes || []).map((n) => '@note ' + n),
  ];
  if (levels) {
    const rows = flattenLevels(r).filter((i) => i.group !== 'regression').map((i) => {
      const st = (i.label.match(/\((\w+)\)$/) || [])[1];
      return { tag: levelTag(i), lo: p(i.low ?? i.price), hi: i.high != null ? p(i.high) : '', d: i.side === 'above' ? i.distance / A : i.side === 'below' ? -i.distance / A : 0, n: i.touches ?? (i.strength != null ? +i.strength.toFixed(1) : ''), st: STATUS[st] ?? '' };
    });
    const merged = new Map();
    for (const x of rows) { const k = `${x.lo}|${x.hi}`; const m = merged.get(k); if (m) m.tag += '+' + x.tag; else merged.set(k, { ...x }); }
    const all = [...merged.values()], by = (a, b) => Math.abs(a.d) - Math.abs(b.d);
    const up = all.filter((x) => x.d > 0).sort(by).slice(0, above).sort((a, b) => b.lo - a.lo), dn = all.filter((x) => x.d < 0).sort(by).slice(0, below).sort((a, b) => b.lo - a.lo), mid = all.filter((x) => x.d === 0).sort((a, b) => b.lo - a.lo).slice(0, 8);
    const row = (x) => [x.tag, x.lo, x.hi, x.d ? (x.d > 0 ? '+' : '') + +x.d.toFixed(2) : 0, x.n, x.st].join('|').replace(/\|+$/, '');
    out.push('@levels', ...up.map(row), `px|${p(px)}`, ...mid.map(row), ...dn.map(row));
    const lines = [...(r.trendlines?.support || []), ...(r.trendlines?.resistance || [])].map((l) => [l.type === 'support' ? 'tlS' : 'tlR', p(l.valueNow), +(l.slope / A).toFixed(3), l.touches, candles.length - 1 - l.p1.index].join('|'));
    if (lines.length) out.push('@lines tag|now|slopeATR/bar|touches|age_bars', ...lines);
    if (r.fibonacci) { const F = r.fibonacci; out.push(`@fib a=${p(F.a.price)}@${F.a.index} b=${p(F.b.price)}@${F.b.index} pos=${+F.currentRatio.toFixed(3)}`); }
  }
  if (indicators && r.indicators) {
    const I = r.indicators, T = I.trend, M = I.momentum, V = I.volatility, kv = [];
    const put = (k, v, price) => { if (Number.isFinite(v)) kv.push(`${k}=${price ? p(v) : sp(v)}`); };
    if (on('ind.ema')) put(`ema${T.ema.period}`, T.ema.value, 1);
    if (on('ind.adx')) { put('adx', T.adx.value); put('+di', T.adx.plusDI); put('-di', T.adx.minusDI); }
    if (on('ind.supertrend')) put('st', T.supertrend.value, 1);
    if (T.ichimoku && on('ind.ichimoku')) for (const [k, v] of Object.entries({ tenkan: T.ichimoku.tenkan, kijun: T.ichimoku.kijun, spanA: T.ichimoku.spanA, spanB: T.ichimoku.spanB, fSpanA: T.ichimoku.futureSpanA, fSpanB: T.ichimoku.futureSpanB })) put(k, v, 1);
    if (on('ind.rsi')) put('rsi', M.rsi.value);
    if (on('ind.macd')) { put('macd', M.macd.macd); put('macdS', M.macd.signal); put('macdH', M.macd.hist); }
    if (on('ind.stoch')) { put('stK', M.stochastic.k); put('stD', M.stochastic.d); }
    if (on('ind.bb')) { put('bbL', V.bollinger.lower, 1); put('bbM', V.bollinger.mid, 1); put('bbU', V.bollinger.upper, 1); put('bbB', V.bollinger.pctB); put('bbW', V.bollinger.bandwidth); }
    if (on('ind.don')) { put('donL', V.donchian.lower, 1); put('donM', V.donchian.mid, 1); put('donU', V.donchian.upper, 1); }
    if (I.volume) { if (on('ind.vwap')) put('vwap', I.volume.vwap.value, 1); if (on('ind.obv')) put('obv', I.volume.obv.value); if (on('ind.rvol')) put('rvol', I.volume.rvol.value); }
    if (r.regression) { put('regM', r.regression.mid, 1); put('regU', r.regression.upper, 1); put('regL', r.regression.lower, 1); put('regSlopeATR', r.regression.slope / A); put('regR2', r.regression.r2); }
    if (kv.length) out.push('@ind ' + kv.join(' '));
    if (extra && r.extra) {
      const ek = [];
      for (const [name, e] of Object.entries(r.extra.indicators)) for (const [k, v] of Object.entries(e.values)) ek.push(`${name}${k === 'v' ? '' : '_' + k}=${e.price ? p(v) : sp(v, 4)}`);
      if (ek.length) out.push('@ind2 ' + ek.join(' '));
    }
  }
  if (o.book) { const bt = bookCompact(o.book, { digits: d, stats: on('bk.stats'), levels: on('bk.levels') }); if (bt) out.push(bt); }
  if (r.orderflow) out.push(orderflowCompact(r.orderflow));
  if (o.trades) { const tt = tradesCompact(o.trades, { digits: d, stats: on('tr.stats'), buckets: on('tr.buckets'), profile: on('tr.profile'), raw: on('tr.raw') }); if (tt) out.push(tt); }
  if (o.ticks) { const tt = ticksCompact(o.ticks, { digits: d, stats: on('tk.stats'), buckets: on('tk.buckets'), raw: on('tk.raw') }); if (tt) out.push(tt); }
  if (o.calendar && on('cal')) out.push(calendarCompact(o.calendar));
  if (bars > 0 && on('bars')) {
    const m = Math.min(bars, candles.length), cs = candles.slice(-m), H = r.indicators?.history?.time.length === m ? r.indicators.history : null;
    const ex = H ? Object.keys(H).filter((k) => k !== 'time' && k !== 'close') : [];
    const OF = r.orderflow ? [['delta', r.orderflow.series.delta], ['cvd', r.orderflow.series.cvd], ['buyR', r.orderflow.series.buyRatio]].filter(([k]) => on('col.' + k)).map(([k, a]) => [k, a.slice(-m)]) : [];
    out.push(`@bars t,o,h,l,c,v${ex.length ? ',' + ex.join(',') : ''}${OF.map((x) => ',' + x[0]).join('')}`);
    cs.forEach((c, i) => out.push([iso(c.time).slice(5), p(c.open), p(c.high), p(c.low), p(c.close), c.volume == null ? '' : +c.volume.toPrecision(5), ...ex.map((k) => (H[k][i] == null ? '' : sp(H[k][i]))), ...OF.map(([, a]) => (Number.isFinite(a[i]) ? sp(a[i], 4) : ''))].join(',')));
  }
  return out.join('\n');
}






/* "User" version of the prompt: HTML with coloured section headings and plain-language explanations. */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sec = (title, color, desc, body) => `<section style="margin:0 0 20px"><h3 style="margin:0 0 4px;padding:5px 10px;border-left:5px solid ${color};background:${color}22;color:${color};font-size:16px">${esc(title)}</h3><p style="margin:0 0 8px;color:#8b95a7;font-size:13px">${esc(desc)}</p>${body}</section>`;
const tbl = (head, rows) => `<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:13px;width:100%"><thead><tr>${head.map((h) => `<th style="text-align:left;padding:3px 8px;color:#8b95a7;border-bottom:1px solid #2a3140;white-space:nowrap">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td style="padding:3px 8px;border-bottom:1px solid #1d2330;white-space:nowrap">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const ul = (items) => `<ul style="margin:0;padding-left:20px;line-height:1.65">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
const sgnum = (v, f) => (v > 0 ? '+' : '') + f(v);
const isoMin = (t) => new Date(toMs(t)).toISOString().slice(0, 16).replace('T', ' ');

const PER = { PDH: 'Максимум вчера', PDL: 'Минимум вчера', PDC: 'Закрытие вчера', DO: 'Открытие дня', DH: 'Максимум дня', DL: 'Минимум дня', PWH: 'Максимум прошлой недели', PWL: 'Минимум прошлой недели', PWC: 'Закрытие прошлой недели', WO: 'Открытие недели', WH: 'Максимум недели', WL: 'Минимум недели', PMH: 'Максимум прошлого месяца', PML: 'Минимум прошлого месяца', PMC: 'Закрытие прошлого месяца', MO: 'Открытие месяца', MH: 'Максимум месяца', ML: 'Минимум месяца' };
const ST_RU = { fresh: 'нетронутая', tested: 'тестировалась', open: 'открыт', partial: 'частично закрыт', broken: 'пробита' };
function levelRu(i) {
  const L = i.label, st = (L.match(/\((\w+)\)$/) || [])[1], tail = st && ST_RU[st] ? ` — ${ST_RU[st]}` : '';
  switch (i.group) {
    case 'round': return i.major ? 'Круглый уровень (крупный)' : 'Круглый уровень';
    case 'fib': return L.startsWith('Fib proj') ? `Фибо-проекция ${+(L.split(' ')[2] * 100).toFixed(1)}%` : `Фибоначчи ${+(L.split(' ')[1] * 100).toFixed(1)}%`;
    case 'pivot': { const m = L.match(/Pivot (\w+) (\w+)/); return `Пивот (${m[1] === 'day' ? 'день' : 'неделя'}) ${m[2]}`; }
    case 'period': return PER[L] || L;
    case 'session': { const m = L.match(/^(p?)(Asia|London|NewYork)([HL])$/); return m ? `${{ Asia: 'Азия', London: 'Лондон', NewYork: 'Нью-Йорк' }[m[2]]}: ${m[3] === 'H' ? 'максимум' : 'минимум'}${m[1] ? ' (вчера)' : ''}` : L; }
    case 'trendline': return `Трендовая линия ${L.includes('support') ? 'поддержки' : 'сопротивления'}`;
    case 'sr': return 'Зона поддержки/сопротивления';
    case 'supplyDemand': return (L.startsWith('demand') ? 'Зона спроса' : 'Зона предложения') + tail;
    case 'fvg': return (L.includes('bullish') ? 'FVG бычий (имбаланс)' : 'FVG медвежий (имбаланс)') + tail;
    case 'orderBlock': return (L.includes('bullish') ? 'Order block бычий' : 'Order block медвежий') + tail;
    case 'range': return 'Боковой диапазон';
    case 'regression': return { 'Regression mid': 'Регрессия: середина канала', 'Regression upper': 'Регрессия: верхняя граница', 'Regression lower': 'Регрессия: нижняя граница' }[L] || L;
    case 'volume': return { POC: 'POC — уровень максимального объёма', VAH: 'VAH — верх зоны стоимости', VAL: 'VAL — низ зоны стоимости', HVN: 'Узел высокого объёма', LVN: 'Узел низкого объёма' }[L] || L;
    default: return L;
  }
}
const IND_KEY = { EMA: 'ind.ema', ADX: 'ind.adx', Supertrend: 'ind.supertrend', Ichimoku: 'ind.ichimoku', RSI: 'ind.rsi', MACD: 'ind.macd', Stochastic: 'ind.stoch', Bollinger: 'ind.bb', Donchian: 'ind.don', VWAP: 'ind.vwap', OBV: 'ind.obv', 'Относительный объём': 'ind.rvol' };
const IND_SECTIONS = [
  ['Тренд', '#22c55e', 'Направление и сила тренда: где цена относительно средних и облака, есть ли выраженное движение.', ['EMA', 'ADX', 'Supertrend', 'Ichimoku', 'Структура']],
  ['Импульс', '#eab308', 'Скорость движения цены, зоны перекупленности и перепроданности, дивергенции.', ['RSI', 'MACD', 'Stochastic']],
  ['Волатильность', '#f97316', 'Размах движения: насколько широки свечи и каналы.', ['ATR', 'Bollinger', 'Donchian']],
  ['Объём по свечам', '#14b8a6', 'Положение цены относительно средневзвешенной по объёму цены и динамика объёма.', ['VWAP', 'OBV', 'Относительный объём']],
  ['Свечные паттерны', '#e879f9', 'Формации на последних свечах.', ['Свечные паттерны']],
];
const IMP = { H: 'высокая', M: 'средняя', L: 'низкая' };

/**
 * @param o { symbol, timeframe, bars = 30, lastBarOpen, volumeKind, calendar, ticks, trades, off, above = 8, below = 8 }
 * @returns HTML string
 */
function buildReport(r, candles, o = {}) {
  const off = new Set(o.off || []), on = (k) => !off.has(k);
  r = maskResult(r, off);
  const { symbol = '', timeframe = '', bars = 30, above = 8, below = 8 } = o, last = candles[candles.length - 1], d = o.digits ?? autoDigits(last.close), A = r.meta.atr, f = (v) => (Number.isFinite(v) ? v.toFixed(d) : 'n/a'), q = (v) => +Number(v).toPrecision(4);
  const out = [];
  const vk = o.volumeKind === 'real' ? 'реальный объём биржи' : o.volumeKind === 'tick' ? 'тиковый объём (число изменений котировки, не объём сделок)' : 'объём не указан';
  out.push(sec('Сводка', '#60a5fa', 'Актив, таймфрейм и текущее состояние. ATR — средний размах свечи: в нём измеряются расстояния до уровней.',
    ul([`Актив: ${symbol || 'n/a'}, таймфрейм: ${timeframe || 'n/a'}`, `Текущая цена: ${f(last.close)}${o.lastBarOpen ? ' (последняя свеча ещё формируется)' : ''}`, `Время последней свечи (UTC): ${isoMin(last.time)}`, `ATR: ${f(A)} (${((A / last.close) * 100).toFixed(3)}% от цены)`, `Данные об объёме: ${vk}`, ...(o.source ? [`Источник данных: ${o.source}`] : []), ...(o.notes || []), `Свечей использовано для расчёта: ${candles.length}`])));

  const lv = nearestLevels(r, { above, below });
  if (lv.above.length || lv.below.length || lv.inside.length) {
    const merge = (arr) => { const m = new Map(); for (const i of arr) { const k = `${i.low ?? i.price}|${i.high ?? ''}`, e = m.get(k); if (e) e.names.push(levelRu(i)); else m.set(k, { ...i, names: [levelRu(i)] }); } return [...m.values()]; };
    const row = (side, i) => [side, i.names.join(' · '), i.low != null ? `${f(i.low)} – ${f(i.high)}` : f(i.price), i.distance ? `${sgnum(i.side === 'above' ? i.distance / A : -i.distance / A, (v) => v.toFixed(1))} ATR (${i.distancePct.toFixed(2)}%)` : 'цена внутри', i.touches ?? (i.strength != null ? i.strength.toFixed(1) : '')];
    const rows = [...merge(lv.above).reverse().map((i) => row('выше цены', i)), ...merge(lv.inside).slice(0, 8).map((i) => row('внутри', i)), ...merge(lv.below).map((i) => row('ниже цены', i))];
    const tl = [...(r.trendlines?.support || []), ...(r.trendlines?.resistance || [])];
    out.push(sec('Уровни и зоны', '#f59e0b', 'Ближайшие ценовые уровни и зоны, от которых цена может отталкиваться или которые может пробить. «Сила» — число касаний или размер импульса.',
      tbl(['Где', 'Что это', 'Цена', 'Расстояние', 'Сила'], rows) + (tl.length ? `<p style="margin:8px 0 0;color:#8b95a7;font-size:13px">Трендовые линии: ${tl.map((l) => `${l.type === 'support' ? 'поддержка' : 'сопротивление'} ${f(l.valueNow)} (${l.touches} касаний, ${l.trend === 'up' ? 'вверх' : l.trend === 'down' ? 'вниз' : 'плоская'})`).join('; ')}</p>` : '')));
  }

  if (r.indicators) {
    const lines = indicatorsToText(r.indicators, { lang: 'ru', digits: d, explain: true }).split('\n').filter((l) => l.startsWith('- '));
    const keep = (l) => { const k = Object.keys(IND_KEY).find((n) => l.slice(2).startsWith(n)); return !k || on(IND_KEY[k]); };
    for (const [title, color, desc, keys] of IND_SECTIONS) {
      const ls = lines.filter((l) => keys.some((k) => l.slice(2).startsWith(k)) && keep(l)).map((l) => l.slice(2));
      if (ls.length) out.push(sec(title, color, desc, ul(ls)));
    }
    const tally = indicatorsToText(r.indicators, { lang: 'ru', digits: d, explain: true }).split('\n').find((l) => l.startsWith('Сводка'));
    if (tally) out.push(`<p style="margin:0 0 20px;color:#8b95a7;font-size:13px">${esc(tally)}</p>`);
  }
  if (r.extra && Object.keys(r.extra.indicators).length) {
    const rows = Object.values(r.extra.indicators).map((e) => [e.label, Object.entries(e.values).map(([k, v]) => `${k === 'v' ? '' : k + ' '}${e.price ? f(v) : q(v)}`).join(', ')]);
    out.push(sec('Дополнительные индикаторы', '#a78bfa', 'Значения на последней свече. Это числа без готового вывода: их смысл зависит от контекста и таймфрейма.', tbl(['Индикатор', 'Значение'], rows)));
  }

  const flow = [];
  if (r.orderflow) {
    const of = r.orderflow;
    flow.push(`Последняя свеча: объём ${q(of.volume)}, покупки по рынку ${q(of.buy)} (${(of.buyRatio * 100).toFixed(1)}%), продажи ${q(of.sell)}; дельта ${sgnum(of.delta, q)}.`, `Накопленная дельта (CVD) с начала загруженной истории: ${sgnum(of.cvd, q)}; за последние ${of.window} свечей изменилась на ${sgnum(of.cvdChange, q)}.`, `Сумма дельты за ${of.window} свечей: ${sgnum(of.deltaSum, q)}; средний размер дельты свечи: ${q(of.deltaAbsAvg)}.`);
  }
  const tr = o.trades;
  if (tr) {
    if (on('tr.stats')) flow.push(`Последние ${tr.n} сделок (${Math.round(tr.spanSec)} с): объём ${q(tr.volume)}, покупки ${q(tr.buy)}, продажи ${q(tr.sell)}, дельта ${sgnum(tr.delta, q)} (${sgnum(+tr.deltaPct.toFixed(1), (v) => v)}% объёма); VWAP ${f(tr.vwap)}.`, `Крупные сделки (верхний 1% по размеру, от ${q(tr.bigThreshold)}): ${tr.bigCount} шт., их дельта ${sgnum(tr.bigDelta, q)}; самая крупная сделка ${q(tr.maxQty)}.`);
    if (tr.profile && on('tr.profile')) flow.push(`Профиль объёма по этим сделкам: POC ${f(tr.profile.poc)}, зона стоимости (70% объёма) ${f(tr.profile.val)} – ${f(tr.profile.vah)}.`);
  }
  if (flow.length) out.push(sec('Реальный объём и поток ордеров', '#2dd4bf', 'Данные с биржи: сколько реально купили и продали «по рынку». Дельта = покупки минус продажи; положительная — перевес покупателей.', ul(flow)));
  if (tr && on('tr.buckets') && tr.buckets.length) out.push(sec('Сделки по интервалам', '#2dd4bf', `Те же сделки, сгруппированные по ${tr.bucketSec} с: как менялись объём покупок и продаж.`, tbl(['Время UTC', 'Сделок', 'Покупки', 'Продажи', 'Дельта', 'VWAP', 'Закрытие'], tr.buckets.map((b) => [new Date(b.t).toISOString().slice(11, 19), b.n, q(b.buy), q(b.sell), sgnum(b.delta, q), f(b.vwap), f(b.c)]))));

  const bk = o.book;
  if (bk && (on('bk.stats') || on('bk.levels'))) {
    let b = '';
    if (on('bk.stats')) b += ul([`Лучшая покупка ${f(bk.bestBid)} (объём ${q(bk.bidSz)}), лучшая продажа ${f(bk.bestAsk)} (объём ${q(bk.askSz)}); спред ${+bk.spread.toPrecision(3)}${bk.spreadTicks != null ? ` (${+bk.spreadTicks.toFixed(1)} тика)` : ''}; середина ${f(bk.mid)}, микроцена ${f(bk.micro)} (смещена в сторону более слабой стороны стакана)`,
      `Перекос заявок (больше 0 — на покупку выставлено больше): верхний уровень ${sgnum(bk.imb1, (v) => v.toFixed(2))}, 5 уровней ${sgnum(bk.imb5, (v) => v.toFixed(2))}, ${bk.levels} уровней ${sgnum(bk.imb10, (v) => v.toFixed(2))}`,
      `Объём заявок на ${bk.levels} уровнях: покупка ${q(bk.depthBid)}, продажа ${q(bk.depthAsk)}${bk.band != null ? `; в полосе ±0.25 ATR от середины: покупка ${q(bk.bandBid)}, продажа ${q(bk.bandAsk)}` : ''}`,
      `Самые крупные заявки («стены»): на покупку ${f(bk.wallBid.px)} — ${q(bk.wallBid.sz)} (в ${bk.wallBid.x.toFixed(1)} раза крупнее среднего), на продажу ${f(bk.wallAsk.px)} — ${q(bk.wallAsk.sz)} (в ${bk.wallAsk.x.toFixed(1)} раза)`]);
    if (on('bk.levels')) b += tbl(['Уровень', 'Покупка: цена', 'Покупка: объём', 'Продажа: цена', 'Продажа: объём'], Array.from({ length: Math.min(bk.bids.length, bk.asks.length) }, (_, i) => [i + 1, f(bk.bids[i].px), q(bk.bids[i].sz), f(bk.asks[i].px), q(bk.asks[i].sz)]));
    out.push(sec('Стакан заявок', '#f472b6', 'Выставленные лимитные заявки на покупку и продажу вокруг текущей цены. Перекос в одну сторону и крупные «стены» могут притягивать или сдерживать цену.', b));
  }
  const tk = o.ticks;
  if (tk && on('tk.stats')) out.push(sec('Тики котировок', '#38bdf8', 'Последние изменения цены. У форекса это не объём сделок: считается только число движений вверх и вниз.',
    ul([`${tk.n} тиков за ${Math.round(tk.spanSec)} с (${tk.perSec ? tk.perSec.toFixed(1) : '?'} в секунду); диапазон ${f(tk.lo)} – ${f(tk.hi)}${tk.rangeAtr != null ? ` (${tk.rangeAtr.toFixed(2)} ATR)` : ''}`, `Изменение цены: ${sgnum(tk.change, f)}; движений вверх ${tk.up}, вниз ${tk.dn}, без изменения ${tk.flat}; перекос ${sgnum(+tk.imbalance.toFixed(2), (v) => v)} (от −1 до +1)`, `Спред: средний ${(+tk.sprAvg.toPrecision(3))}, максимальный ${(+tk.sprMax.toPrecision(3))}, последний ${(+tk.sprLast.toPrecision(3))}`])));

  const C = o.calendar;
  if (C && on('cal') && (C.upcoming.length || C.recent.length || C.holidays.length)) {
    let b = `<p style="margin:0 0 8px;font-size:13px">Страны: ${esc(C.countries.join(', '))}; важность не ниже: ${esc(C.minImportance)}${C.nextHighInMin != null ? `; <b>ближайшее важное событие через ${C.nextHighInMin} мин</b>` : ''}</p>`;
    if (C.upcoming.length) b += '<p style="margin:8px 0 4px;color:#8b95a7">Предстоящие:</p>' + tbl(['Через, мин', 'Страна', 'Важность', 'Событие', 'Прогноз', 'Предыдущее', 'Прошлые выходы (факт/прогноз)'], C.upcoming.map((e) => [e.min, e.ctry, IMP[e.imp] || e.imp, e.name, e.forecast || '—', e.previous || '—', (e.hist || []).map((h) => `${h.a}/${h.f}`).join(', ')]));
    if (C.recent.length) b += '<p style="margin:12px 0 4px;color:#8b95a7">Опубликованные за последние 48 часов:</p>' + tbl(['Назад, мин', 'Страна', 'Важность', 'Событие', 'Факт', 'Прогноз', 'Предыдущее', 'Отклонение'], C.recent.map((e) => [-e.min, e.ctry, IMP[e.imp] || e.imp, e.name, e.actual, e.forecast || '—', e.previous || '—', e.surprise || '—']));
    if (C.holidays.length) b += '<p style="margin:12px 0 4px;color:#8b95a7">Праздники (рынок может быть закрыт):</p>' + ul(C.holidays.map((e) => `через ${e.min} мин: ${e.ctry}, ${e.name}`));
    out.push(sec('Экономический календарь', '#ef4444', 'Новости, которые двигают актив. Отклонение факта от прогноза показывает, насколько данные удивили рынок.', b));
  }

  if (bars > 0 && on('bars')) {
    const m = Math.min(bars, candles.length), cs = candles.slice(-m), H = r.indicators?.history?.time.length === m ? r.indicators.history : null, ex = H ? Object.keys(H).filter((k) => k !== 'time' && k !== 'close') : [];
    const OF = r.orderflow ? [['delta', r.orderflow.series.delta], ['cvd', r.orderflow.series.cvd], ['buyR', r.orderflow.series.buyRatio]].filter(([k]) => on('col.' + k)).map(([k, a]) => [k, a.slice(-m)]) : [];
    out.push(sec('История свечей', '#94a3b8', `Последние ${m} свечей от старых к новым (время UTC) и значения индикаторов на каждой из них.`,
      tbl(['Время', 'Open', 'High', 'Low', 'Close', 'Объём', ...ex, ...OF.map((x) => x[0])], cs.map((c, i) => [isoMin(c.time), f(c.open), f(c.high), f(c.low), f(c.close), c.volume == null ? '' : q(c.volume), ...ex.map((k) => (H[k][i] == null ? '' : q(H[k][i]))), ...OF.map(([, a]) => (Number.isFinite(a[i]) ? q(a[i]) : ''))]))));
  }
  return `<div style="font:14px system-ui,sans-serif;color:#d8dde6">${out.join('')}</div>`;
}

/* ==================================================================== */
/*  CHART: PNG-скриншот графика с выбранными индикаторами (canvas)       */
/*  TPL.renderChart(candles, analyzeLevelsResult, opts) -> canvas        */
/*  TPL.chartToBlob(canvas) -> Promise<Blob(PNG)>                        */
/* ==================================================================== */
const CH = (() => {
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "DejaVu Sans", sans-serif';
  const PRESETS = {
    desktop: { w: 2560, h: 1440, fs: 24, bars: 200, label: 'ПК 2560×1440', maxPanels: 5 },
    mobile: { w: 1440, h: 2560, fs: 34, bars: 90, label: 'Мобильный 1440×2560', maxPanels: 7 },
  };
  const THEMES = {
    dark: { bg: '#0b0e14', panel: '#0e121a', grid: 'rgba(148,163,184,.10)', frame: 'rgba(148,163,184,.28)', text: '#98a2b3', strong: '#e5e9f0', up: '#26a69a', down: '#ef5350', tagFg: '#0b0e14', box: 'rgba(11,14,20,.78)' },
    light: { bg: '#ffffff', panel: '#ffffff', grid: 'rgba(15,23,42,.08)', frame: 'rgba(15,23,42,.28)', text: '#475569', strong: '#0f172a', up: '#089981', down: '#f23645', tagFg: '#ffffff', box: 'rgba(255,255,255,.82)' },
  };
  const PAL = ['#f59e0b', '#60a5fa', '#c084fc', '#34d399', '#f472b6', '#22d3ee', '#a3e635', '#fb7185', '#818cf8', '#fbbf24'];
  /** extra indicators that live on the price scale; every other extra indicator gets its own panel */
  const OVERLAY_EXTRA = new Set(['sma', 'emaLong', 'wma', 'vwma', 'hma', 'kama', 'psar', 'keltner', 'chandelier']);
  const HIST = { ppo: ['hist'], ao: ['ao'], squeeze: ['momentum'], bbp: ['bull', 'bear'] };
  const REFS = { rsi: [30, 70], stochrsi: [20, 80], mfi: [20, 80], uo: [30, 70], cci: [-100, 100], wpr: [-80, -20], cmo: [-50, 50], chop: [38.2, 61.8], zscore: [-2, 2], aroon: [0], volOsc: [0] };
  const FIXED = { stochrsi: [0, 100], mfi: [0, 100], uo: [0, 100], wpr: [-100, 0], chop: [0, 100] };
  const LVL_COLOR = {
    'lvl.round': '#64748b', 'lvl.fib': '#eab308', 'lvl.pivot': '#a78bfa', 'lvl.period': '#38bdf8', 'lvl.session': '#fb923c', 'lvl.trendline': '#22c55e',
    'lvl.sr': '#94a3b8', 'lvl.supplyDemand': '#f43f5e', 'lvl.fvg': '#06b6d4', 'lvl.orderBlock': '#10b981', 'lvl.range': '#a1a1aa', 'lvl.volume': '#f59e0b',
  };
  const CHART_KEYS = TOGGLES.filter((g) => g.chart).flatMap((g) => g.items.map((i) => i[0]));
  const LABEL_OF = Object.fromEntries(TOGGLES.flatMap((g) => g.items));

  const fin = Number.isFinite;
  const pad2 = (n) => String(n).padStart(2, '0');
  const MON = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const hexA = (hex, a) => { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  function niceStep(range, target) {
    const raw = range / Math.max(1, target), p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  }
  function niceTicks(lo, hi, target) {
    const st = niceStep(hi - lo, target), vals = [];
    for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + st * 1e-9; v += st) vals.push(+v.toPrecision(12));
    return { step: st, vals };
  }
  const decFor = (step) => Math.max(0, Math.min(10, Math.ceil(-Math.log10(step) - 1e-9)));
  function fmtNum(v) {
    if (!fin(v)) return '–';
    const a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (a >= 1e4) return (v / 1e3).toFixed(1) + 'K';
    if (a >= 100) return v.toFixed(1);
    if (a >= 1) return v.toFixed(2);
    if (a === 0) return '0';
    return v.toPrecision(3);
  }

  function renderChart(candles, r, o = {}) {
    assertCandles(candles, 2);
    const pre = PRESETS[o.format || 'desktop'] || PRESETS.desktop;
    const W = o.width || pre.w, H = o.height || pre.h, fs = o.fontSize || pre.fs, u = fs / 24;
    const th = THEMES[o.theme] || THEMES.dark;
    const canvas = o.canvas || (typeof document !== 'undefined' ? document.createElement('canvas') : new OffscreenCanvas(W, H));
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const n = candles.length;
    const bars = Math.max(10, Math.min(o.bars || pre.bars, n)), start = n - bars;
    const tz = o.tzOffsetHours || 0;
    const show = new Set(o.show || []);
    const p = { ema: 20, rsi: 14, adx: 14, bb: 20, bbMult: 2, don: 20, stoch: [14, 3, 3], macd: [12, 26, 9], st: [10, 3], ...(o.params || {}) };
    const C = candles.map((c) => c.close), Hh = candles.map((c) => c.high), Ll = candles.map((c) => c.low), V = candles.map((c) => c.volume || 0);
    const hasVol = V.some((x) => x > 0);
    const price = C[n - 1];
    const digits = o.digits ?? autoDigits(price);
    const notes = [];
    let ci = 0;
    const nextColor = () => PAL[ci++ % PAL.length];

    /* ---------------- 1. data: overlays (price scale) and panels ---------------- */
    const overlays = [], panels = [], extPanels = [];
    let ichi = null;
    if (show.has('ind.ema')) overlays.push({ kind: 'line', label: `EMA(${p.ema})`, color: '#f59e0b', vals: ema(C, p.ema) });
    if (show.has('ind.supertrend')) { const S = supertrend(candles, ...p.st); overlays.push({ kind: 'st', label: `Supertrend(${p.st.join(',')})`, color: th.up, line: S.line, dir: S.dir }); }
    if (show.has('ind.bb')) { const B = bollinger(C, p.bb, p.bbMult); overlays.push({ kind: 'band', label: `Bollinger(${p.bb},${p.bbMult})`, color: '#60a5fa', upper: B.upper, lower: B.lower, mid: B.mid }); }
    if (show.has('ind.don')) { const D = donchian(Hh, Ll, p.don); overlays.push({ kind: 'band', label: `Donchian(${p.don})`, color: '#c084fc', upper: D.upper, lower: D.lower, mid: D.mid }); }
    if (show.has('ind.vwap')) {
      if (hasVol) overlays.push({ kind: 'line', label: 'VWAP', color: '#22d3ee', vals: vwap(candles, tz), breaks: new Set(groupByPeriod(candles, 'day', tz).map((g) => g.startIndex)) });
      else notes.push('VWAP: нет объёма');
    }
    if (show.has('ind.ichimoku')) {
      const sh = 26, T = nn(n + sh), K = nn(n + sh), A = nn(n + sh), B = nn(n + sh);
      const mid = (i, per) => { if (i - per + 1 < 0) return NaN; let hh = -Infinity, lw = Infinity; for (let j = i - per + 1; j <= i; j++) { hh = Math.max(hh, Hh[j]); lw = Math.min(lw, Ll[j]); } return (hh + lw) / 2; };
      for (let i = 0; i < n; i++) {
        T[i] = mid(i, 9); K[i] = mid(i, 26);
        const a = (T[i] + K[i]) / 2, b = mid(i, 52);
        if (fin(a)) A[i + sh] = a;
        if (fin(b)) B[i + sh] = b;
      }
      ichi = { T, K, A, B, sh };
      overlays.push({ kind: 'ichimoku', label: 'Ichimoku(9,26,52)', color: '#38bdf8', ...ichi });
    }
    if (show.has('ind.reg') && r?.regression) overlays.push({ kind: 'reg', label: 'Регрессия', color: '#e879f9', reg: r.regression });

    const xo = { o: candles.map((c) => c.open), h: Hh, l: Ll, c: C, v: V, cs: candles };
    for (const d of REG) {
      const key = 'ext.' + d.name;
      if (!show.has(key)) continue;
      if (d.vol && !hasVol) { notes.push(`${d.label}: нет объёма`); continue; }
      let s;
      try { s = d.fn(xo); } catch { notes.push(`${d.label}: не посчитался`); continue; }
      if (OVERLAY_EXTRA.has(d.name)) {
        if (d.name === 'keltner') overlays.push({ kind: 'band', label: d.label, color: nextColor(), upper: s.upper, lower: s.lower, mid: s.mid });
        else if (d.name === 'psar') overlays.push({ kind: 'dots', label: d.label, color: '#fbbf24', vals: s.v });
        else for (const k of Object.keys(s)) overlays.push({ kind: 'line', label: k === 'v' ? d.label : `${d.label} ${k}`, color: nextColor(), vals: s[k] });
      } else {
        extPanels.push({
          key, title: d.label, refs: REFS[d.name] || [], fixed: FIXED[d.name] || null,
          series: Object.keys(s).map((k) => ({
            label: k === 'v' ? '' : k, vals: s[k], color: nextColor(),
            type: HIST[d.name]?.includes(k) ? 'hist' : k === 'squeezeOn' ? 'flag' : 'line',
          })),
        });
      }
    }
    if (show.has('ind.rsi')) panels.push({ key: 'ind.rsi', title: `RSI(${p.rsi})`, refs: [30, 70], band: [30, 70], fixed: [0, 100], series: [{ label: '', vals: rsi(C, p.rsi), color: '#c084fc', type: 'line' }] });
    if (show.has('ind.macd')) {
      const M = macd(C, ...p.macd);
      panels.push({ key: 'ind.macd', title: `MACD(${p.macd.join(',')})`, refs: [0], series: [
        { label: 'hist', vals: M.hist, color: '#64748b', type: 'hist', signed: true },
        { label: 'macd', vals: M.macd, color: '#60a5fa', type: 'line' }, { label: 'signal', vals: M.signal, color: '#f59e0b', type: 'line' }] });
    }
    if (show.has('ind.stoch')) {
      const S = stochastic(Hh, Ll, C, ...p.stoch);
      panels.push({ key: 'ind.stoch', title: `Stochastic(${p.stoch.join(',')})`, refs: [20, 80], band: [20, 80], fixed: [0, 100], series: [
        { label: '%K', vals: S.k, color: '#60a5fa', type: 'line' }, { label: '%D', vals: S.d, color: '#f59e0b', type: 'line' }] });
    }
    if (show.has('ind.adx')) {
      const X = adx(Hh, Ll, C, p.adx);
      panels.push({ key: 'ind.adx', title: `ADX(${p.adx})`, refs: [25], series: [
        { label: 'ADX', vals: X.adx, color: '#f59e0b', type: 'line' }, { label: '+DI', vals: X.plusDI, color: th.up, type: 'line' }, { label: '-DI', vals: X.minusDI, color: th.down, type: 'line' }] });
    }
    if (show.has('ind.obv')) {
      if (hasVol) panels.push({ key: 'ind.obv', title: 'OBV', refs: [], series: [{ label: '', vals: obv(C, V), color: '#22d3ee', type: 'line' }] });
      else notes.push('OBV: нет объёма');
    }
    if (show.has('ind.rvol')) {
      if (hasVol) panels.push({ key: 'ind.rvol', title: 'Отн. объём(20)', refs: [1], series: [{ label: '', vals: rvol(V, 20), color: '#60a5fa', type: 'hist', rvol: true }] });
      else notes.push('Отн. объём: нет объёма');
    }
    panels.push(...extPanels); // core panels first, then the extra ones
    const maxPanels = o.maxPanels ?? pre.maxPanels;
    if (panels.length > maxPanels) { notes.push(`не поместились панели: ${panels.slice(maxPanels).map((q) => q.title).join(', ')}`); panels.length = maxPanels; }

    /* legend chips: overlays + enabled level groups */
    const legend = overlays.map((q) => ({ label: q.label, color: q.color }));
    const lvlOn = (k) => show.has(k) && r;
    for (const k of Object.keys(LVL_COLOR)) if (lvlOn(k)) legend.push({ label: LABEL_OF[k], color: LVL_COLOR[k] });
    const anyLevelLabels = ['lvl.round', 'lvl.fib', 'lvl.pivot', 'lvl.period', 'lvl.session', 'lvl.trendline', 'lvl.volume'].some(lvlOn);

    /* ---------------- 2. layout ---------------- */
    const mg = Math.round(28 * u);
    ctx.font = `${fs}px ${FONT}`;
    const axisW = Math.round(ctx.measureText('0'.repeat(Math.max(7, String(Math.round(price)).length + (digits > 0 ? digits + 1 : 0)))).width + 26 * u);
    const plotL = mg, plotR = W - mg - axisW, plotW = plotR - plotL;
    let y = mg;
    const titleY = y + fs * 1.1; y += fs * 1.55;
    const ohlcY = y + fs * 0.95; y += fs * 1.5;
    ctx.font = `${fs * 0.85}px ${FONT}`;
    const legRows = []; let row = [], rw = 0;
    for (const it of legend) {
      const w = ctx.measureText(it.label).width + 30 * u;
      if (rw + w > W - 2 * mg && row.length) { legRows.push(row); row = []; rw = 0; }
      row.push({ ...it, w }); rw += w;
    }
    if (row.length) legRows.push(row);
    const legY = y; y += legRows.length * fs * 1.35 + (legRows.length ? 6 * u : 0);
    const plotT = y;
    const axisH = Math.round(fs * 2.1), footH = notes.length ? Math.round(fs * 1.5) : 0;
    const plotBottomAll = H - mg - axisH - footH;
    const gap = Math.round(10 * u), np = panels.length;
    const availH = plotBottomAll - plotT - gap * np;
    const mainFrac = np === 0 ? 1 : Math.max(0.45, 1 - np * 0.2);
    const mainH = Math.round(availH * mainFrac), panH = np ? Math.floor((availH - mainH) / np) : 0;
    const mainT = plotT, mainB = plotT + mainH;

    /* horizontal slots: bars + right padding (for level labels / ichimoku cloud) */
    ctx.font = `${fs * 0.82}px ${FONT}`;
    const probeW = ctx.measureText('Fib 0.618 ' + (price || 1).toFixed(digits)).width + 24 * u;
    let padPx = anyLevelLabels ? Math.min(plotW * 0.3, probeW) : plotW * 0.04;
    if (ichi) padPx = Math.max(padPx, (ichi.sh + 1) * plotW / (bars + ichi.sh + 1));
    const slotW = (plotW - padPx) / bars;
    const X = (i) => plotL + (i - start + 0.5) * slotW;

    /* ---------------- 3. main price scale ---------------- */
    let lo = Infinity, hi = -Infinity;
    for (let i = start; i < n; i++) { if (Ll[i] < lo) lo = Ll[i]; if (Hh[i] > hi) hi = Hh[i]; }
    const R0 = hi - lo || Math.abs(hi) * 0.01 || 1;
    let lo2 = lo, hi2 = hi;
    const near = (v) => fin(v) && v >= lo - 0.5 * R0 && v <= hi + 0.5 * R0;
    const eat = (arr) => { if (!arr) return; for (let i = start; i < Math.min(arr.length, n); i++) { const v = arr[i]; if (near(v)) { if (v < lo2) lo2 = v; if (v > hi2) hi2 = v; } } };
    for (const q of overlays) { if (q.kind === 'line' || q.kind === 'dots') eat(q.vals); else if (q.kind === 'st') eat(q.line); else if (q.kind === 'band') { eat(q.upper); eat(q.lower); } }
    const pad = (hi2 - lo2) * 0.07 || 1;
    hi2 += pad; lo2 -= pad + (o.volume && hasVol ? (hi2 - lo2) * 0.12 : 0);
    const mainPlotH = mainB - mainT;
    const Y = (v) => mainT + ((hi2 - v) / (hi2 - lo2)) * mainPlotH;

    /* ---------------- 4. drawing helpers ---------------- */
    const line = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
    const txt = (s, x, yy, color, font, align = 'left', base = 'alphabetic') => { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(s, x, yy); };
    const path = (vals, yf, breaks) => {
      ctx.beginPath(); let pen = false;
      for (let i = start; i < Math.min(vals.length, n); i++) {
        const v = vals[i];
        if (!fin(v)) { pen = false; continue; }
        if (!pen || (breaks && breaks.has(i))) { ctx.moveTo(X(i), yf(v)); pen = true; } else ctx.lineTo(X(i), yf(v));
      }
      ctx.stroke();
    };
    const clipRect = (t, b) => { ctx.save(); ctx.beginPath(); ctx.rect(plotL, t, plotW + 1, b - t); ctx.clip(); };
    const tag = (yy, text, bg, fg) => {
      const h = fs * 1.25;
      ctx.fillStyle = bg; ctx.fillRect(plotR + 2, yy - h / 2, axisW - 4, h);
      txt(text, plotR + 2 + (axisW - 4) / 2, yy, fg, `600 ${fs * 0.88}px ${FONT}`, 'center', 'middle');
    };

    /* ---------------- 5. background, header, legend ---------------- */
    ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
    const last = candles[n - 1], prev = candles[n - 2];
    const up = last.close >= last.open;
    txt(`${o.symbol || ''}`, mg, titleY, th.strong, `700 ${fs * 1.3}px ${FONT}`);
    const symW = ctx.measureText(o.symbol || '').width;
    txt(`  ·  ${o.timeframe || ''}${o.source ? '  ·  ' + o.source : ''}`, mg + symW, titleY, th.text, `${fs * 1.05}px ${FONT}`);
    if (fin(last.time)) {
      const d = new Date(toMs(last.time) + tz * 3600000);
      txt(`${pad2(d.getUTCDate())}.${pad2(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())} UTC${tz >= 0 ? '+' : ''}${tz}`, W - mg, titleY, th.text, `${fs}px ${FONT}`, 'right');
    }
    {
      const chg = prev ? ((last.close - prev.close) / prev.close) * 100 : 0, f = (v) => v.toFixed(digits);
      let xx = mg;
      const seg = (label, val, color) => {
        txt(label, xx, ohlcY, th.text, `${fs * 0.95}px ${FONT}`); xx += ctx.measureText(label).width + 5 * u;
        txt(val, xx, ohlcY, color, `600 ${fs * 0.95}px ${FONT}`); xx += ctx.measureText(val).width + 20 * u;
      };
      const cc = up ? th.up : th.down;
      seg('O', f(last.open), cc); seg('H', f(last.high), cc); seg('L', f(last.low), cc); seg('C', f(last.close), cc);
      seg('', `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`, chg >= 0 ? th.up : th.down);
      seg('ATR', f(lastAtr(candles)), th.strong);
    }
    legRows.forEach((rw2, ri) => {
      let xx = mg; const yy = legY + ri * fs * 1.35 + fs * 0.9;
      for (const it of rw2) {
        ctx.fillStyle = it.color; ctx.fillRect(xx, yy - fs * 0.55, 18 * u, 6 * u);
        txt(it.label, xx + 24 * u, yy, th.text, `${fs * 0.85}px ${FONT}`);
        xx += it.w;
      }
    });

    /* ---------------- 6. time axis helpers ---------------- */
    const step = (() => { const d = []; for (let i = Math.max(1, n - 60); i < n; i++) if (fin(candles[i].time) && fin(candles[i - 1].time)) d.push(toMs(candles[i].time) - toMs(candles[i - 1].time)); d.sort((a, b) => a - b); return d.length ? d[d.length >> 1] : 3600000; })();
    const intraday = step < DAY;
    const dt = (i) => new Date(toMs(candles[i].time) + tz * 3600000);
    const dayKey = (i) => Math.floor((toMs(candles[i].time) + tz * 3600000) / DAY);
    const everyK = Math.max(1, Math.ceil((fs * 6.2) / slotW));
    const tIdx = []; for (let i = start; i < n; i += everyK) tIdx.push(i);
    const vgrid = (t, b) => {
      ctx.strokeStyle = th.grid; ctx.lineWidth = Math.max(1, u);
      for (const i of tIdx) line(Math.round(X(i)) + 0.5, t, Math.round(X(i)) + 0.5, b);
      if (intraday) { ctx.strokeStyle = th.frame; ctx.setLineDash([4 * u, 6 * u]); for (let i = start + 1; i < n; i++) if (dayKey(i) !== dayKey(i - 1)) line(Math.round(X(i) - slotW / 2) + 0.5, t, Math.round(X(i) - slotW / 2) + 0.5, b); ctx.setLineDash([]); }
    };
    const frame = (t, b) => { ctx.strokeStyle = th.frame; ctx.lineWidth = Math.max(1, u); ctx.strokeRect(plotL + 0.5, t + 0.5, plotW, b - t); };

    /* ---------------- 7. MAIN PANEL ---------------- */
    ctx.fillStyle = th.panel; ctx.fillRect(plotL, mainT, plotW, mainH);
    const tk = niceTicks(lo2, hi2, mainPlotH / (fs * 3.6)), axisDec = Math.min(digits, decFor(tk.step));
    ctx.strokeStyle = th.grid; ctx.lineWidth = Math.max(1, u);
    for (const v of tk.vals) {
      const yy = Math.round(Y(v)) + 0.5; line(plotL, yy, plotR, yy);
      if (Math.abs(Y(v) - Y(price)) > fs * 0.8 && Y(v) > mainT + fs * 0.45 && Y(v) < mainB - fs * 0.45) txt(v.toFixed(axisDec), plotR + 10 * u, Y(v), th.text, `${fs * 0.9}px ${FONT}`, 'left', 'middle');
    }
    vgrid(mainT, mainB);

    clipRect(mainT, mainB);
    const slotsEnd = plotR;
    const rightLabels = [];
    let hidden = 0;
    const inView = (v) => v >= lo2 && v <= hi2;
    const hline = (v, color, label, { dash = null, w = 1.5 * u, from = null, alpha = 1 } = {}) => {
      if (!fin(v)) return;
      if (!inView(v)) { hidden++; return; }
      const yy = Y(v), x0 = from == null ? plotL : Math.max(plotL, X(from));
      ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash || []); line(x0, yy, slotsEnd, yy); ctx.restore();
      if (label) rightLabels.push({ y: yy, name: label, val: v.toFixed(digits), color });
    };
    const zone = (zl, zh, fromIdx, toIdx, color, label, { fillA = 0.13, dash = null } = {}) => {
      if (zh < lo2 || zl > hi2) { hidden++; return; }
      const yt = Y(Math.min(zh, hi2)), yb = Y(Math.max(zl, lo2));
      const x0 = Math.max(plotL, X(fromIdx) - slotW / 2), x1 = toIdx == null ? slotsEnd : Math.min(slotsEnd, X(toIdx) + slotW / 2);
      if (x1 <= x0) return;
      ctx.fillStyle = hexA(color, fillA); ctx.fillRect(x0, yt, x1 - x0, yb - yt);
      ctx.strokeStyle = hexA(color, 0.7); ctx.lineWidth = Math.max(1, 1.2 * u); ctx.setLineDash(dash || []); ctx.strokeRect(x0 + 0.5, yt + 0.5, x1 - x0, yb - yt); ctx.setLineDash([]);
      if (label) { const tall = yb - yt > fs * 1.15; txt(label, Math.max(x0, plotL) + 6 * u, tall ? yt + fs * 0.95 : yt - 4 * u, color, `600 ${fs * 0.78}px ${FONT}`); }
    };

    /* levels & zones (under candles) */
    if (r) {
      const endIdx = null;
      if (lvlOn('lvl.sr')) r.zones?.sr?.forEach((z) => zone(z.low, z.high, Math.max(start, z.firstIndex), endIdx, z.kind === 'support' ? '#22c55e' : z.kind === 'resistance' ? '#ef4444' : '#94a3b8', `S/R ${z.kind === 'support' ? 'поддержка' : z.kind === 'resistance' ? 'сопротивление' : ''} ×${z.touches}`.replace('  ', ' ')));
      if (lvlOn('lvl.supplyDemand')) r.zones?.supplyDemand?.forEach((z) => zone(z.low, z.high, Math.max(start, z.baseStart), endIdx, z.type === 'demand' ? '#22c55e' : '#ef4444', `${z.type === 'demand' ? 'Спрос' : 'Предложение'} (${z.status})`, { dash: z.status === 'tested' ? [8 * u, 5 * u] : null }));
      if (lvlOn('lvl.fvg')) r.zones?.fvg?.forEach((z) => zone(z.low, z.high, Math.max(start, z.index - 2), endIdx, z.type === 'bullish' ? '#06b6d4' : '#f472b6', `FVG ${z.type === 'bullish' ? '▲' : '▼'}`, { fillA: 0.1 }));
      if (lvlOn('lvl.orderBlock')) r.zones?.orderBlocks?.forEach((z) => zone(z.low, z.high, Math.max(start, z.index), endIdx, z.type === 'bullish' ? '#10b981' : '#f43f5e', `OB ${z.type === 'bullish' ? '▲' : '▼'}`, { dash: [8 * u, 5 * u] }));
      if (lvlOn('lvl.range')) r.zones?.ranges?.forEach((z) => { if (z.endIndex >= start) zone(z.low, z.high, Math.max(start, z.startIndex), z.active ? endIdx : z.endIndex, '#a1a1aa', `Диапазон ${z.bars} св.`, { fillA: 0.1 }); });
      if (lvlOn('lvl.volume') && r.volumeProfile) {
        const vp = r.volumeProfile, mx = Math.max(...vp.bins.map((b) => b.volume)) || 1, maxW = plotW * 0.14;
        for (const b of vp.bins) {
          if (b.high < lo2 || b.low > hi2) continue;
          const inVA = b.low >= vp.val - 1e-9 && b.high <= vp.vah + 1e-9, yt = Y(Math.min(b.high, hi2)), yb = Y(Math.max(b.low, lo2)), w = (b.volume / mx) * maxW;
          ctx.fillStyle = inVA ? 'rgba(245,158,11,.30)' : 'rgba(148,163,184,.20)'; ctx.fillRect(slotsEnd - w, yt + 0.5, w, Math.max(1, yb - yt - 1));
        }
      }
    }

    /* volume bars */
    if (o.volume && hasVol) {
      let mv = 0; for (let i = start; i < n; i++) mv = Math.max(mv, V[i]);
      const vh = mainPlotH * 0.12;
      for (let i = start; i < n; i++) { const c = candles[i], h = mv ? (V[i] / mv) * vh : 0; ctx.fillStyle = hexA(c.close >= c.open ? th.up : th.down, 0.32); ctx.fillRect(X(i) - slotW * 0.35, mainB - h, slotW * 0.7, h); }
    }

    /* bands / cloud / regression (under candles) */
    for (const q of overlays) {
      if (q.kind === 'band') {
        ctx.fillStyle = hexA(q.color, 0.08); ctx.beginPath(); let started = false, lastI = -1;
        for (let i = start; i < n; i++) if (fin(q.upper[i]) && fin(q.lower[i])) { const xx = X(i), yy = Y(q.upper[i]); if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy); lastI = i; }
        for (let i = lastI; i >= start; i--) if (fin(q.upper[i]) && fin(q.lower[i])) ctx.lineTo(X(i), Y(q.lower[i]));
        ctx.closePath(); ctx.fill();
        ctx.lineWidth = 1.6 * u; ctx.strokeStyle = q.color; ctx.setLineDash([]); path(q.upper, Y); path(q.lower, Y);
        ctx.setLineDash([6 * u, 5 * u]); ctx.globalAlpha = 0.8; path(q.mid, Y); ctx.setLineDash([]); ctx.globalAlpha = 1;
      } else if (q.kind === 'ichimoku') {
        for (let i = start; i < n + q.sh - 1; i++) {
          const a0 = q.A[i], b0 = q.B[i], a1 = q.A[i + 1], b1 = q.B[i + 1];
          if (![a0, b0, a1, b1].every(fin)) continue;
          ctx.fillStyle = hexA(a0 >= b0 ? '#22c55e' : '#ef4444', 0.14);
          ctx.beginPath(); ctx.moveTo(X(i), Y(a0)); ctx.lineTo(X(i + 1), Y(a1)); ctx.lineTo(X(i + 1), Y(b1)); ctx.lineTo(X(i), Y(b0)); ctx.closePath(); ctx.fill();
        }
        ctx.lineWidth = 1.2 * u; ctx.setLineDash([]);
        ctx.strokeStyle = hexA('#22c55e', 0.8); path(q.A, Y); ctx.strokeStyle = hexA('#ef4444', 0.8); path(q.B, Y);
      } else if (q.kind === 'reg') {
        const g = q.reg, w = g.upper - g.mid, f = (i, k) => g.intercept + g.slope * (i - g.startIndex) + k * w;
        ctx.strokeStyle = q.color; ctx.lineWidth = 1.6 * u;
        for (const k of [-1, 0, 1]) { ctx.setLineDash(k === 0 ? [6 * u, 5 * u] : []); const i0 = Math.max(start, g.startIndex); line(X(i0), Y(f(i0, k)), X(n - 1), Y(f(n - 1, k))); }
        ctx.setLineDash([]);
      }
    }

    /* candles */
    const bw = Math.max(1, slotW * 0.7);
    for (let i = start; i < n; i++) {
      const c = candles[i], col = c.close >= c.open ? th.up : th.down, xx = X(i);
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1, Math.min(bw * 0.15, 2.2 * u));
      line(Math.round(xx) + 0.5, Y(c.high), Math.round(xx) + 0.5, Y(c.low));
      const yo = Y(c.open), yc = Y(c.close);
      ctx.fillRect(xx - bw / 2, Math.min(yo, yc), bw, Math.max(1, Math.abs(yc - yo)));
    }

    /* lines over candles */
    ctx.lineJoin = 'round';
    for (const q of overlays) {
      if (q.kind === 'line') { ctx.strokeStyle = q.color; ctx.lineWidth = 2 * u; ctx.setLineDash([]); path(q.vals, Y, q.breaks); }
      else if (q.kind === 'st') {
        ctx.lineWidth = 2.2 * u; ctx.setLineDash([]);
        let s0 = start;
        for (let i = start + 1; i <= n; i++) if (i === n || q.dir[i] !== q.dir[s0]) {
          ctx.strokeStyle = q.dir[s0] === 1 ? th.up : th.down; ctx.beginPath(); let pen = false;
          for (let j = s0; j < i; j++) { if (!fin(q.line[j])) continue; if (!pen) { ctx.moveTo(X(j), Y(q.line[j])); pen = true; } else ctx.lineTo(X(j), Y(q.line[j])); }
          ctx.stroke(); s0 = i;
        }
      } else if (q.kind === 'ichimoku') {
        ctx.lineWidth = 2 * u; ctx.setLineDash([]); ctx.strokeStyle = '#60a5fa'; path(q.T, Y); ctx.strokeStyle = '#f472b6'; path(q.K, Y);
      } else if (q.kind === 'dots') {
        ctx.fillStyle = q.color;
        for (let i = start; i < n; i++) if (fin(q.vals[i])) { ctx.beginPath(); ctx.arc(X(i), Y(q.vals[i]), Math.max(2, 2.6 * u), 0, 7); ctx.fill(); }
      }
    }

    /* levels as lines (over candles) */
    if (r) {
      if (lvlOn('lvl.round')) r.round?.forEach((l) => hline(l.price, LVL_COLOR['lvl.round'], l.major ? 'R' : null, { dash: [3 * u, 7 * u], w: (l.major ? 1.8 : 1.1) * u, alpha: l.major ? 0.95 : 0.6 }));
      if (lvlOn('lvl.fib') && r.fibonacci) {
        const f = r.fibonacci, a = f.a, b = f.b;
        if (inView(a.price) || inView(b.price)) { ctx.save(); ctx.strokeStyle = hexA('#eab308', 0.55); ctx.lineWidth = 1.6 * u; ctx.setLineDash([2 * u, 6 * u]); if (a.index >= start || b.index >= start) line(X(Math.max(start, a.index)), Y(a.price), X(Math.max(start, b.index)), Y(b.price)); ctx.restore(); }
        f.retracements.forEach((l) => hline(l.price, '#eab308', `Fib ${l.ratio}`, { dash: l.ratio === 0 || l.ratio === 1 ? null : [10 * u, 6 * u], w: 1.4 * u, from: Math.max(start, Math.min(a.index, b.index)), alpha: 0.9 }));
        f.projections.forEach((l) => hline(l.price, '#eab308', `Fib ${l.ratio}↗`, { dash: [3 * u, 6 * u], w: 1.2 * u, from: Math.max(start, b.index), alpha: 0.6 }));
      }
      if (lvlOn('lvl.pivot')) for (const [k, tg, dash] of [['day', 'D', null], ['week', 'W', [12 * u, 6 * u]]]) {
        const pv = r.pivots?.[k]; if (!pv) continue;
        for (const [name, v] of Object.entries(pv.levels)) hline(v, name[0] === 'R' ? '#f87171' : name[0] === 'S' ? '#4ade80' : '#a78bfa', `${tg}·${name}`, { dash, w: 1.3 * u, alpha: 0.75 });
      }
      if (lvlOn('lvl.period') && r.periods) for (const [k, tg, col] of [['day', 'D', '#38bdf8'], ['week', 'W', '#2dd4bf'], ['month', 'M', '#e879f9']]) r.periods[k]?.list.forEach((l) => hline(l.price, col, l.name, { dash: l.name[0] === 'P' ? null : [8 * u, 5 * u], w: 1.3 * u, alpha: 0.8 }));
      if (lvlOn('lvl.session') && r.sessions) r.sessions.forEach((l) => { const base = l.name.replace(/^p/, '').replace(/[HL]$/, ''); const prevDay = /^p[A-Z]/.test(l.name); hline(l.price, { Asia: '#f59e0b', London: '#3b82f6', NewYork: '#ef4444' }[base] || '#fb923c', l.name, { dash: prevDay ? [4 * u, 6 * u] : [10 * u, 5 * u], w: 1.3 * u, alpha: prevDay ? 0.55 : 0.85 }); });
      if (lvlOn('lvl.trendline') && r.trendlines) {
        const tl = (L, col, w, dash, alpha) => {
          const i0 = Math.max(start, L.p1.index), i1 = n - 1 + Math.round(padPx / slotW * 0.35);
          ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []);
          line(X(i0), Y(valueAt(L, i0)), X(i1), Y(valueAt(L, i1))); ctx.restore();
          if (L.p1.index >= start) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(L.p1.index), Y(L.p1.price), 4 * u, 0, 7); ctx.fill(); }
          if (L.p2.index >= start) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(L.p2.index), Y(L.p2.price), 4 * u, 0, 7); ctx.fill(); }
        };
        for (const L of r.trendlines.support) tl(L, '#22c55e', 2.2 * u, null, 0.95);
        for (const L of r.trendlines.resistance) tl(L, '#ef4444', 2.2 * u, null, 0.95);
        for (const [t, ch] of Object.entries(r.channels || {})) if (ch) { const L = ch.base, par = { ...L, p1: { ...L.p1, price: L.p1.price + ch.offset } }; tl(par, t === 'support' ? '#22c55e' : '#ef4444', 1.4 * u, [8 * u, 6 * u], 0.55); }
      }
      if (lvlOn('lvl.volume') && r.volumeProfile) {
        const vp = r.volumeProfile;
        hline(vp.poc, '#f59e0b', 'POC', { w: 2 * u }); hline(vp.vah, '#fbbf24', 'VAH', { dash: [8 * u, 5 * u], w: 1.3 * u }); hline(vp.val, '#fbbf24', 'VAL', { dash: [8 * u, 5 * u], w: 1.3 * u });
      }
    }

    /* current price line */
    if (inView(price)) { ctx.strokeStyle = up ? th.up : th.down; ctx.lineWidth = Math.max(1, 1.4 * u); ctx.setLineDash([3 * u, 4 * u]); line(plotL, Y(price), plotR, Y(price)); ctx.setLineDash([]); }

    /* right-side labels with simple collision avoidance */
    if (rightLabels.length) {
      /* levels with the same price share one label: "WH/MH 77988.32" */
      const merged = new Map();
      for (const L of rightLabels) { const m = merged.get(L.val); if (m) m.names.push(L.name); else merged.set(L.val, { y: L.y, val: L.val, color: L.color, names: [L.name] }); }
      rightLabels.length = 0;
      for (const m of merged.values()) rightLabels.push({ y: m.y, color: m.color, text: `${m.names.length > 3 ? m.names.slice(0, 3).join('/') + '/+' + (m.names.length - 3) : m.names.join('/')} ${m.val}` });
      const lh = fs * 1.2; rightLabels.sort((a, b) => a.y - b.y);
      const lo_ = mainT + lh / 2, hi_ = mainB - lh / 2;
      let pv = -1e9; for (const L of rightLabels) { L.yy = Math.max(L.y, pv + lh, lo_); pv = L.yy; }
      let nx = 1e9; for (let i = rightLabels.length - 1; i >= 0; i--) { const L = rightLabels[i]; L.yy = Math.max(lo_, Math.min(L.yy, nx - lh, hi_)); nx = L.yy; }
      ctx.font = `600 ${fs * 0.8}px ${FONT}`;
      for (const L of rightLabels) {
        const w = ctx.measureText(L.text).width + 12 * u;
        ctx.fillStyle = th.box; ctx.fillRect(slotsEnd - w - 4 * u, L.yy - lh / 2 + 1, w, lh - 2);
        ctx.fillStyle = L.color; ctx.fillRect(slotsEnd - w - 4 * u, L.yy - lh / 2 + 1, 3 * u, lh - 2);
        txt(L.text, slotsEnd - 8 * u, L.yy, L.color, `600 ${fs * 0.8}px ${FONT}`, 'right', 'middle');
      }
    }
    ctx.restore();
    frame(mainT, mainB);
    if (inView(price)) tag(Y(price), price.toFixed(digits), up ? th.up : th.down, th.tagFg);
    if (hidden) txt(`ещё ${hidden} вне видимого диапазона`, plotL + 8 * u, mainT + fs * 0.9, th.text, `${fs * 0.75}px ${FONT}`);

    /* ---------------- 8. SUB PANELS ---------------- */
    panels.forEach((pn, pi) => {
      const t = mainB + gap + pi * (panH + gap), b = t + panH;
      ctx.fillStyle = th.panel; ctx.fillRect(plotL, t, plotW, panH);
      let plo = Infinity, phi = -Infinity;
      for (const s of pn.series) { if (s.type === 'flag') continue; for (let i = start; i < n; i++) { const v = s.vals[i]; if (fin(v)) { if (v < plo) plo = v; if (v > phi) phi = v; } } }
      if (pn.fixed) { plo = pn.fixed[0]; phi = pn.fixed[1]; }
      else {
        if (!fin(plo)) { plo = 0; phi = 1; }
        if (pn.series.some((s) => s.type === 'hist')) { plo = Math.min(plo, 0); phi = Math.max(phi, 0); }
        for (const rf of pn.refs) { plo = Math.min(plo, rf); phi = Math.max(phi, rf); }
        const pd = (phi - plo) * 0.08 || 1; plo -= pd; phi += pd;
      }
      if (phi === plo) { phi += 1; plo -= 1; }
      const PY = (v) => t + ((phi - v) / (phi - plo)) * panH;
      const pt = niceTicks(plo, phi, Math.max(2, panH / (fs * 2.6)));
      ctx.strokeStyle = th.grid; ctx.lineWidth = Math.max(1, u);
      for (const v of pt.vals) {
        const yy = Math.round(PY(v)) + 0.5; line(plotL, yy, plotR, yy);
        if (PY(v) > t + fs * 0.45 && PY(v) < b - fs * 0.45) txt(fmtNum(v), plotR + 10 * u, PY(v), th.text, `${fs * 0.85}px ${FONT}`, 'left', 'middle');
      }
      vgrid(t, b);
      clipRect(t, b);
      if (pn.band) { ctx.fillStyle = hexA('#94a3b8', 0.09); ctx.fillRect(plotL, PY(pn.band[1]), plotW, PY(pn.band[0]) - PY(pn.band[1])); }
      ctx.setLineDash([6 * u, 5 * u]); ctx.strokeStyle = hexA('#94a3b8', 0.6); ctx.lineWidth = Math.max(1, 1.2 * u);
      for (const rf of pn.refs) if (rf >= plo && rf <= phi) line(plotL, PY(rf), plotR, PY(rf));
      if (!pn.refs.includes(0) && plo < 0 && phi > 0) line(plotL, PY(0), plotR, PY(0));
      ctx.setLineDash([]);
      const base = PY(Math.max(plo, Math.min(phi, 0)));
      for (const s of pn.series) {
        if (s.type === 'hist') {
          for (let i = start; i < n; i++) {
            const v = s.vals[i]; if (!fin(v)) continue;
            const col = s.rvol ? (v > 1.5 ? '#f59e0b' : '#60a5fa') : v >= 0 ? th.up : th.down;
            ctx.fillStyle = hexA(col, 0.75);
            const yy = PY(v); ctx.fillRect(X(i) - slotW * 0.35, Math.min(yy, base), slotW * 0.7, Math.max(1, Math.abs(base - yy)));
          }
        } else if (s.type === 'flag') {
          ctx.fillStyle = hexA('#f59e0b', 0.9);
          for (let i = start; i < n; i++) if (s.vals[i] === 1) { ctx.beginPath(); ctx.arc(X(i), PY(0), Math.max(2, 2.6 * u), 0, 7); ctx.fill(); }
        } else { ctx.strokeStyle = s.color; ctx.lineWidth = 2 * u; path(s.vals, PY); }
      }
      ctx.restore();
      frame(t, b);
      /* title with last values */
      ctx.font = `700 ${fs * 0.88}px ${FONT}`;
      let xx = plotL + 10 * u; const ty = t + fs * 0.95;
      const tw = ctx.measureText(pn.title).width;
      ctx.fillStyle = th.box; ctx.fillRect(xx - 4 * u, t + 3 * u, tw + 8 * u + pn.series.filter((s) => s.type !== 'flag').reduce((a, s) => a + ctx.measureText(`${s.label} ${fmtNum(s.vals[n - 1])}  `).width, 0) + 12 * u, fs * 1.2);
      txt(pn.title, xx, ty, th.strong, `700 ${fs * 0.88}px ${FONT}`); xx += tw + 12 * u;
      for (const s of pn.series) {
        if (s.type === 'flag') continue;
        const str = `${s.label ? s.label + ' ' : ''}${fmtNum(s.vals[n - 1])}`;
        txt(str, xx, ty, s.type === 'hist' && s.signed ? th.text : s.color, `600 ${fs * 0.88}px ${FONT}`); xx += ctx.measureText(str).width + 14 * u;
      }
    });

    /* ---------------- 9. time axis ---------------- */
    const axisTop = (np ? mainB + gap + np * (panH + gap) - gap : mainB) + 6 * u;
    let prevDay = null, prevMon = null;
    for (const i of tIdx) {
      if (!fin(candles[i].time)) continue;
      const d = dt(i), dk = dayKey(i), key = d.getUTCFullYear() * 12 + d.getUTCMonth();
      let s, bold = false;
      if (intraday) { if (prevDay === null || dk !== prevDay) { s = `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; bold = true; } else s = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`; }
      else if (prevMon === null || key !== prevMon) { s = `${MON[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`; bold = true; } else s = `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
      prevDay = dk; prevMon = key;
      const lf = `${bold ? 600 : 400} ${fs * 0.88}px ${FONT}`; ctx.font = lf;
      const hw = ctx.measureText(s).width / 2, tx = Math.max(mg + hw, Math.min(X(i), W - mg - hw));
      txt(s, tx, axisTop + fs * 0.95, bold ? th.strong : th.text, lf, 'center');
    }
    if (notes.length) txt('⚠ ' + notes.join(' · '), mg, H - mg + fs * 0.1, '#f59e0b', `${fs * 0.85}px ${FONT}`);
    return canvas;
  }

  /** PNG blob of a canvas made by renderChart */
  function chartToBlob(canvas) {
    return new Promise((resolve, reject) => {
      if (canvas.convertToBlob) canvas.convertToBlob({ type: 'image/png' }).then(resolve, reject);
      else canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
    });
  }

  return { renderChart, chartToBlob, CHART_KEYS, PRESETS, THEMES };
})();
const { renderChart, chartToBlob, CHART_KEYS } = CH;
const CHART_PRESETS = CH.PRESETS;

return {renderChart,chartToBlob,CHART_KEYS,CHART_PRESETS,analyzeLevels,flattenLevels,nearestLevels,levelsToText,analyzeIndicators,indicatorsToText,analyzeExtra,extraToText,inferCountries,analyzeCalendar,calendarToText,calendarCompact,analyzeTicks,ticksCompact,analyzeTrades,tradesCompact,analyzeOrderflow,analyzeBook,bookCompact,cmeResolve,CME_MAP,TOGGLES,TOGGLE_KEYS,maskResult,buildPrompt,buildReport,autoDigits};
})();

export default TPL
