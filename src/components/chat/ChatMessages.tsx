import { useEffect, useRef } from 'react'
import type { AuthUser } from '../../api/auth'
import { MARKET_DATA_ENABLED } from '../../api/market'
import { GREETINGS } from '../../data/greetings'
import { useI18n } from '../../i18n/context'
import type { Message } from '../../types'
import { formatTime } from '../../utils/format'
import Logo from '../Logo'
import MessageContent from './MessageContent'
import PromptResult from './PromptResult'
import './ChatMessages.css'

type ChatMessagesProps = {
  messages: Message[]
  isTyping: boolean
  user: AuthUser | null
  hidden: boolean
}

export default function ChatMessages({ messages, isTyping, user, hidden }: ChatMessagesProps) {
  const { t } = useI18n()
  const bottomRef = useRef<HTMLDivElement>(null)
  const userName = user?.name || user?.email || t('Вы')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div data-prompt-guide="prompt-result" className="chat-messages scrollable" hidden={hidden}>
      {messages.map(message => {
        const fromUser = message.kind === 'request'
        return (
          <div key={message.id} className={`chat-message chat-message--${message.kind} message-fade`}>
            <div className="chat-message__inner">
              <div className="chat-message__avatar">
                {fromUser ? (
                  <div className="chat-message__user-avatar">{userName[0].toUpperCase()}</div>
                ) : (
                  <Logo size={34} />
                )}
              </div>

              <div className="chat-message__body">
                <div className="chat-message__meta">
                  <span className="chat-message__author">{fromUser ? userName : 'Trading Prompt'}</span>
                  <span className="chat-message__time">{formatTime(message.timestamp)}</span>
                </div>

                {message.kind === 'greeting' && (
                  <MessageContent
                    text={t(GREETINGS.ru[message.greetingIndex]).slice(0, message.visibleChars)}
                    muted
                    compactParagraphs
                  />
                )}
                {message.kind === 'request' && (
                  <MessageContent
                    text={t('Запрос промпта: **{pair}** · Период графика **{timeframe}**', {
                      pair: message.pair,
                      timeframe: message.timeframe,
                    })}
                  />
                )}
                {message.kind === 'notice' && <MessageContent text={message.text} />}
                {message.kind === 'prompt' && (
                  <>
                    <MessageContent
                      text={
                        MARKET_DATA_ENABLED
                          ? t(
                              'Промпт с рыночными данными готов. Скопируйте текст или скачайте файл для выбранного вами ИИ:',
                            )
                          : t('Готовый учебный промпт. Скачайте PDF или скопируйте текст для выбранного вами ИИ:')
                      }
                    />
                    <PromptResult prompt={message.prompt} chart={message.chart} />
                  </>
                )}
              </div>
              <div className="chat-message__spacer" />
            </div>
          </div>
        )
      })}

      {isTyping && (
        <div className="chat-message chat-message--typing message-fade">
          <div className="chat-message__inner">
            <div className="chat-message__avatar">
              <Logo size={34} />
            </div>
            <div className="chat-message__body">
              <div className="chat-message__meta chat-message__meta--typing">
                <span className="chat-message__author">Trading Prompt</span>
                <span className="chat-message__typing-label">{t('печатает...')}</span>
              </div>
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="chat-message__spacer" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
