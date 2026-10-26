import { useState, type FormEvent } from 'react'
import PageHeader from '../components/PageHeader'
import SectionLayout, { type SectionItem } from '../components/SectionLayout'
import { DEMO_TICKETS, type SupportTicket, type TicketStatus } from '../data/supportTickets'
import { useI18n } from '../i18n/context'
import { tr } from '../i18n/translate'
import './SupportPage.css'

type Section = 'support' | 'history'

const STATUS_LABELS: Record<TicketStatus, string> = { open: tr('Открыт'), answered: tr('Отвечен'), closed: tr('Закрыт') }

const CONTACTS = [
  {
    label: 'Email',
    value: 'support@binum.ai',
    note: tr('Для подробных обращений'),
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M1.5 6l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Telegram',
    value: '@binum_support',
    note: tr('Оперативная связь'),
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M14.5 2.5L1.5 7.5c-.4.17-.4.67 0 .83l2.8 1.04 1.1 3.37c.1.33.53.43.77.18l1.56-1.5 2.87 2.1c.3.2.7.05.78-.3L14.9 3c.1-.45-.33-.8-.4-.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: tr('Сайт'),
    value: 'binum.ai',
    note: tr('Работаем 9–21 МСК'),
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
        <ellipse cx="8" cy="8" rx="2.5" ry="6" stroke="currentColor" strokeWidth="1.1" />
        <path d="M2 8h12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    ),
  },
]

function todayRu() {
  const now = new Date()
  return [now.getDate(), now.getMonth() + 1].map(part => String(part).padStart(2, '0')).join('.') + `.${now.getFullYear()}`
}

