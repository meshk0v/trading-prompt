import { assertCandles } from './utils.js';

/**
 * Volume profile from candles (candle volume is spread evenly over its high-low range).
 * Gives POC, value area (VAH/VAL) and high/low volume nodes.
 * For exact results feed it tick data aggregated per price level instead.
 */
export function volumeProfile(candles, { bins = 48, valueArea = 0.7, from = 0, to = candles.length } = {}) {
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
