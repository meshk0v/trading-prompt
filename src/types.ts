export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  prompt?: string
  chart?: {
    pair: string
    timeframe: string
  }
}
