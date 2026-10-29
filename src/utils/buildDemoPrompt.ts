import { buildCandles, generateFundamentals, generateIndicators, generateVolumeData } from '../data/mockMarketData'
import type { PromptSettings, Translate } from './buildPrompt'

/** Builds the prompt text with sample (fictional) market data; used while MARKET_DATA_ENABLED is off. */
export function buildDemoPrompt(settings: PromptSettings, t: Translate): string {
  const { pair } = settings
  const now = Date.now()

  const indicators = generateIndicators('WAIT', pair)
    .slice(0, 8)
    .map(item => t('• {name} ({param}): {value}; оценка {signal}', { ...item }))
  const candles = buildCandles('WAIT', now)
    .slice(-6)
    .map((item, index) =>
      t('• Свеча {index}: O {o}, H {h}, L {l}, C {c}', {
        index: index + 1,
        o: item.o.toFixed(2),
        h: item.h.toFixed(2),
        l: item.l.toFixed(2),
        c: item.c.toFixed(2),
      }),
    )
  const volumes = generateVolumeData('WAIT', pair)
    .slice(0, 5)
    .map(item => t('• {exchange} / {instrument}: объём {volume}, изменение {change}', { ...item }))
  const fundamentals = generateFundamentals('WAIT', pair)
    .slice(0, 5)
    .map(item =>
      t('• {country}: {name} ({period}) — значение {actual}, прогноз {forecast}, ранее {previous}', { ...item }),
    )

  const summary = [
    t('Инструмент: {value}', { value: pair }),
    t('Тип актива: {value}', { value: settings.assetType }),
    t('Таймфреймы: {value}', { value: settings.timeframes.join(', ') }),
    t('История цены: {count} баров', { count: settings.priceHistory }),
    t('История индикаторов: {count} баров', { count: settings.indicatorHistory }),
  ].join('\n')

  const purpose = settings.purpose.trim()
  return [
    ...(purpose ? [purpose] : []),
    summary,
    `${t('Индикаторы (учебные, вымышленные):')}\n${indicators.join('\n')}`,
    `${t('Свечи OHLC (учебные, вымышленные, условный индекс):')}\n${candles.join('\n')}`,
    `${t('Объёмы (учебные, вымышленные):')}\n${volumes.join('\n')}`,
    `${t('Фундаментальные показатели (учебные, вымышленные):')}\n${fundamentals.join('\n')}`,
  ].join('\n\n')
}
