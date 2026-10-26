import { useState } from 'react'
import PageHeader from '../components/PageHeader'

const MOCK_TICKETS = [
  { id: 'TKT-001', date: '12.06.2026', subject: 'Как зарегистрироваться в партнёрской программе?', status: 'closed', reply: 'Для участия в партнёрской программе перейдите во вкладку «Партнёрская программа» и скопируйте реферальную ссылку. Никакой дополнительной регистрации не требуется.' },
  { id: 'TKT-002', date: '18.06.2026', subject: 'Почему промпт долго собирается?', status: 'closed', reply: 'Сбор рыночных данных может занять несколько секунд. Если запрос завис — попробуйте повторить через минуту. Возможна временная нагрузка на серверы.' },
  { id: 'TKT-003', date: '24.06.2026', subject: 'Хочу сменить email аккаунта', status: 'closed', reply: 'Смена email пока недоступна в самостоятельном режиме. Напишите нам в Telegram @binum_support с подтверждением личности, и мы изменим данные вручную.' },
  { id: 'TKT-004', date: '01.07.2026', subject: 'Купил 100 кредитов — как активировать?', status: 'closed', reply: 'После оплаты кредиты начисляются автоматически в течение 5 минут. Если этого не произошло, пришлите чек об оплате в поддержку.' },
  { id: 'TKT-005', date: '07.07.2026', subject: 'Хочу вернуть деньги за кредиты', status: 'closed', reply: 'Возврат средств возможен в течение 3 дней с момента покупки при условии, что купленные кредиты не были использованы. Заявка на возврат рассмотрена — средства возвращены.' },
  { id: 'TKT-006', date: '10.07.2026', subject: 'Почему в данных есть оценка SELL?', status: 'closed', reply: 'Оценки индикаторов описывают состояние рынка в момент запроса и не являются торговой рекомендацией. Итоговый промпт предназначен для самостоятельного анализа.' },
  { id: 'TKT-007', date: '15.07.2026', subject: 'Не отображается график в промпте', status: 'closed', reply: 'Попробуйте обновить страницу. Если проблема повторяется — очистите кеш браузера (Ctrl+Shift+Del). Графики загружаются динамически и могут не отображаться при слабом соединении.' },
  { id: 'TKT-008', date: '18.07.2026', subject: 'Вопрос по партнёрской программе — задержка выплаты', status: 'closed', reply: 'Ваш вопрос решён. Выплата произведена согласно условиям. Следующая автоматическая выплата — каждый понедельник.' },
  { id: 'TKT-009', date: '22.07.2026', subject: 'Хочу купить кредиты — как оплатить криптой?', status: 'answered', reply: 'Для оплаты в USDT (TRC-20) нажмите «Купить кредиты» и выберите способ оплаты «Криптовалюта». Адрес кошелька для перевода будет отображён автоматически.' },
  { id: 'TKT-010', date: '25.07.2026', subject: 'Не могу войти в аккаунт — забыл пароль', status: 'answered', reply: 'Письмо для сброса пароля отправлено на ваш email. Проверьте папку «Спам», если письмо не пришло в течение 5 минут.' },
  { id: 'TKT-011', date: '28.07.2026', subject: 'Можно ли использовать Trading Prompt на мобильном?', status: 'answered', reply: 'Да, сервис полностью адаптирован для мобильных устройств. Откройте сайт в браузере на смартфоне — всё работает без установки приложения.' },
  { id: 'TKT-012', date: '01.08.2026', subject: 'Сколько промптов можно собрать?', status: 'answered', reply: 'Каждый готовый промпт списывает один кредит. Ограничений по времени нет, пока на балансе остаются кредиты.' },
  { id: 'TKT-013', date: '05.08.2026', subject: 'Где посмотреть историю промптов?', status: 'open', reply: '' },
  { id: 'TKT-014', date: '08.08.2026', subject: 'Когда появится история промптов?', status: 'open', reply: '' },
  { id: 'TKT-015', date: '11.08.2026', subject: 'Хочу изменить реферальную ссылку', status: 'open', reply: '' },
]

