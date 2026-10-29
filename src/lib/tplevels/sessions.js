import { assertCandles, groupByPeriod, toMs } from './utils.js';

const TAG = { day: 'D', week: 'W', month: 'M' };

/**
 * Previous / current period levels.
 * previous: PDH PDL PDC (PWH.., PMH..), current: DO DH DL (WO.., MO..)
 */
export function periodLevels(candles, { period = 'day', tzOffsetHours = 0 } = {}) {
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
export function sessionRanges(
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
