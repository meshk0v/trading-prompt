import type { TradingCandle } from "./tradingLevelsLibrary"
import TPL from "./tradingLevelsLibrary"

export type AnalysisSource = "auto" | "binance" | "biquote"

export type LoadedMarketData = {
  candles: TradingCandle[]
  source: Exclude<AnalysisSource, "auto">
  sourceLabel: string
  symbol: string
  timeframe: string
  lastBarOpen: boolean
  volumeKind: "real" | "tick"
}

export type RequestLogEntry = {
  id: string
  timestamp: number
  level: "INFO" | "WARN" | "ERROR"
  label: string
  message: string
  url?: string
  status?: number
  durationMs?: number
}

export type RequestLogger = (entry: RequestLogEntry) => void

const BINANCE_HOSTS = [
  "https://data-api.binance.vision",
  "https://api.binance.com",
]

const TIMEFRAME_MAP: Record<string, string> = {
  M1: "1m",
  M2: "2m",
  M3: "3m",
  M4: "4m",
  M5: "5m",
  M10: "10m",
  M12: "12m",
  M15: "15m",
  M20: "20m",
  M30: "30m",
  H1: "1h",
  H2: "2h",
  H3: "3h",
  H4: "4h",
  H6: "6h",
  H8: "8h",
  H12: "12h",
  D1: "1d",
  W1: "1w",
  MN: "1M",
}

function normalizeSymbol(pair: string, source: Exclude<AnalysisSource, "auto">) {
  const symbol = source === "biquote"
    ? pair.replace(/[\\s/]/g, "").toUpperCase()
    : pair.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
  if (source === "binance" && symbol.endsWith("USD") && !symbol.endsWith("USDT")) {
    return `${symbol.slice(0, -3)}USDT`
  }
  return symbol
}

function resolveSource(
  selectedSource: AnalysisSource,
  assetType: string,
): Exclude<AnalysisSource, "auto"> {
  if (selectedSource !== "auto") return selectedSource
  return assetType === "Crypto" ? "binance" : "biquote"
}

export function fullErrorText(error: unknown) {
  if (error instanceof Error) {
    const hint = error instanceof TypeError
      ? "\nЗапрос заблокирован средой или сетью: откройте приложение в обычной вкладке браузера (не во встроенном превью)"
      : ""
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ""}${hint}`
  }
  return String(error)
}

function makeLogEntry(
  level: RequestLogEntry["level"],
  label: string,
  message: string,
  details: Partial<RequestLogEntry> = {},
): RequestLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    level,
    label,
    message,
    ...details,
  }
}

export async function fetchJson(url: string, label: string, onLog?: RequestLogger) {
  const startedAt = performance.now()
  onLog?.(makeLogEntry("INFO", label, "Запрос отправлен", { url }))
  try {
    const response = await fetch(url)
    const durationMs = Math.round(performance.now() - startedAt)
    onLog?.(makeLogEntry(
      response.ok ? "INFO" : "ERROR",
      label,
      `HTTP ${response.status}`,
      { url, status: response.status, durationMs },
    ))
    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(`HTTP ${response.status}${body ? `: ${body.slice(0, 500)}` : ""}`)
    }
    return await response.json()
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt)
    onLog?.(makeLogEntry("ERROR", label, fullErrorText(error), { url, durationMs }))
    throw error
  }
}

async function loadBinanceCandles(symbol: string, timeframe: string, limit: number, onLog?: RequestLogger) {
  let lastError: unknown
  for (const host of BINANCE_HOSTS) {
    try {
      let remaining = limit
      let endTime: number | null = null
      let rows: any[][] = []

      while (remaining > 0) {
        const batchLimit = Math.min(1000, remaining)
        const query = new URLSearchParams({
          symbol,
          interval: timeframe,
          limit: String(batchLimit),
        })
        if (endTime !== null) query.set("endTime", String(endTime))

        const batch = await fetchJson(
          `${host}/api/v3/klines?${query.toString()}`,
          "Binance klines",
          onLog,
        )
        if (!Array.isArray(batch)) throw new Error("Binance вернул некорректный набор свечей")
        rows = [...batch, ...rows]
        remaining -= batch.length
        if (batch.length < batchLimit || batch.length === 0) break
        endTime = Number(batch[0][0]) - 1
      }

      rows = rows.slice(-limit)
      return {
        candles: rows.map((row: any[]) => ({
          time: Number(row[0]),
          open: Number(row[1]),
          high: Number(row[2]),
          low: Number(row[3]),
          close: Number(row[4]),
          volume: Number(row[5]),
          trades: Number(row[8]),
          buyVolume: Number(row[9]),
        })),
        lastBarOpen: rows.length > 0 && Number(rows.at(-1)?.[6]) > Date.now(),
      }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Не удалось загрузить свечи Binance")
}

async function loadBiquoteCandles(symbol: string, timeframe: string, limit: number, onLog?: RequestLogger) {
  const data = await fetchJson(
    `https://biquote.io/api/${encodeURIComponent(symbol)}/ohlc?interval=${timeframe}&limit=${limit}`,
    "biquote OHLC",
    onLog,
  )
  if (!Array.isArray(data?.bars)) {
    throw new Error("biquote не вернул массив свечей")
  }
  const candles = data.bars
    .map((bar: any) => ({
      time: Date.parse(bar.openTime),
      open: Number(bar.open),
      high: Number(bar.high),
      low: Number(bar.low),
      close: Number(bar.close),
      volume: Number(bar.volume || bar.tickVolume || 0),
    }))
    .sort((a: TradingCandle, b: TradingCandle) => a.time - b.time)

  return {
    candles,
    lastBarOpen: data.bars.some((bar: any) => Boolean(bar.isOpen)),
    hasRealVolume: data.bars.some((bar: any) => Number(bar.volume) > 0),
  }
}

