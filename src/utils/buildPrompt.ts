import { fetchCalendar, fetchMarketData, type CalendarEvent, type MarketData } from '../api/market'
import type { Language } from '../i18n/translate'
import type { TranslationParams } from '../i18n/translate'
import { analyzeLevels, buildPrompt as levelsPrompt, candlesTable, type Candle } from '../lib/tplevels'

type Translate = (text: string, params?: TranslationParams) => string

export type PromptSettings = {
  pair: string
  assetType: string
  timeframes: string[]
  priceHistory: number
  indicatorHistory: number
  purpose: string
  language: Language
  /** Indicator ids enabled in the prompt settings; none turns the indicator block off. */
  indicators: string[]
  /** The economic calendar is enabled in the prompt settings. */
  includeCalendar: boolean
}

/** Fewest candles requested, so levels and long indicators (Ichimoku needs 78) have enough history. */
const MIN_ANALYSIS_BARS = 300
/** Most candles the server returns in one request. */
const SERVER_MAX_BARS = 2000

const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().slice(0, 16).replace('T', ' ')

/** Levels, indicators and candles of one timeframe, calculated by the tplevels library. */
function timeframeSection(data: MarketData, settings: PromptSettings, t: Translate): string {
  const title = `=== ${t('Таймфрейм {timeframe}', { timeframe: data.timeframe })} ===`
  const candles: Candle[] = data.bars.map(([time, open, high, low, close, volume]) => ({
    time: time * 1000,
    open,
    high,
    low,
    close,
    volume,
  }))
  if (candles.length < 20)
    return `${title}\n${t('Недостаточно свечей для расчёта: {count}.', { count: candles.length })}`

  const withIndicators = settings.indicators.length > 0
  const analysis = analyzeLevels(candles, {
    indicators: withIndicators ? { history: settings.indicatorHistory, volumeKind: 'tick' } : false,
  })
  const text = levelsPrompt(analysis, candles, {
    symbol: settings.pair,
    timeframe: data.timeframe,
    bars: settings.indicatorHistory,
    lang: settings.language,
    indicators: withIndicators,
    lastBarOpen: data.current,
    volumeKind: 'tick',
  })

  const shown = Math.min(settings.priceHistory, candles.length)
  const quotes = [
    t('Котировки: последние {count} свечей, от старых к новым, volume — тиковый объём.', { count: shown }),
    ...(shown < settings.priceHistory
      ? [t('Запрошено {requested}, доступно {count}.', { requested: settings.priceHistory, count: shown })]
      : []),
    candlesTable(candles, shown),
  ].join('\n')
  return [title, text, quotes].join('\n\n')
}

function calendarSection(currencies: string[], events: CalendarEvent[], t: Translate): string {
  const lines = [
    `=== ${t('Экономический календарь')} ===`,
    t('Валюты: {currencies}. Последние 2 дня и ближайшие 3 дня, события средней и высокой важности.', {
      currencies: currencies.join(', '),
    }),
  ]
  if (events.length === 0) return [...lines, t('Событий нет.')].join('\n')

  const value = (number: number | null, unit: string) =>
    number === null ? '—' : `${number}${unit === 'percent' ? '%' : ''}`
  lines.push([t('Время'), t('Валюта'), t('Важность'), t('Событие'), t('Факт'), t('Прогноз'), t('Ранее')].join(';'))
  for (const event of events) {
    lines.push(
      [
        formatTime(event.time),
        event.currency,
        event.importance === 'high' ? t('высокая') : t('средняя'),
        event.name,
        value(event.actual, event.unit),
        value(event.forecast, event.unit),
        value(event.previous, event.unit),
      ].join(';'),
    )
  }
  return lines.join('\n')
}

const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Ошибка сервера')

/**
 * Builds the prompt with market data from biquote.io: for every chosen timeframe the levels and
 * indicators from the tplevels library and the latest candles, then the economic calendar.
 * Throws when no timeframe has data (unknown instrument, data source down).
 */
export async function buildPrompt(settings: PromptSettings, t: Translate): Promise<string> {
  const limit = Math.min(SERVER_MAX_BARS, Math.max(settings.priceHistory, settings.indicatorHistory, MIN_ANALYSIS_BARS))
  const [results, calendar] = await Promise.all([
    Promise.allSettled(settings.timeframes.map(timeframe => fetchMarketData(settings.pair, timeframe, limit))),
    settings.includeCalendar
      ? fetchCalendar(settings.pair).then(
          value => ({ value }),
          (error: unknown) => ({ error }),
        )
      : null,
  ])

  if (results.every(result => result.status === 'rejected')) {
    throw new Error(errorText((results[0] as PromiseRejectedResult).reason))
  }

  const summary = [
    t('Инструмент: {value}', { value: settings.pair }),
    t('Тип актива: {value}', { value: settings.assetType }),
    t('Таймфреймы: {value}', { value: settings.timeframes.join(', ') }),
    t('Данные: biquote.io. Время — UTC, время свечи — её открытие. Volume — тиковый объём (число изменений цены).'),
    t('Сформировано: {time} UTC', { time: formatTime(Date.now() / 1000) }),
  ]

  const sections = results.map((result, index) =>
    result.status === 'fulfilled'
      ? timeframeSection(result.value, settings, t)
      : `=== ${t('Таймфрейм {timeframe}', { timeframe: settings.timeframes[index] })} ===\n${t('Данные недоступны: {error}', { error: t(errorText(result.reason)) })}`,
  )
  if (calendar && 'error' in calendar) {
    sections.push(
      `=== ${t('Экономический календарь')} ===\n${t('Данные недоступны: {error}', { error: t(errorText(calendar.error)) })}`,
    )
  } else if (calendar) {
    sections.push(calendarSection(calendar.value.currencies, calendar.value.events, t))
  }

  const purpose = settings.purpose.trim()
  return [...(purpose ? [purpose] : []), summary.join('\n'), ...sections].join('\n\n')
}
