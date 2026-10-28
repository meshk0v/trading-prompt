export type ChartRef = {
  pair: string
  timeframe: string
}

export type Message =
  /** Welcome text, revealed character by character. */
  | { id: string; kind: 'greeting'; greetingIndex: number; visibleChars: number; timestamp: Date }
  /** The user's "build a prompt" request. */
  | { id: string; kind: 'request'; pair: string; timeframe: string; timestamp: Date }
  /** The generated prompt with its chart and export buttons. */
  | { id: string; kind: 'prompt'; prompt: string; chart: ChartRef; timestamp: Date }
  /** A message from the service, e.g. why a prompt could not be built. */
  | { id: string; kind: 'notice'; text: string; timestamp: Date }
