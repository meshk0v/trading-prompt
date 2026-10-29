import { assertCandles } from './utils.js';
import { zigzag } from './swings.js';

export const FIB_RETRACEMENT = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
export const FIB_EXTENSION = [0.618, 1, 1.272, 1.618, 2, 2.618];
export const FIB_PROJECTION = [1.272, 1.618, 2, 2.618];

const P = (x) => (typeof x === 'number' ? x : x.price);

/** Retracement of move a->b: 0 = b (the end), 1 = a (the start). */
export function fibRetracement(a, b, ratios = FIB_RETRACEMENT) {
  const pa = P(a), pb = P(b);
  return ratios.map((ratio) => ({ kind: 'fib', ratio, price: pb - (pb - pa) * ratio }));
}

/** ABC extension: targets from point c, measured by the length of a->b. */
export function fibExtension(a, b, c, ratios = FIB_EXTENSION) {
  const pa = P(a), pb = P(b), pc = P(c);
  return ratios.map((ratio) => ({ kind: 'fib-ext', ratio, price: pc + (pb - pa) * ratio }));
}

/** Projection of move a->b beyond b: price = a + (b - a) * ratio (1.272, 1.618 ...). */
export function fibProjection(a, b, ratios = FIB_PROJECTION) {
  const pa = P(a), pb = P(b);
  return ratios.map((ratio) => ({ kind: 'fib-proj', ratio, price: pa + (pb - pa) * ratio }));
}

/**
 * Fibonacci on the last completed ZigZag leg.
 * `includeCurrentLeg: true` also uses the still-forming extreme as point b.
 * @returns {null | {a,b,direction,retracements,projections,currentRatio}}
 */
export function autoFib(candles, { includeCurrentLeg = false, percent = null, atrMult = 2.5, pivots } = {}) {
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
