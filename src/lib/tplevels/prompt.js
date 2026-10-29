import { autoDigits, toMs } from './utils.js';
import { levelsToText } from './analyze.js';
import { indicatorsToText } from './indicators.js';

const iso = (t) => new Date(toMs(t)).toISOString().slice(0, 16);

/** OHLCV of the last n candles; indicator columns (from analyzeIndicators history) are appended when lengths match. */
export function candlesTable(candles, n = 30, { indicators = null, digits } = {}) {
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
export function buildPrompt(r, candles, o = {}) {
  const { symbol = '', timeframe = '', bars = 30, lang = 'ru', levels = true, indicators = true, above = 8, below = 8, lastBarOpen = null, volumeKind = null } = o;
  const w = (ru, en) => (lang === 'en' ? en : ru), last = candles[candles.length - 1], d = o.digits ?? autoDigits(last.close);
  const parts = [[
    `${w('Актив', 'Asset')}: ${symbol || 'n/a'}`,
    `${w('Таймфрейм', 'Timeframe')}: ${timeframe || 'n/a'}`,
    `${w('Текущая цена', 'Current price')}: ${last.close.toFixed(d)}${lastBarOpen ? w(' (последняя свеча ещё формируется)', ' (last candle still forming)') : ''}`,
    `${w('Время последней свечи (UTC)', 'Last candle time (UTC)')}: ${iso(last.time)}`,
  ].join('\n')];
  if (levels) parts.push(levelsToText(r, { above, below, digits: d, lang }));
  if (indicators && r.indicators) parts.push(indicatorsToText(r.indicators, { lang, digits: d }));
  if (bars > 0) {
    const m = Math.min(bars, candles.length), tick = volumeKind === 'tick' ? w(', volume = тиковый объём', ', volume = tick volume') : '';
    parts.push(`${w('История', 'History')}: ${w('последние', 'last')} ${m} ${w('свечей', 'candles')} (${w('от старых к новым, цены в той же шкале', 'oldest to newest')}${tick}):\n` + candlesTable(candles, bars, { indicators: indicators ? r.indicators : null, digits: d }));
  }
  return parts.join('\n\n');
}