export default function SupportPage({ onClose }: { onClose: () => void }) {
  const { t, language } = useI18n()
  const [section, setSection] = useState<Section>('support')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [newTickets, setNewTickets] = useState<SupportTicket[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const tickets = [...DEMO_TICKETS[language], ...newTickets]

  const sections: SectionItem<Section>[] = [
    {
      id: 'support',
      label: t('Поддержка'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 8a6 6 0 0 1 12 0v3a2 2 0 0 1-2 2h-1V8h3M2 8v5H1a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1ZM11 13c0 1-1 1.5-3 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: t('История запросов'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2.5 4.5V1.8M2.5 1.8H5.2M2.5 1.8l2.1 2.1A5.5 5.5 0 1 1 2 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 5v3.3l2.2 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ]

  const handleSend = (event: FormEvent) => {
    event.preventDefault()
    if (!subject.trim() || !body.trim()) return
    const number = tickets.length + 1
    setNewTickets(previous => [
      ...previous,
      { id: `TKT-${String(number).padStart(3, '0')}`, date: todayRu(), subject: subject.trim(), status: 'open', reply: '' },
    ])
    setSubject('')
    setBody('')
    setSent(true)
    setTimeout(() => setSent(false), 3500)
  }

  return (
    <div className="support-page message-fade">
      <PageHeader
        icon={
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 11v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M6 6.5C6 5.4 6.9 4.5 8 4.5s2 .9 2 2c0 1-.6 1.5-1.3 2-.5.3-.7.7-.7 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        }
        title={t('Поддержка и контакты')}
        description={t('Мы отвечаем в течение 2 часов')}
        onClose={onClose}
      />

      <SectionLayout items={sections} active={section} onChange={setSection}>
        <div className="support-page__body scrollable">
          <div className="support-page__content">
            {section === 'support' && (
              <>
                <div className="support-card support-contacts">
                  <div className="support-contacts__glow" />
                  <div className="support-contacts__header">
                    <div>
                      <div className="support-contacts__eyebrow">
                        <span />
                        {t('На связи')}
                      </div>
                      <h2 className="support-contacts__title">{t('Контакты поддержки')}</h2>
                      <p className="support-contacts__text">{t('Выберите удобный способ связи или скопируйте контакт одним нажатием.')}</p>
                    </div>
                    <div className="support-contacts__status">
                      <span />
                      {t('Ответ до 2 часов')}
                    </div>
                  </div>

                  <div className="support-contacts__grid">
                    {CONTACTS.map(contact => (
                      <div key={contact.value} className="support-contact">
                        <div className="support-contact__top">
                          <div className="support-contact__icon">{contact.icon}</div>
                          <span className="support-contact__label">{t(contact.label)}</span>
                        </div>
                        <div>
                          <div className="support-contact__value">{contact.value}</div>
                          <div className="support-contact__note">{t(contact.note)}</div>
                        </div>
                        <button
                          type="button"
                          className="support-contact__copy"
                          aria-label={t('Скопировать {name}', { name: t(contact.label) })}
                          title={t('Скопировать {name}', { name: contact.value })}
                          onClick={() => navigator.clipboard.writeText(contact.value).catch(() => {})}
                        >
                          <svg width="12" height="12" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                            <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                            <path d="M9 4V2.5A1.5 1.5 0 0 0 7.5 1h-5A1.5 1.5 0 0 0 1 2.5v5A1.5 1.5 0 0 0 2.5 9H4" stroke="currentColor" strokeWidth="1.2" />
                          </svg>
                          {t('Скопировать')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="support-card support-ticket-form">
                  <div className="support-ticket-form__header">
                    <h2>{t('Создать тикет')}</h2>
                    <p>{t('Опишите вашу проблему — мы ответим в течение 2 часов')}</p>
                  </div>
                  {sent ? (
                    <div className="support-ticket-form__sent">
                      <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M5.5 9.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{t('Тикет отправлен. Ответим в течение 2 часов.')}</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSend} className="support-ticket-form__form">
                      <div>
                        <label className="support-ticket-form__label">{t('Тема')}</label>
                        <input
                          className="support-input support-input--single"
                          type="text"
                          placeholder={t('Кратко опишите вопрос')}
                          value={subject}
                          onChange={event => setSubject(event.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="support-ticket-form__label">{t('Сообщение')}</label>
                        <textarea
                          className="support-input"
                          rows={5}
                          placeholder={t('Подробно опишите проблему или вопрос...')}
                          value={body}
                          onChange={event => setBody(event.target.value)}
                          required
                        />
                      </div>
                      <div className="support-ticket-form__actions">
                        <button type="submit" className="support-ticket-form__submit">
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M1 1l12 6-12 6V8l8-1-8-1V1z" fill="currentColor" />
                          </svg>
                          {t('Отправить тикет')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}

            {section === 'history' && (
              <div className="support-card support-tickets">
                <div className="support-tickets__header">
                  <h2>{t('История тикетов')}</h2>
                  <span>{t('{count} обращений', { count: tickets.length })}</span>
                </div>

                <div className="support-tickets__columns">
                  {[t('Номер'), t('Тема'), t('Дата'), t('Статус'), ''].map(heading => (
                    <span key={heading}>{heading}</span>
                  ))}
                </div>

                <div className="support-tickets__list scrollable">
                  {tickets.length === 0 ? (
                    <div className="support-tickets__empty">{t('Обращений пока нет')}</div>
                  ) : (
                    tickets
                      .slice()
                      .reverse()
                      .map(ticket => {
                        const expanded = expandedId === ticket.id
                        return (
                          <div key={ticket.id} className="support-ticket">
                            <div
                              onClick={() => setExpandedId(expanded ? null : ticket.id)}
                              className={`support-ticket__row${expanded ? ' is-expanded' : ''}`}
                            >
                              <span className="support-ticket__number">{ticket.id}</span>
                              <span className="support-ticket__subject">{ticket.subject}</span>
                              <span className="support-ticket__date">{ticket.date}</span>
                              <span className={`support-ticket__status support-ticket__status--${ticket.status}`}>
                                <span />
                                {t(STATUS_LABELS[ticket.status])}
                              </span>
                              <svg className="support-ticket__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </div>
                            {expanded && (
                              <div className="support-ticket__answer">
                                <p className="support-ticket__answer-label">{t('Ответ поддержки')}</p>
                                {ticket.reply ? (
                                  <p className="support-ticket__reply">{ticket.reply}</p>
                                ) : (
                                  <p className="support-ticket__waiting">{t('Ожидает ответа...')}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionLayout>
    </div>
  )
}
