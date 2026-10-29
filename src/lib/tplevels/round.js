import { decimals, roundTo } from './utils.js';

/** Heuristic steps: minor = 2 orders below price, major = 1 order below. EURUSD 1.08 -> 0.01 / 0.1; BTC 67000 -> 100 / 1000. */
export function autoStep(price) {
  const e = Math.floor(Math.log10(Math.abs(price)));
  return { minor: 10 ** (e - 2), major: 10 ** (e - 1) };
}

/**
 * Round (psychological) levels around a price.
 * @param {number} price
 * @param {{step?:number, majorStep?:number, count?:number}} [o] count = levels on each side
 */
export function roundLevels(price, { step, majorStep, count = 4 } = {}) {
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