export async function loadMarketData({
  pair,
  assetType,
  timeframe,
  limit,
  source: selectedSource,
  onLog,
}: {
  pair: string
  assetType: string
  timeframe: string
  limit: number
  source: AnalysisSource
  onLog?: RequestLogger
}): Promise<LoadedMarketData> {
  const source = resolveSource(selectedSource, assetType)
  const symbol = normalizeSymbol(pair, source)
  const normalizedTimeframe = TIMEFRAME_MAP[timeframe] ?? timeframe.toLowerCase()

  if (source === "binance") {
    const data = await loadBinanceCandles(symbol, normalizedTimeframe, limit, onLog)
    validateCandles(data.candles)
    return {
      ...data,
      source,
      sourceLabel: `Binance spot ${symbol}, объём в базовой валюте`,
      symbol,
      timeframe: normalizedTimeframe,
      volumeKind: "real",
    }
  }

  const data = await loadBiquoteCandles(symbol, normalizedTimeframe, limit, onLog)
  validateCandles(data.candles)
  return {
    candles: data.candles,
    lastBarOpen: data.lastBarOpen,
    source,
    sourceLabel: `biquote ${symbol}, ${data.hasRealVolume ? "реальный" : "тиковый"} объём`,
    symbol,
    timeframe: normalizedTimeframe,
    volumeKind: data.hasRealVolume ? "real" : "tick",
  }
}

export async function loadTickRows(symbol: string, count: number, onLog?: RequestLogger) {
  const normalizedCount = Math.min(1000, Math.max(50, count || 300))
  const url = `https://biquote.io/api/${encodeURIComponent(symbol)}/history?count=${normalizedCount}`
  const rows = await fetchJson(url, "biquote ticks", onLog)
  if (!Array.isArray(rows)) throw new Error("Ответ тиков не является массивом")
  onLog?.(makeLogEntry("INFO", "biquote ticks", `Получено тиков: ${rows.length}`, { url }))
  return rows
}

export async function loadCalendarData({
  symbol,
  countriesInput,
  onLog,
}: {
  symbol: string
  countriesInput: string
  onLog?: RequestLogger
}) {
  const countries = (countriesInput.trim().toUpperCase() || TPL.inferCountries(symbol).countries.join(","))
    .split(",")
    .map(country => country.trim())
    .filter(Boolean)
  const from = new Date(Date.now() - 48 * 36e5).toISOString()
  const to = new Date(Date.now() + 7 * 864e5).toISOString()
  const query = new URLSearchParams({
    from,
    to,
    countries: countries.join(","),
    limit: "500",
  })
  const events = await fetchJson(
    `https://biquote.io/api/calendar?${query.toString()}`,
    "calendar events",
    onLog,
  )
  if (!Array.isArray(events)) throw new Error("Ответ календаря не является массивом")

  const initial = TPL.analyzeCalendar(events, { symbol, countries })
  const eventIds = initial.upcoming
    .filter((event: any) => event.imp === "H")
    .slice(0, 3)
    .map((event: any) => event.eventId)
  const history: Record<string, unknown[]> = {}

  await Promise.all(eventIds.map(async (eventId: string) => {
    const url = `https://biquote.io/api/calendar/${encodeURIComponent(eventId)}/history?limit=6`
    try {
      const rows = await fetchJson(url, `calendar history ${eventId}`, onLog)
      if (Array.isArray(rows)) history[eventId] = rows
    } catch (error) {
      onLog?.(makeLogEntry("WARN", `calendar history ${eventId}`, fullErrorText(error), { url }))
    }
  }))

  const calendar = TPL.analyzeCalendar(events, { symbol, countries, history })
  onLog?.(makeLogEntry(
    "INFO",
    "calendar",
    `Готово: предстоящих ${calendar.upcoming.length}, опубликованных ${calendar.recent.length}, праздников ${calendar.holidays.length}`,
  ))
  return calendar
}

function validateCandles(candles: TradingCandle[]) {
  if (candles.length < 30) {
    throw new Error(`Недостаточно данных: получено ${candles.length} свечей, требуется не менее 30`)
  }
  const hasInvalidCandle = candles.some(candle =>
    [candle.time, candle.open, candle.high, candle.low, candle.close].some(value => !Number.isFinite(value)),
  )
  if (hasInvalidCandle) {
    throw new Error("Источник вернул свечи с некорректными значениями")
  }
}
