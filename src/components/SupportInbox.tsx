import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react'
import { createTicket, fetchTickets, markTicketRead, replyToTicket, type Ticket } from '../api/tickets'

type SupportInboxProps = {
  signedIn: boolean
  onSignIn: () => void
  /** Called with the number of tickets that have an unread answer. */
  onUnreadChange?: (count: number) => void
}

const STATUS_LABEL: Record<Ticket['status'], string> = { open: 'Открыт', answered: 'Есть ответ', closed: 'Закрыт' }
const STATUS_COLOR: Record<Ticket['status'], string> = { open: '#9A98B5', answered: '#8B7CFF', closed: '#676582' }

const errorMessage = (reason: unknown) => (reason instanceof Error ? reason.message : 'Ошибка сервера')

/** Server dates are "YYYY-MM-DD HH:MM:SS" in UTC. */
function formatWhen(value: string): string {
  const date = new Date(value.replace(' ', 'T') + 'Z')
  if (Number.isNaN(date.getTime())) return ''
  const sameDay = date.toDateString() === new Date().toDateString()
  return sameDay
    ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const fieldStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#191926', border: '1px solid #34344F', borderRadius: '8px',
  padding: '10px 14px', color: '#EDEBFA', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'none',
}

const primaryButton = (disabled: boolean): CSSProperties => ({
  height: 40, padding: '0 22px', background: '#8B7CFF', border: '1px solid #8B7CFF', borderRadius: '8px', color: '#0D0A24',
  fontSize: '13px', fontWeight: 700, fontFamily: 'Outfit, sans-serif', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
})

