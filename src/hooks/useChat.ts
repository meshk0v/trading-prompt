import { useEffect, useState } from 'react'
import { GREETINGS } from '../data/greetings'
import type { ChartRef, Message } from '../types'

const GREETING_INDEX_KEY = 'trading_prompt_greeting_idx'
const TYPING_DELAY_MS = 350
const TYPING_STEP_MS = 20
const CHARS_PER_STEP = 10

/** Each visit shows the next welcome text in turn. */
function nextGreetingIndex(): number {
  try {
    const previous = parseInt(localStorage.getItem(GREETING_INDEX_KEY) || '-1', 10)
    const next = (previous + 1) % GREETINGS.ru.length
    localStorage.setItem(GREETING_INDEX_KEY, String(next))
    return next
  } catch {
    return 0
  }
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)

  // Show a "typing…" indicator, then reveal the greeting a few characters at a time.
  useEffect(() => {
    const greetingIndex = nextGreetingIndex()
    // Type until the longest translation is complete, so switching language never cuts the text.
    const length = Math.max(GREETINGS.ru[greetingIndex].length, GREETINGS.en[greetingIndex].length)
    const timestamp = new Date()
    let intervalId: ReturnType<typeof setInterval> | undefined

    setIsTyping(true)
    const startId = setTimeout(() => {
      let visibleChars = 0
      setIsTyping(false)
      const show = () => setMessages([{ id: 'greeting', kind: 'greeting', greetingIndex, visibleChars, timestamp }])
      show()
      intervalId = setInterval(() => {
        visibleChars = Math.min(length, visibleChars + CHARS_PER_STEP)
        show()
        if (visibleChars >= length && intervalId) clearInterval(intervalId)
      }, TYPING_STEP_MS)
    }, TYPING_DELAY_MS)

    return () => {
      clearTimeout(startId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  const addPromptExchange = (prompt: string, chart: ChartRef) => {
    const now = Date.now()
    setMessages(previous => [
      ...previous,
      { id: `${now}-user`, kind: 'request', pair: chart.pair, timeframe: chart.timeframe, timestamp: new Date() },
      { id: `${now}-prompt`, kind: 'prompt', prompt, chart, timestamp: new Date() },
    ])
  }

  return { messages, isTyping, addPromptExchange }
}
