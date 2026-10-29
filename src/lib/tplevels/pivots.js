import { assertCandles, groupByPeriod } from './utils.js';

/**
 * Pivot points from one period's OHLC.
 * methods: 'classic' | 'fibonacci' | 'woodie' (TradingView style) | 'camarilla' | 'demark'
 */
export function pivotPoints({ high: H, low: L, close: C, open: O }, method = 'classic') {
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
export function pivotsFromCandles(candles, { period = 'day', method = 'classic', tzOffsetHours = 0 } = {}) {
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
