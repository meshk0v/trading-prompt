import { fetchCalendar, fetchMarketData, type Bar, type CalendarEvent, type MarketData } from '../api/market'
import type { TranslationParams } from '../i18n/translate'
import { calculateIndicators, type ValueKind } from './indicators'

export type Translate = (text: string, params?: TranslationParams) => string

export type PromptSettings = {
  pair: string
  assetType: string
  timeframes: string[]
  priceHistory: number
  indicatorHistory: number
  purpose: string
  /** Indicator ids enabled in the prompt settings. */
  indicators: string[]
  /** The economic calendar is enabled in the prompt settings. */
  includeCalendar: boolean
}

/** Extra candles requested beyond the ones shown, so long indicators (SMA 200) are calculated correctly. */
const INDICATOR_WARMUP = 200
/** Most candles the server returns in one request. */
const SERVER_MAX_BARS = 2000

const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().slice(0, 16).replace('T', ' ')

/** Decimal places the instrument is quoted with (5 for EUR/USD, 2 for BTC/USD). */
function priceDigits(bars: Bar[]): number {
  let digits = 0
  for (const bar of bars.slice(-50)) {
    for (const value of bar.slice(1, 5)) digits = Math.max(digits, (String(value).split('.')[1] ?? '').length)
  }
  return Math.min(digits, 8)
}

function formatValue(value: number | null, kind: ValueKind, digits: number): string {
  if (value === null) return '—'
  if (kind === 'scale') return value.toFixed(2)
  if (kind === 'count') return String(Math.round(value))
  return value.toFixed(Math.min(kind === 'delta' ? digits + 1 : digits, 8))
}

function timeframeSection(data: MarketData, settings: PromptSettings, t: Translate): string {
  const { bars } = data
  const digits = priceDigits(bars)
  const shown = bars.slice(-settings.priceHistory)

  const lines = [`=== ${t('Таймфрейм {timeframe}', { timeframe: data.timeframe })} ===`]
  lines.push(
    data.current
      ? t('Свечи: {count}, от старых к новым. Последняя ещё формируется, её Close — текущая цена.', {
          count: shown.length,
        })
      : t('Свечи: {count}, от старых к новым, все закрыты.', { count: shown.length }),
  )
  if (shown.length < settings.priceHistory) {
    lines.push(t('Запрошено {requested}, доступно {count}.', { requested: settings.priceHistory, count: shown.length }))
  }
  lines.push(`${t('Время')};Open;High;Low;Close;Volume`)
  for (const [time, open, high, low, close, volume] of shown) {
    lines.push([formatTime(time), ...[open, high, low, close].map(v => v.toFixed(digits)), volume].join(';'))
  }

  if (settings.indicators.length > 0 && bars.length > 0) {
    const count = Math.min(settings.indicatorHistory, bars.length)
    const columns = calculateIndicators(bars, settings.indicators, count)
    const ready = columns.filter(column => column.values.some(value => value !== null))
    const missing = columns.filter(column => !ready.includes(column))

    lines.push('', t('Индикаторы на последних {count} свечах:', { count }))
    if (ready.length > 0) {
      lines.push([t('Время'), ...ready.map(column => column.title)].join(';'))
      bars.slice(-count).forEach(([time], row) => {
        lines.push(
          [formatTime(time), ...ready.map(column => formatValue(column.values[row], column.kind, digits))].join(';'),
        )
      })
    }
    if (missing.length > 0) {
      lines.push(
        t('Недостаточно свечей для расчёта: {names}.', { names: missing.map(column => column.title).join(', ') }),
      )
    }
  }
  return lines.join('\n')
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
 * Builds the prompt with market data from biquote.io: candles of every chosen timeframe,
 * indicators from the prompt settings, the current price and the economic calendar.
 * Throws when no timeframe has data (unknown instrument, data source down).
 */
export async function buildPrompt(settings: PromptSettings, t: Translate): Promise<string> {
  const limit = Math.min(SERVER_MAX_BARS, Math.max(settings.priceHistory, settings.indicatorHistory) + INDICATOR_WARMUP)
  const [results, calendar] = await Promise.all([
    Promise.allSettled(settings.timeframes.map(timeframe => fetchMarketData(settings.pair, timeframe, limit))),
    settings.includeCalendar
      ? fetchCalendar(settings.pair).then(
          value => ({ value }),
          (error: unknown) => ({ error }),
        )
      : null,
  ])

  const loaded = results.flatMap(result => (result.status === 'fulfilled' ? [result.value] : []))
  if (loaded.length === 0) throw new Error(errorText((results[0] as PromiseRejectedResult).reason))

  const { price } = loaded[0]
  const digits = priceDigits(loaded[0].bars)
  const summary = [
    t('Инструмент: {value}', { value: settings.pair }),
    t('Тип актива: {value}', { value: settings.assetType }),
    t('Таймфреймы: {value}', { value: settings.timeframes.join(', ') }),
  ]
  if (price.value !== null && price.time !== null) {
    summary.push(
      t('Текущая цена: {price} ({time} UTC)', { price: price.value.toFixed(digits), time: formatTime(price.time) }) +
        (price.marketOpen ? '' : `, ${t('рынок закрыт')}`),
    )
  }
  summary.push(
    t('Данные: biquote.io. Время — UTC, время свечи — её открытие. Volume — тиковый объём (число изменений цены).'),
    t('Сформировано: {time} UTC', { time: formatTime(Date.now() / 1000) }),
  )

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
