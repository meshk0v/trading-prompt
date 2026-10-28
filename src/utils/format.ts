export function formatTime(date: Date) {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

/** Most candles a prompt shows per timeframe. */
export const MAX_BARS = 1440

/** Positive whole number of candles from a text field, or the default when the input is invalid. */
export function parseBarCount(value: string, fallback = 1440): number {
  const number = Number(value)
  return Number.isFinite(number) && number >= 1 ? Math.min(MAX_BARS, Math.floor(number)) : fallback
}
