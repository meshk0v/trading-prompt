import { assertCandles, atr, lastAtr, isNum, groupByPeriod } from './utils.js';
import { findSwings } from './swings.js';

const NaNs = (n) => new Array(n).fill(NaN);
const lastOf = (a, k = 0) => a[a.length - 1 - k];
const sign = Math.sign;

/* ---------------- series (TA-Lib style: same length, NaN during warm-up) ---------------- */
export function sma(v, p) {
  const out = NaNs(v.length);
  for (let i = p - 1; i < v.length; i++) {
    let s = 0, ok = true;
    for (let k = i - p + 1; k <= i; k++) { if (!isNum(v[k])) { ok = false; break; } s += v[k]; }
    if (ok) out[i] = s / p;
  }
  return out;
}
export function ema(v, p) {
  const out = NaNs(v.length), k = 2 / (p + 1);
  let cnt = 0, sum = 0, started = false;
  for (let i = 0; i < v.length; i++) {
    if (!isNum(v[i])) { if (!started) { cnt = 0; sum = 0; } continue; }
    if (!started) { sum += v[i]; if (++cnt === p) { started = true; out[i] = sum / p; } }
    else out[i] = v[i] * k + out[i - 1] * (1 - k);
  }
  return out;
}
export function rsi(c, p = 14) {
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
export function macd(c, f = 12, s = 26, g = 9) {
  const ef = ema(c, f), es = ema(c, s), line = c.map((_, i) => ef[i] - es[i]), signal = ema(line, g);
  return { macd: line, signal, hist: line.map((x, i) => x - signal[i]) };
}
export function stochastic(h, l, c, k = 14, d = 3, sm = 3) {
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
export function adx(h, l, c, p = 14) {
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
export function supertrend(candles, p = 10, m = 3) {
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
export function bollinger(c, p = 20, m = 2) {
  const n = c.length, mid = sma(c, p), up = NaNs(n), lo = NaNs(n), pb = NaNs(n), bw = NaNs(n);
  for (let i = p - 1; i < n; i++) {
    let s = 0; for (let k = i - p + 1; k <= i; k++) s += (c[k] - mid[i]) ** 2;
    const sd = Math.sqrt(s / p);
    up[i] = mid[i] + m * sd; lo[i] = mid[i] - m * sd;
    pb[i] = up[i] === lo[i] ? 0.5 : (c[i] - lo[i]) / (up[i] - lo[i]); bw[i] = (up[i] - lo[i]) / mid[i];
  }
  return { mid, upper: up, lower: lo, pctB: pb, bandwidth: bw };
}
export function donchian(h, l, p = 20) {
  const n = h.length, up = NaNs(n), lo = NaNs(n);
  for (let i = p - 1; i < n; i++) {
    let hh = -Infinity, ll = Infinity;
    for (let j = i - p + 1; j <= i; j++) { hh = Math.max(hh, h[j]); ll = Math.min(ll, l[j]); }
    up[i] = hh; lo[i] = ll;
  }
  return { upper: up, lower: lo, mid: up.map((x, i) => (x + lo[i]) / 2) };
}
export function obv(c, v) {
  const out = [0];
  for (let i = 1; i < c.length; i++) out.push(out[i - 1] + (c[i] > c[i - 1] ? v[i] : c[i] < c[i - 1] ? -v[i] : 0));
  return out;
}
/** relative volume: volume / mean of previous p bars */
export function rvol(v, p = 20) {
  const out = NaNs(v.length);
  for (let i = p; i < v.length; i++) { let s = 0; for (let k = i - p; k < i; k++) s += v[k]; out[i] = s ? v[i] / (s / p) : NaN; }
  return out;
}
/** daily-anchored VWAP (typical price * volume) */
export function vwap(candles, tz = 0) {
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
export function ichimoku(h, l, c, { tenkan = 9, kijun = 26, senkou = 52, shift = 26 } = {}) {
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
export function candlePatterns(candles, { lookback = 3 } = {}) {
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
export function marketStructure(swings) {
  const hs = swings.filter((s) => s.type === 'high').slice(-2), ls = swings.filter((s) => s.type === 'low').slice(-2);
  if (hs.length < 2 || ls.length < 2) return null;
  const h = hs[1].price > hs[0].price ? 'HH' : 'LH', l = ls[1].price > ls[0].price ? 'HL' : 'LL';
  return { trend: h === 'HH' && l === 'HL' ? 'uptrend' : h === 'LH' && l === 'LL' ? 'downtrend' : 'range', labels: [h, l], lastHigh: hs[1].price, lastLow: ls[1].price };
}
/** Regular RSI divergence between the last two swing lows (bullish) / highs (bearish). */
export function rsiDivergence(rsiArr, swings, { maxAge = 40 } = {}) {
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
export function analyzeIndicators(candles, o = {}) {
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

export function indicatorsToCSV(history, digits = 5) {
  const keys = Object.keys(history), n = history.time.length;
  const rows = [keys.join(',')];
  for (let i = 0; i < n; i++) rows.push(keys.map((k) => (k === 'time' ? new Date(history.time[i]).toISOString().slice(0, 16) : history[k][i] == null ? '' : +history[k][i].toFixed(digits))).join(','));
  return rows.join('\n');
}

/** Compact text for LLM prompts. */
export function indicatorsToText(I, { lang = 'ru', digits = 5 } = {}) {
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