export default function SupportInbox({ signedIn, onSignIn, onUnreadChange }: SupportInboxProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loaded, setLoaded] = useState(false)
  // A ticket id, 'new' for the compose form, or null for the list only (phones).
  const [selected, setSelected] = useState<number | 'new' | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const chatEnd = useRef<HTMLDivElement>(null)
  const picked = useRef(false)

  const load = useCallback(() => {
    fetchTickets().then(
      ({ tickets: list, unread }) => {
        setTickets(list)
        setLoaded(true)
        onUnreadChange?.(unread)
      },
      () => setLoaded(true),
    )
  }, [onUnreadChange])

  useEffect(() => {
    if (!signedIn) {
      setTickets([])
      setLoaded(false)
      onUnreadChange?.(0)
      return
    }
    load()
    const timer = setInterval(() => { if (!document.hidden) load() }, 20000)
    return () => clearInterval(timer)
  }, [signedIn, load, onUnreadChange])

  // On a wide screen show the newest conversation (or the form when there is none) right away.
  useEffect(() => {
    if (!loaded || picked.current) return
    picked.current = true
    if (window.innerWidth > 820) setSelected(tickets.length ? tickets[0].id : 'new')
  }, [loaded, tickets])

  const current = typeof selected === 'number' ? tickets.find(ticket => ticket.id === selected) ?? null : null

  // Opening a ticket (or an answer arriving while it is open) marks it as read.
  useEffect(() => {
    if (current?.unread) markTicketRead(current.id).then(load, () => undefined)
  }, [current?.id, current?.unread, load])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: 'end' })
  }, [current?.id, current?.messages.length])

  const open = (id: number | 'new') => {
    setSelected(id)
    setError('')
    setReply('')
  }

  const submitNew = (event?: FormEvent) => {
    event?.preventDefault()
    if (!subject.trim() || !body.trim() || busy) return
    setBusy(true)
    setError('')
    createTicket(subject.trim(), body.trim())
      .then(
        ({ id }) => {
          setSubject('')
          setBody('')
          setSelected(id)
          load()
        },
        reason => setError(errorMessage(reason)),
      )
      .finally(() => setBusy(false))
  }

  const submitReply = (event?: FormEvent) => {
    event?.preventDefault()
    if (!current || !reply.trim() || busy) return
    setBusy(true)
    setError('')
    replyToTicket(current.id, reply.trim())
      .then(
        () => {
          setReply('')
          load()
        },
        reason => setError(errorMessage(reason)),
      )
      .finally(() => setBusy(false))
  }

  // Enter sends, Shift+Enter adds a line.
  const onEnter = (submit: () => void) => (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  if (!signedIn) {
    return (
      <div style={{ padding: '28px', background: '#12121C', border: '1px solid #191926', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '17px', color: '#EDEBFA' }}>Обращения в поддержку</div>
          <div style={{ marginTop: 4, fontSize: '13px', color: '#7C7A98', fontFamily: 'Inter, sans-serif' }}>Чтобы написать нам и видеть ответы, войдите в аккаунт.</div>
        </div>
        <button type="button" onClick={onSignIn} style={primaryButton(false)}>Войти</button>
      </div>
    )
  }

  const listPane = (
    <div className="support-inbox-list">
      <div style={{ padding: '14px', borderBottom: '1px solid #191926' }}>
        <button type="button" onClick={() => open('new')} style={{ ...primaryButton(false), width: '100%', height: 38 }}>+ Новое обращение</button>
      </div>
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto' }}>
        {loaded && tickets.length === 0 && (
          <div style={{ padding: '28px 18px', textAlign: 'center', color: '#676582', fontSize: '13px', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
            Обращений пока нет. Задайте вопрос — ответ придёт сюда и на почту.
          </div>
        )}
        {tickets.map(ticket => {
          const last = ticket.messages[ticket.messages.length - 1]
          const active = selected === ticket.id
          return (
            <button
              key={ticket.id}
              type="button"
              onClick={() => open(ticket.id)}
              style={{ width: '100%', textAlign: 'left', display: 'block', padding: '12px 14px', background: active ? 'rgba(139,124,255,0.10)' : 'transparent', border: 'none', borderBottom: '1px solid #191926', borderLeft: `3px solid ${active ? '#8B7CFF' : 'transparent'}`, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: ticket.unread ? 700 : 500, color: '#EDEBFA' }}>{ticket.subject}</span>
                {ticket.unread && <span aria-label="Новый ответ" style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B7CFF', flexShrink: 0 }} />}
                <span style={{ fontSize: '10px', color: '#676582', flexShrink: 0 }}>{last ? formatWhen(last.date) : ''}</span>
              </div>
              <div style={{ marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#7C7A98' }}>
                {last ? (last.author === 'staff' ? 'Поддержка: ' : 'Вы: ') + last.body : ''}
              </div>
              <div style={{ marginTop: 5, fontSize: '10px', fontWeight: 600, color: STATUS_COLOR[ticket.status] }}>{STATUS_LABEL[ticket.status]}</div>
            </button>
          )
        })}
      </div>
    </div>
  )

  const backButton = (
    <button type="button" className="support-inbox-back" onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#B9AFFF', fontSize: '13px', fontFamily: 'Inter, sans-serif', cursor: 'pointer', padding: 0, marginRight: 8 }}>← Назад</button>
  )

  let detail
  if (selected === 'new') {
    detail = (
      <form onSubmit={submitNew} className="support-inbox-detail" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {backButton}
          <h2 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '17px', color: '#EDEBFA' }}>Новое обращение</h2>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: '#7C7A98', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
          Опишите вопрос — мы ответим в течение 2 часов. Ответ появится здесь и придёт на почту из аккаунта (проверьте папку «Спам»).
        </p>
        <input type="text" placeholder="Тема" value={subject} onChange={e => setSubject(e.target.value)} maxLength={200} required style={{ ...fieldStyle, height: 44 }} />
        <textarea rows={7} placeholder="Подробно опишите проблему или вопрос" value={body} onChange={e => setBody(e.target.value)} onKeyDown={onEnter(submitNew)} maxLength={5000} required style={fieldStyle} />
        {error && <div role="alert" style={{ color: '#FF8A6B', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={busy || !subject.trim() || !body.trim()} style={primaryButton(busy || !subject.trim() || !body.trim())}>{busy ? 'Отправка…' : 'Отправить'}</button>
        </div>
      </form>
    )
  } else if (current) {
    detail = (
      <div className="support-inbox-detail" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #191926' }}>
          {backButton}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px', color: '#EDEBFA' }}>{current.subject}</div>
            <div style={{ marginTop: 2, fontSize: '11px', color: '#676582', fontFamily: 'Inter, sans-serif' }}>
              TKT-{String(current.id).padStart(3, '0')} · <span style={{ color: STATUS_COLOR[current.status] }}>{STATUS_LABEL[current.status]}</span>
            </div>
          </div>
        </div>
        <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {current.messages.map((message, index) => {
            const mine = message.author === 'user'
            return (
              <div key={index} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                <div style={{ padding: '10px 14px', borderRadius: mine ? '12px 12px 3px 12px' : '12px 12px 12px 3px', background: mine ? 'rgba(139,124,255,0.18)' : '#191926', border: `1px solid ${mine ? 'rgba(139,124,255,0.35)' : '#2A2A40'}`, color: '#EDEBFA', fontSize: '13px', lineHeight: 1.6, fontFamily: 'Inter, sans-serif', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {message.body}
                </div>
                <div style={{ marginTop: 4, textAlign: mine ? 'right' : 'left', fontSize: '10px', color: '#676582', fontFamily: 'Inter, sans-serif' }}>
                  {mine ? 'Вы' : 'Поддержка'} · {formatWhen(message.date)}
                </div>
              </div>
            )
          })}
          {current.status !== 'closed' && !current.messages.some(message => message.author === 'staff') && (
            <div style={{ alignSelf: 'center', fontSize: '12px', color: '#676582', fontFamily: 'Inter, sans-serif', textAlign: 'center', lineHeight: 1.6 }}>
              Мы ответим в течение 2 часов. Ответ появится здесь и придёт на почту (проверьте «Спам»).
            </div>
          )}
          <div ref={chatEnd} />
        </div>
        {current.status === 'closed' ? (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #191926', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#676582', fontFamily: 'Inter, sans-serif' }}>Обращение закрыто. Если вопрос остался, создайте новое.</span>
            <button type="button" onClick={() => open('new')} style={primaryButton(false)}>Новое обращение</button>
          </div>
        ) : (
          <form onSubmit={submitReply} style={{ padding: '12px 20px 16px', borderTop: '1px solid #191926', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {error && <div role="alert" style={{ color: '#FF8A6B', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea rows={2} placeholder="Напишите сообщение…" value={reply} onChange={e => setReply(e.target.value)} onKeyDown={onEnter(submitReply)} maxLength={5000} style={{ ...fieldStyle, flex: 1 }} />
              <button type="submit" disabled={busy || !reply.trim()} style={primaryButton(busy || !reply.trim())}>{busy ? '…' : 'Отправить'}</button>
            </div>
          </form>
        )}
      </div>
    )
  } else {
    detail = (
      <div className="support-inbox-detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#676582', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
        {loaded ? 'Выберите обращение или создайте новое' : 'Загрузка…'}
      </div>
    )
  }

  return (
    <div className="support-inbox" data-detail={selected !== null}>
      <style>{`
        .support-inbox { display: grid; grid-template-columns: 300px minmax(0, 1fr); height: clamp(420px, calc(100vh - 230px), 700px); background: #12121C; border: 1px solid #191926; border-radius: 10px; overflow: hidden; }
        .support-inbox-list { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid #191926; }
        .support-inbox-detail { min-width: 0; overflow-y: auto; }
        .support-inbox-back { display: none; }
        @media (max-width: 820px) {
          .support-inbox { grid-template-columns: minmax(0, 1fr); }
          .support-inbox-list { border-right: none; }
          .support-inbox[data-detail="true"] .support-inbox-list { display: none; }
          .support-inbox[data-detail="false"] .support-inbox-detail { display: none; }
          .support-inbox-back { display: inline-block; }
        }
      `}</style>
      {listPane}
      {detail}
    </div>
  )
}
