import { useEffect, useRef, useState } from 'react'
import { GREETINGS } from '../data/greetings'
import { useI18n } from '../i18n/context'
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
  // Read inside the typing timer, so a text changed by an administrator is typed to its end.
  const { tIn } = useI18n()
  const tInRef = useRef(tIn)
  useEffect(() => {
    tInRef.current = tIn
  }, [tIn])

  // Show a "typing…" indicator, then reveal the greeting a few characters at a time.
  useEffect(() => {
    const greetingIndex = nextGreetingIndex()
    const greeting = GREETINGS.ru[greetingIndex]
    // Type until the longest translation is complete, so switching language never cuts the text.
    const fullLength = () => Math.max(tInRef.current('ru', greeting).length, tInRef.current('en', greeting).length)
    const timestamp = new Date()
    let intervalId: ReturnType<typeof setInterval> | undefined

    setIsTyping(true)
    const startId = setTimeout(() => {
      let visibleChars = 0
      setIsTyping(false)
      // Updates only the greeting: a prompt or a notice may already follow it.
      const show = () => {
        const greeting: Message = { id: 'greeting', kind: 'greeting', greetingIndex, visibleChars, timestamp }
        setMessages(previous => [greeting, ...previous.filter(message => message.id !== 'greeting')])
      }
      show()
      intervalId = setInterval(() => {
        const length = fullLength()
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

  const addNotice = (text: string) => {
    setMessages(previous => [...previous, { id: `${Date.now()}-notice`, kind: 'notice', text, timestamp: new Date() }])
  }

  return { messages, isTyping, addPromptExchange, addNotice }
}
