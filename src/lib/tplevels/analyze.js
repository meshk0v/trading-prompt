import { assertCandles, lastAtr, autoDigits, isNum } from './utils.js';
import { findSwings, zigzag } from './swings.js';
import { roundLevels } from './round.js';
import { autoFib } from './fibonacci.js';
import { pivotsFromCandles } from './pivots.js';
import { periodLevels, sessionRanges } from './sessions.js';
import { findTrendlines, trendChannel, regressionChannel } from './trendlines.js';
import { srZones, supplyDemandZones, fairValueGaps, orderBlocks, consolidationRanges } from './zones.js';
import { volumeProfile } from './volumeProfile.js';
import { analyzeIndicators } from './indicators.js';

const hasTime = (c) => c.every((x) => isNum(x.time));
const safe = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };

/**
 * Computes every level type in one call.
 * Each section can be tuned via opts.<section> (passed to the underlying function)
 * or turned off with opts.<section> = false.
 * Sections: round, fibonacci, pivots, periods, sessions, trendlines, regression,
 *           sr, supplyDemand, fvg, orderBlocks, ranges, volumeProfile
 */
export function analyzeLevels(candles, opts = {}) {
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
    volumeProfile: on('volumeProfile') && candles.some((c) => isNum(c.volume)) ? volumeProfile(candles, o('volumeProfile')) : null,
  };
}

/** Flat list of every horizontal level / zone / projected line with distance to the last close. */
export function flattenLevels(r) {
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
export function nearestLevels(r, { above = 5, below = 5, groups = null } = {}) {
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
export function levelsToText(r, { above = 6, below = 6, digits, lang = 'ru', groups = null } = {}) {
  const t = T[lang] ?? T.ru;
  const d = digits ?? autoDigits(r.meta.lastClose);
  const f = (x) => x.toFixed(d);
  const fmt = (i) => {
    const p = i.low != null ? `${f(i.low)}–${f(i.high)}` : f(i.price);
    const dist = i.distance ? ` (${i.distancePct.toFixed(2)}%)` : '';
    return `- ${i.label}: ${p}${dist}`;
  };
  const nl = nearestLevels(r, { above, below, groups });
  const lines = [`${t.price}: ${f(r.meta.lastClose)}, ATR: ${f(r.meta.atr)}`];
  lines.push(`${t.above}:`, ...(nl.above.length ? nl.above.map(fmt) : [`- ${t.none}`]));
  lines.push(`${t.below}:`, ...(nl.below.length ? nl.below.map(fmt) : [`- ${t.none}`]));
  if (nl.inside.length) lines.push(`${t.inside}:`, ...nl.inside.map(fmt));
  const tl = [...(r.trendlines?.support ?? []), ...(r.trendlines?.resistance ?? [])];
  if (tl.length) {
    lines.push(`${t.trend}:`);
    for (const l of tl) lines.push(`- ${l.type} ${l.trend}: ${f(l.valueNow)} (${l.touches} ${t.touches})`);
  }
  return lines.join('\n');
}
