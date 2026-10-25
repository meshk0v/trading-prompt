import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { FAQ_CATEGORIES, FAQ_ITEMS, type FaqAction, type FaqCategory } from '../data/faq'

type FaqPageProps = {
  onClose: () => void
  user: object | null
  onSignUp: () => void
  onNavigate: (id: string) => void
  onOpenSettings: (section: string) => void
  initialCategory?: 'Все' | FaqCategory
  footer?: ReactNode
}

function QuestionIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2.2-2.5 4M12 17v.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  const normalized = query.trim()
  if (!normalized) return <>{text}</>
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === normalized.toLowerCase()
          ? <mark key={`${part}-${index}`} className="rounded-sm bg-accent/20 px-0.5 text-[var(--text)]">{part}</mark>
          : <Fragment key={`${part}-${index}`}>{part}</Fragment>,
      )}
    </>
  )
}

export default function FaqPage({ onClose, user, onSignUp, onNavigate, onOpenSettings, initialCategory = 'Все', footer }: FaqPageProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'Все' | FaqCategory>(initialCategory)
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null)

  const categoryCounts = useMemo(
    () => Object.fromEntries(FAQ_CATEGORIES.map(item => [item, FAQ_ITEMS.filter(faq => faq.category === item).length])),
    [],
  )

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return FAQ_ITEMS.filter(item => {
      const matchesCategory = category === 'Все' || item.category === category
      const matchesQuery = !normalized || `${item.question} ${item.answer}`.toLowerCase().includes(normalized)
      return matchesCategory && matchesQuery
    })
  }, [category, query])

  useEffect(() => {
    setOpenId(filteredItems[0]?.id ?? null)
  }, [category, query])

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <style>{`
        @keyframes faqPageItemIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes faqPageAnswerIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .faq-page-item { animation: faqPageItemIn .35s cubic-bezier(.2,.8,.2,1) both; }
        .faq-page-answer { animation: faqPageAnswerIn .22s cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .faq-page-item, .faq-page-answer { animation: none !important; }
        }
      `}</style>

      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] px-5 py-4 md:px-8">
        <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md border border-[var(--border)] bg-transparent text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]" aria-label="Вернуться назад">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m10 3-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="grid size-10 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-accent">
          <QuestionIcon />
        </div>
        <div>
          <div className="font-['Outfit'] text-xl font-bold">Вопросы и ответы</div>
          <div className="mt-0.5 text-xs text-[var(--muted)]">Помощь по работе с Trading Prompt</div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-[210px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
          <nav className="flex-1 p-2">
            {['Все', ...FAQ_CATEGORIES].map(item => {
              const count = item === 'Все' ? FAQ_ITEMS.length : categoryCounts[item]
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`mb-1 flex h-10 w-full items-center justify-between gap-3 rounded-md border px-3 text-left text-xs font-semibold transition-colors ${category === item ? 'border-accent bg-accent text-[var(--on-accent)]' : 'border-transparent text-[var(--muted)] hover:bg-[var(--card)] hover:text-accent'}`}
                >
                  <span>{item}</span>
                  <span className="font-['JetBrains_Mono'] text-[9px] opacity-70">{count}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="page-body scrollable min-w-0 flex-1 overflow-y-auto">
        <main className="mx-auto w-full max-w-5xl px-5 py-10 md:px-8 md:py-14">
          <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-10 text-center md:px-8 md:py-12">
            <div className="pointer-events-none absolute left-1/2 top-0 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative mx-auto grid size-12 place-items-center rounded-xl border border-accent/25 bg-accent/[0.07] text-accent">
              <QuestionIcon size={23} />
            </div>
            <div className="relative mt-5 text-[10px] font-bold uppercase tracking-[0.17em] text-accent">FAQ · {FAQ_ITEMS.length} ответов</div>
            <h1 className="relative mt-3 font-['Outfit'] text-4xl font-bold tracking-[-0.035em] md:text-5xl">Частые вопросы</h1>
            <p className="relative mx-auto mt-3 max-w-2xl text-sm text-[var(--muted)]">Короткие ответы о промптах, AI-анализе, оплате, партнёрской программе и безопасности аккаунта.</p>

            <label className="relative mx-auto mt-7 flex h-12 max-w-2xl items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-4 text-[var(--muted)] transition-colors focus-within:border-accent">
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="m12.2 12.2 3.3 3.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Найти вопрос или ответ"
                className="h-full min-w-0 flex-1 border-0 bg-transparent font-['Inter'] text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="grid size-7 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]" aria-label="Очистить поиск">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="m2 2 8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </button>
              )}
            </label>

            <div className="relative mx-auto mt-3 max-w-2xl lg:hidden">
              <select
                value={category}
                onChange={event => setCategory(event.target.value)}
                aria-label="Категория вопросов"
                className="h-11 w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-4 pr-11 font-['Inter'] text-sm font-semibold text-[var(--text)] outline-none transition-colors focus:border-accent"
              >
                {['Все', ...FAQ_CATEGORIES].map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="m2.5 4.5 3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </section>

          <div className="mt-8">
            <section aria-label="Список вопросов">
              {filteredItems.length > 0 ? (
                <div className="grid gap-2.5">
                  {filteredItems.map((item, index) => {
                    const isOpen = openId === item.id
                    const showAction = item.action && !(user && item.action.type === 'signup')
                    return (
                      <div
                        key={item.id}
                        className={`faq-page-item overflow-hidden rounded-xl border bg-[var(--card)] transition-colors ${isOpen ? 'border-accent/35' : 'border-[var(--border)] hover:border-[var(--muted3)]'}`}
                        style={{ animationDelay: `${Math.min(index, 7) * 35}ms` }}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenId(isOpen ? null : item.id)}
                          className="group flex w-full items-center gap-4 px-4 py-4 text-left text-[var(--text)] outline-none hover:bg-[var(--surface)] focus-visible:bg-accent/[0.04] md:px-5"
                          aria-expanded={isOpen}
                        >
                          <span className={`grid size-8 shrink-0 place-items-center rounded-lg border font-['JetBrains_Mono'] text-[10px] font-bold ${isOpen ? 'border-accent/35 bg-accent/10 text-accent' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]'}`}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="min-w-0 flex-1 font-['Outfit'] text-sm font-bold md:text-[15px]">
                            <Highlight text={item.question} query={query} />
                          </span>
                          <span className={`grid size-8 shrink-0 place-items-center rounded-full border transition-transform duration-300 ${isOpen ? 'rotate-45 border-accent/35 bg-accent/10 text-accent' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]'}`}>
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="faq-page-answer border-t border-accent/10 bg-accent/[0.018] px-4 py-4 md:px-5">
                            <div className="flex gap-4">
                              <span className="mt-2 h-px w-8 shrink-0 bg-gradient-to-r from-accent/70 to-transparent" aria-hidden="true" />
                              <div>
                                <p className="text-xs leading-6 text-[var(--muted)]"><Highlight text={item.answer} query={query} /></p>
                                {showAction && item.action && (
                                  <button type="button" onClick={() => runAction(item.action!)} className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-accent/30 bg-accent/[0.07] px-3.5 text-xs font-bold text-accent transition-colors hover:bg-accent/10">
                                    {item.action.label}
                                    <span aria-hidden="true">→</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-14 text-center">
                  <div className="mx-auto grid size-11 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"><QuestionIcon /></div>
                  <h2 className="mt-4 font-['Outfit'] text-lg font-bold">Ничего не найдено</h2>
                  <p className="mt-2 text-xs text-[var(--muted)]">Попробуйте изменить запрос или напишите нашей команде.</p>
                  <button type="button" onClick={() => onNavigate('support')} className="mt-5 text-xs font-bold text-accent hover:underline">Открыть поддержку →</button>
                </div>
              )}
            </section>
          </div>

          <section className="mt-10 flex flex-col items-center justify-between gap-5 rounded-2xl border border-accent/20 bg-accent/[0.045] px-5 py-6 sm:flex-row md:px-7">
            <div>
              <div className="font-['Outfit'] text-xl font-bold">Не нашли ответ?</div>
              <p className="mt-1 text-xs text-[var(--muted)]">{user ? 'Опишите вопрос команде поддержки — мы поможем разобраться.' : 'Попробуйте сервис бесплатно или задайте вопрос в Telegram.'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => user ? onNavigate('support') : onSignUp()} className="inline-flex h-10 items-center rounded-md border border-accent bg-accent px-4 font-['Outfit'] text-sm font-bold text-[var(--bg)] transition-colors hover:bg-accent/90">
                {user ? 'Написать в поддержку' : 'Попробовать бесплатно'}
              </button>
              <a href="https://t.me/binum_support" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-xs font-bold text-[var(--text)] no-underline transition-colors hover:border-accent/30 hover:text-accent">
                @binum_support
              </a>
            </div>
          </section>
        </main>
        {footer}
        </div>
      </div>
    </div>
  )
}