export default function SupportPage({ onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<'support' | 'history'>('support')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [tickets, setTickets] = useState(MOCK_TICKETS)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    const newTicket = {
      id: `TKT-00${tickets.length + 1}`,
      date: new Date().toLocaleDateString('ru-RU').split('.').map((v, i) => i === 2 ? v.slice(-4) : v.padStart(2, '0')).join('.'),
      subject: subject.trim(),
      status: 'open',
      reply: '',
    }
    setTickets(prev => [...prev, newTicket])
    setSubject('')
    setBody('')
    setSent(true)
    setTimeout(() => setSent(false), 3500)
  }

  const statusLabel: Record<string, string> = { open: 'Открыт', answered: 'Отвечен', closed: 'Закрыт' }
  const statusDot: Record<string, string> = { open: '#9A98B5', answered: '#CFCDE3', closed: '#676582' }
  const supportMenuItems = [
    {
      id: 'support' as const,
      label: 'Поддержка',
      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 0 1 12 0v3a2 2 0 0 1-2 2h-1V8h3M2 8v5H1a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1ZM11 13c0 1-1 1.5-3 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    {
      id: 'history' as const,
      label: 'История запросов',
      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5V1.8M2.5 1.8H5.2M2.5 1.8l2.1 2.1A5.5 5.5 0 1 1 2 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 5v3.3l2.2 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
  ]

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#191926',
    border: '1px solid #34344F',
    borderRadius: '7px', padding: '10px 14px',
    color: '#EDEBFA', fontSize: '14px',
    fontFamily: 'Inter, sans-serif', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box', resize: 'none' as const,
  }

  return (
    <div className="message-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0B0B12', overflow: 'hidden' }}>

      {/* Header */}
      <PageHeader
        icon={<svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M8 11v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M6 6.5C6 5.4 6.9 4.5 8 4.5s2 .9 2 2c0 1-.6 1.5-1.3 2-.5.3-.7.7-.7 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
        title="Поддержка и контакты"
        description="Мы отвечаем в течение 2 часов"
        onClose={onClose}
      />

      <div className="support-mobile-tabs" style={{ display: 'none', flexShrink: 0, padding: '8px 14px', gap: '8px', background: '#12121C', borderBottom: '1px solid #191926' }}>
        {supportMenuItems.map(item => {
          const active = section === item.id
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              style={{ flex: 1, minWidth: 0, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '0 10px', background: active ? 'rgba(139,124,255,0.16)' : 'transparent', border: `1px solid ${active ? 'rgba(139,124,255,0.35)' : 'transparent'}`, borderRadius: '6px', color: active ? '#B9AFFF' : '#7C7A98', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: active ? 600 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div className="support-sidebar" style={{ width: 210, flexShrink: 0, background: '#12121C', borderRight: '1px solid #191926', display: 'flex', flexDirection: 'column' }}>
          <nav style={{ padding: '10px 8px', flex: 1 }}>
            {supportMenuItems.map(item => {
              const active = section === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  style={{ width: '100%', height: 40, display: 'flex', alignItems: 'center', gap: '9px', padding: '0 11px', background: active ? 'rgba(139,124,255,0.10)' : 'transparent', border: `1px solid ${active ? 'rgba(139,124,255,0.35)' : 'transparent'}`, borderRadius: '6px', color: active ? '#B9AFFF' : '#9A98B5', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: active ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s, color 0.15s', marginBottom: '3px' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#0F0F19'; e.currentTarget.style.color = '#8B7CFF' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9A98B5' } }}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="scrollable page-body support-body" style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', boxSizing: 'border-box', minWidth: 0 }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {section === 'support' && (<>

          {/* Block 1: Контакты */}
          <div className="support-card" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg, rgba(76,201,240,0.12) 0%, #12121C 48%)', border: '1px solid rgba(76,201,240,0.35)', borderRadius: '10px', padding: '24px 28px' }}>
            <div style={{ position: 'absolute', top: -90, right: -60, width: 230, height: 230, borderRadius: '50%', background: 'rgba(139,124,255,0.055)', pointerEvents: 'none' }} />
            <div className="support-contacts-header" style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '7px', color: '#8EDDF7', fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <span style={{ width: 16, height: 1, background: '#4CC9F0' }} />
                  На связи
                </div>
                <h2 style={{ margin: '0 0 5px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '19px', color: '#EDEBFA' }}>Контакты поддержки</h2>
                <p style={{ margin: 0, maxWidth: 520, fontSize: '12px', color: '#7C7A98', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>Выберите удобный способ связи или скопируйте контакт одним нажатием.</p>
              </div>
              <div className="support-contact-status" style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', background: 'rgba(76,201,240,0.12)', border: '1px solid rgba(76,201,240,0.35)', borderRadius: '6px', color: '#8EDDF7', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CC9F0', boxShadow: '0 0 10px rgba(76,201,240,0.35)' }} />
                Ответ до 2 часов
              </div>
            </div>

            <div className="support-contacts-grid" style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
              {[
                {
                  label: 'Email', value: 'support@binum.ai', sub: 'Для подробных обращений',
                  icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                },
                {
                  label: 'Telegram', value: '@binum_support', sub: 'Оперативная связь',
                  icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M14.5 2.5L1.5 7.5c-.4.17-.4.67 0 .83l2.8 1.04 1.1 3.37c.1.33.53.43.77.18l1.56-1.5 2.87 2.1c.3.2.7.05.78-.3L14.9 3c.1-.45-.33-.8-.4-.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
                },
                {
                  label: 'Сайт', value: 'binum.ai', sub: 'Работаем 9–21 МСК',
                  icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><ellipse cx="8" cy="8" rx="2.5" ry="6" stroke="currentColor" strokeWidth="1.1"/><path d="M2 8h12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
                },
              ].map(contact => (
                <div key={contact.label} style={{ minWidth: 0, background: '#191926', border: '1px solid #242436', borderRadius: '9px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '13px', transition: 'background 0.15s, border-color 0.15s, transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(76,201,240,0.12)'; e.currentTarget.style.borderColor = 'rgba(76,201,240,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#191926'; e.currentTarget.style.borderColor = '#242436'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '8px', flexShrink: 0, background: 'rgba(76,201,240,0.12)', border: '1px solid rgba(76,201,240,0.35)', color: '#4CC9F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {contact.icon}
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#676582', textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: 'Inter, sans-serif' }}>{contact.label}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 500, color: '#CFCDE3', wordBreak: 'break-all', lineHeight: 1.35 }}>{contact.value}</div>
                    <div style={{ marginTop: '4px', fontSize: '10px', color: '#676582', fontFamily: 'Inter, sans-serif' }}>{contact.sub}</div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Скопировать ${contact.label}`}
                    title={`Скопировать ${contact.value}`}
                    onClick={() => navigator.clipboard.writeText(contact.value).catch(() => {})}
                    style={{ width: '100%', height: 32, background: '#12121C', border: '1px solid #2E2E46', borderRadius: '6px', color: '#9A98B5', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'background 0.15s, border-color 0.15s, color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(76,201,240,0.12)'; e.currentTarget.style.borderColor = 'rgba(76,201,240,0.35)'; e.currentTarget.style.color = '#8EDDF7' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#12121C'; e.currentTarget.style.borderColor = '#2E2E46'; e.currentTarget.style.color = '#9A98B5' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M9 4V2.5A1.5 1.5 0 0 0 7.5 1h-5A1.5 1.5 0 0 0 1 2.5v5A1.5 1.5 0 0 0 2.5 9H4" stroke="currentColor" strokeWidth="1.2"/></svg>
                    Скопировать
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Block 2: Создать тикет */}
          <div className="support-card" style={{ background: '#12121C', border: '1px solid #191926', borderRadius: '8px', padding: '28px 32px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 4px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '17px', color: '#EDEBFA' }}>Создать тикет</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#676582', fontFamily: 'Inter, sans-serif' }}>Опишите вашу проблему — мы ответим в течение 2 часов</p>
            </div>
            {sent ? (
              <div style={{ padding: '16px 20px', background: '#0F0F19', border: '1px solid #191926', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#9A98B5" strokeWidth="1.4"/><path d="M5.5 9.5l2.5 2.5 4.5-5" stroke="#9A98B5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: '14px', color: '#EDEBFA', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Тикет отправлен. Ответим в течение 2 часов.</span>
              </div>
            ) : (
              <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#7C7A98', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px', fontFamily: 'Inter, sans-serif' }}>Тема</label>
                  <input className="support-input" type="text" placeholder="Кратко опишите вопрос" value={subject} onChange={e => setSubject(e.target.value)} required style={{ ...inputStyle, height: 44 }}
                    onFocus={e => { e.target.style.borderColor = '#8B7CFF'; e.target.style.boxShadow = 'none' }}
                    onBlur={e => { e.target.style.borderColor = '#34344F'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#7C7A98', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px', fontFamily: 'Inter, sans-serif' }}>Сообщение</label>
                  <textarea className="support-input" rows={5} placeholder="Подробно опишите проблему или вопрос..." value={body} onChange={e => setBody(e.target.value)} required style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#8B7CFF'; e.currentTarget.style.boxShadow = 'none' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#34344F'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={{
                    height: 44, padding: '0 36px',
                    background: '#8B7CFF', border: '1px solid #8B7CFF', borderRadius: '7px',
                    color: '#0D0A24', fontSize: '14px', fontWeight: 700,
                    fontFamily: 'Outfit, sans-serif', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'background 0.15s, border-color 0.15s, color 0.15s', letterSpacing: '0.02em',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#A194FF'; e.currentTarget.style.borderColor = '#A194FF' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#8B7CFF'; e.currentTarget.style.borderColor = '#8B7CFF' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 6-12 6V8l8-1-8-1V1z" fill="currentColor"/></svg>
                    Отправить тикет
                  </button>
                </div>
              </form>
            )}
          </div>

          </>)}

          {section === 'history' && (<>
          {/* Block 3: История тикетов */}
          <div className="support-card" style={{ background: '#12121C', border: '1px solid #191926', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="support-tickets-hdr" style={{ padding: '18px 28px', borderBottom: '1px solid #0F0F19', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '17px', color: '#EDEBFA' }}>История тикетов</h2>
              <span style={{ fontSize: '12px', color: '#676582', fontFamily: 'Inter, sans-serif' }}>{tickets.length} обращений</span>
            </div>

            {/* Table header */}
            <div className="support-tbl-hdr" style={{
              display: 'grid', gridTemplateColumns: '90px 1fr 110px 100px 28px',
              padding: '9px 28px', background: '#0F0F19',
              borderBottom: '1px solid #191926', flexShrink: 0,
            }}>
              {['Номер', 'Тема', 'Дата', 'Статус', ''].map(h => (
                <span key={h} style={{ fontSize: '10px', fontWeight: 600, color: '#676582', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif' }}>{h}</span>
              ))}
            </div>

            {/* Scrollable rows */}
            <div className="scrollable" style={{ maxHeight: 340, overflowY: 'auto' }}>
              {tickets.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#676582', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>Обращений пока нет</div>
              ) : (
                tickets.slice().reverse().map((t, i, arr) => (
                  <div key={t.id}>
                    <div
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      className="support-tbl-row"
                      style={{
                        display: 'grid', gridTemplateColumns: '90px 1fr 110px 100px 28px',
                        padding: '13px 28px', alignItems: 'center',
                        borderBottom: i < arr.length - 1 || expandedId === t.id ? '1px solid #0F0F19' : 'none',
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0F0F19' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span className="support-tbl-num" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#676582' }}>{t.id}</span>
                      <span style={{ fontSize: '13px', color: '#CFCDE3', fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '16px' }}>{t.subject}</span>
                      <span className="support-tbl-date" style={{ fontSize: '12px', color: '#676582', fontFamily: 'JetBrains Mono, monospace' }}>{t.date}</span>
                      <span className="support-tbl-status" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: statusDot[t.status], fontFamily: 'Inter, sans-serif' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusDot[t.status], flexShrink: 0 }} />
                        {statusLabel[t.status]}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#676582', transition: 'transform 0.15s', transform: expandedId === t.id ? 'rotate(180deg)' : 'rotate(0deg)', justifySelf: 'end' }}>
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    {expandedId === t.id && (
                      <div style={{ padding: '14px 28px 16px', background: '#0F0F19', borderBottom: i < arr.length - 1 ? '1px solid #191926' : 'none' }}>
                        <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 600, color: '#676582', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif' }}>Ответ поддержки</p>
                        {t.reply
                          ? <p style={{ margin: 0, fontSize: '13px', color: '#9A98B5', fontFamily: 'Inter, sans-serif', lineHeight: 1.7 }}>{t.reply}</p>
                          : <p style={{ margin: 0, fontSize: '13px', color: '#676582', fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>Ожидает ответа...</p>
                        }
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          </>)}

        </div>
      </div>
      </div>
    </div>
  )
}
