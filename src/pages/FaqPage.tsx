import { Fragment, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { FAQ_CATEGORIES, FAQ_ITEMS, type FaqAction, type FaqCategory } from '../data/faq'
import { useI18n } from '../i18n/context'
import './FaqPage.css'

type CategoryFilter = 'Все' | FaqCategory

type FaqPageProps = {
  onClose: () => void
  user: object | null
  onSignUp: () => void
  onNavigate: (id: string) => void
  onOpenSettings: (section: string) => void
  initialCategory?: CategoryFilter
}

const ALL_CATEGORIES: CategoryFilter[] = ['Все', ...FAQ_CATEGORIES]

function QuestionIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2.2-2.5 4M12 17v.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Wraps matches of the search query in <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const normalized = query.trim()
  if (!normalized) return <>{text}</>
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return (
    <>
      {text.split(new RegExp(`(${escaped})`, 'gi')).map((part, index) =>
        part.toLowerCase() === normalized.toLowerCase() ? <mark key={index}>{part}</mark> : <Fragment key={index}>{part}</Fragment>,
      )}
    </>
  )
}

export default function FaqPage({ onClose, user, onSignUp, onNavigate, onOpenSettings, initialCategory = 'Все' }: FaqPageProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>(initialCategory)
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null)

  const categoryCounts = useMemo(
    () => Object.fromEntries(FAQ_CATEGORIES.map(item => [item, FAQ_ITEMS.filter(faq => faq.category === item).length])),
    [],
  )

  // Search the texts the user actually sees (in the current language).
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return FAQ_ITEMS.filter(item => {
      const matchesCategory = category === 'Все' || item.category === category
      const matchesQuery = !normalized || `${t(item.question)} ${t(item.answer)}`.toLowerCase().includes(normalized)
      return matchesCategory && matchesQuery
    })
  }, [category, query, t])

  // Open the first matching answer whenever the filter changes.
  useEffect(() => {
    setOpenId(filteredItems[0]?.id ?? null)
  }, [filteredItems])

  useEffect(() => {
    setCategory(initialCategory)
  }, [initialCategory])

  const runAction = (action: FaqAction) => {
    if (action.type === 'signup') {
      if (!user) onSignUp()
      return
    }
    if (action.type === 'settings') {
      if (user) onOpenSettings(action.target ?? 'account')
      else onSignUp()
      return
    }
    onNavigate(action.target ?? 'support')
  }

  return (
    <div className="faq-page">
      <div className="faq-page__header">
        <button type="button" onClick={onClose} className="faq-page__back" aria-label={t('Вернуться назад')}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m10 3-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="faq-page__header-icon">
          <QuestionIcon />
        </div>
        <div>
          <div className="faq-page__header-title">{t('Вопросы и ответы')}</div>
          <div className="faq-page__header-subtitle">{t('Помощь по работе с Trading Prompt')}</div>
        </div>
      </div>

      <div className="faq-page__row">
        <aside className="faq-page__sidebar">
          <nav>
            {ALL_CATEGORIES.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`faq-category${category === item ? ' is-active' : ''}`}
              >
                <span>{t(item)}</span>
                <span className="faq-category__count">{item === 'Все' ? FAQ_ITEMS.length : categoryCounts[item]}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="faq-page__scroll scrollable">
          <main className="faq-page__main">
            <section className="faq-hero">
              <div className="faq-hero__glow" />
              <div className="faq-hero__icon">
                <QuestionIcon size={23} />
              </div>
              <div className="faq-hero__eyebrow">{t('FAQ · {count} ответов', { count: FAQ_ITEMS.length })}</div>
              <h1 className="faq-hero__title">{t('Частые вопросы')}</h1>
              <p className="faq-hero__text">
                {t('Короткие ответы о промптах, AI-анализе, оплате, партнёрской программе и безопасности аккаунта.')}
              </p>

              <label className="faq-search">
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="m12.2 12.2 3.3 3.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder={t('Найти вопрос или ответ')}
                  className="faq-search__input"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="faq-search__clear" aria-label={t('Очистить поиск')}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="m2 2 8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </label>

              <div className="faq-category-select">
                <select
                  value={category}
                  onChange={event => setCategory(event.target.value as CategoryFilter)}
                  aria-label={t('Категория вопросов')}
                >
                  {ALL_CATEGORIES.map(item => (
                    <option key={item} value={item}>
                      {t(item)}
                    </option>
                  ))}
                </select>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="m2.5 4.5 3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </section>

            <section aria-label={t('Список вопросов')} className="faq-list">
              {filteredItems.length > 0 ? (
                <div className="faq-list__items">
                  {filteredItems.map((item, index) => {
                    const isOpen = openId === item.id
                    const action = item.action && !(user && item.action.type === 'signup') ? item.action : null
                    return (
                      <div
                        key={item.id}
                        className={`faq-item${isOpen ? ' is-open' : ''}`}
                        style={{ '--appear-delay': `${Math.min(index, 7) * 35}ms` } as CSSProperties}
                      >
                        <button type="button" onClick={() => setOpenId(isOpen ? null : item.id)} className="faq-item__question" aria-expanded={isOpen}>
                          <span className="faq-item__number">{String(index + 1).padStart(2, '0')}</span>
                          <span className="faq-item__text">
                            <Highlight text={t(item.question)} query={query} />
                          </span>
                          <span className="faq-item__toggle">
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="faq-item__answer">
                            <span className="faq-item__line" aria-hidden="true" />
                            <div>
                              <p>
                                <Highlight text={t(item.answer)} query={query} />
                              </p>
                              {action && (
                                <button type="button" onClick={() => runAction(action)} className="faq-item__action">
                                  {t(action.label)}
                                  <span aria-hidden="true">→</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="faq-empty">
                  <div className="faq-empty__icon">
                    <QuestionIcon />
                  </div>
                  <h2>{t('Ничего не найдено')}</h2>
                  <p>{t('Попробуйте изменить запрос или напишите нашей команде.')}</p>
                  <button type="button" onClick={() => onNavigate('support')}>
                    {t('Открыть поддержку →')}
                  </button>
                </div>
              )}
            </section>

            <section className="faq-cta">
              <div>
                <div className="faq-cta__title">{t('Не нашли ответ?')}</div>
                <p className="faq-cta__text">
                  {user
                    ? t('Опишите вопрос команде поддержки — мы поможем разобраться.')
                    : t('Попробуйте сервис бесплатно или задайте вопрос в Telegram.')}
                </p>
              </div>
              <div className="faq-cta__actions">
                <button type="button" onClick={() => (user ? onNavigate('support') : onSignUp())} className="faq-cta__primary">
                  {user ? t('Написать в поддержку') : t('Попробовать бесплатно')}
                </button>
                <a href="https://t.me/binum_support" target="_blank" rel="noreferrer" className="faq-cta__telegram">
                  @binum_support
                </a>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
