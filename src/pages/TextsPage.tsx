import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { saveText } from '../api/texts'
import PageHeader from '../components/PageHeader'
import { useI18n } from '../i18n/context'
import { LONG_TEXTS } from '../i18n/dictionary'
import textSections from '../i18n/textSections.json'
import { defaultText, tr, type TextOverride } from '../i18n/translate'
import './TextsPage.css'

/** Parts of the site, in the order they are listed. Ids come from scripts/check-i18n.mjs. */
const SECTIONS = [
  { id: 'all', label: tr('Все тексты') },
  { id: 'layout', label: tr('Шапка, меню и подвал') },
  { id: 'chat', label: tr('Чат и конструктор') },
  { id: 'guide', label: tr('Обучение') },
  { id: 'auth', label: tr('Вход, регистрация, лимит') },
  { id: 'faq', label: tr('Вопросы и ответы') },
  { id: 'affiliate', label: tr('Партнёрская программа') },
  { id: 'support', label: tr('Поддержка') },
  { id: 'calendar', label: tr('Экономический календарь') },
  { id: 'legal', label: tr('Правовая информация') },
  { id: 'account', label: tr('Аккаунт') },
  { id: 'credits', label: tr('Кредиты') },
  { id: 'prompt-settings', label: tr('Настройки промпта') },
  { id: 'instruments', label: tr('Инструменты') },
  { id: 'common', label: tr('Общие надписи') },
  { id: 'errors', label: tr('Сообщения об ошибках') },
  { id: 'other', label: tr('Прочее') },
  { id: 'outdated', label: tr('Устаревшие правки') },
] as const

type SectionId = (typeof SECTIONS)[number]['id']
type TextEntry = { key: string; section: SectionId }

const PAGE_SIZE = 40
const SECTION_ORDER = new Map<string, number>(SECTIONS.map((section, index) => [section.id, index]))

/** Every editable text of the site, grouped by the part of the site it belongs to. */
const CATALOG: TextEntry[] = (() => {
  const entries = new Map<string, SectionId>()
  for (const key of LONG_TEXTS.greetings) entries.set(key, 'chat')
  for (const key of LONG_TEXTS.legal) entries.set(key, 'legal')
  for (const [key, section] of Object.entries(textSections as Record<string, string>)) {
    if (section === 'admin' || entries.has(key)) continue
    entries.set(key, (SECTION_ORDER.has(section) ? section : 'other') as SectionId)
  }
  return [...entries]
    .map(([key, section]) => ({ key, section }))
    .sort((a, b) => (SECTION_ORDER.get(a.section) ?? 0) - (SECTION_ORDER.get(b.section) ?? 0))
})()
const CATALOG_KEYS = new Set(CATALOG.map(entry => entry.key))

/** `{count}`-style placeholders that the site fills in; they must stay in an edited text. */
function placeholders(text: string): string[] {
  return [...new Set(text.match(/\{\w+\}/g) ?? [])]
}

export default function TextsPage({ onClose }: { onClose: () => void }) {
  const { t, overrides } = useI18n()
  const [section, setSection] = useState<SectionId>('all')
  const [query, setQuery] = useState('')
  const [changedOnly, setChangedOnly] = useState(false)
  const [limit, setLimit] = useState(PAGE_SIZE)

  // Saved changes whose text is no longer in the code (the text was rewritten by a developer).
  const outdated = useMemo<TextEntry[]>(
    () =>
      Object.keys(overrides)
        .filter(key => !CATALOG_KEYS.has(key))
        .map(key => ({ key, section: 'outdated' })),
    [overrides],
  )
  const allEntries = useMemo(() => [...CATALOG, ...outdated], [outdated])

  const counts = useMemo(() => {
    const result: Partial<Record<SectionId, number>> = { all: CATALOG.length }
    for (const entry of allEntries) result[entry.section] = (result[entry.section] ?? 0) + 1
    return result
  }, [allEntries])
  const changedCount = Object.keys(overrides).length
  const visibleSections = SECTIONS.filter(item => item.id === 'all' || counts[item.id])

  // Search what the administrator sees: the text in the code and both edited versions.
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return allEntries.filter(entry => {
      if (section !== 'all' && entry.section !== section) return false
      if (changedOnly && !overrides[entry.key]) return false
      if (!normalized) return true
      const override = overrides[entry.key]
      const haystack = [entry.key, defaultText('en', entry.key), override?.ru, override?.en]
      return haystack.some(text => text?.toLowerCase().includes(normalized))
    })
  }, [allEntries, changedOnly, overrides, query, section])

  useEffect(() => {
    setLimit(PAGE_SIZE)
  }, [section, query, changedOnly])

  const sectionLabel = (id: SectionId) => t(SECTIONS.find(item => item.id === id)?.label ?? '')

  return (
    <div className="texts-page message-fade">
      <PageHeader
        icon={
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 3.5h10M3 8h10M3 12.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        }
        title={t('Тексты сайта')}
        description={t('Изменения появляются на сайте сразу после сохранения')}
        onClose={onClose}
      />

      <div className="texts-page__row">
        <aside className="texts-page__sidebar scrollable">
          <nav>
            {visibleSections.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`texts-section${section === item.id ? ' is-active' : ''}`}
              >
                <span>{t(item.label)}</span>
                <span className="texts-section__count">{counts[item.id] ?? 0}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="texts-page__scroll scrollable">
          <div className="texts-page__main">
            <div className="texts-toolbar">
              <label className="texts-toolbar__search">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="m12.2 12.2 3.3 3.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder={t('Найти текст: вставьте кусок фразы с сайта')}
                />
              </label>

              <select
                className="texts-toolbar__section"
                value={section}
                onChange={event => setSection(event.target.value as SectionId)}
                aria-label={t('Раздел сайта')}
              >
                {visibleSections.map(item => (
                  <option key={item.id} value={item.id}>
                    {t(item.label)} ({counts[item.id] ?? 0})
                  </option>
                ))}
              </select>

              <label className="texts-toolbar__toggle">
                <input type="checkbox" checked={changedOnly} onChange={event => setChangedOnly(event.target.checked)} />
                {t('Только изменённые ({count})', { count: changedCount })}
              </label>
            </div>

            <p className="texts-page__hint">
              {t(
                'У каждого текста два варианта: русский и английский. Пустое поле — вернётся исходный текст. Фрагменты в фигурных скобках, например {count}, сайт заменяет числами и именами — их нужно оставить. Сохранить: кнопка или Ctrl+Enter.',
              )}
            </p>

            {filtered.length === 0 && <div className="texts-page__empty">{t('Ничего не найдено')}</div>}

            <div className="texts-list">
              {filtered.slice(0, limit).map(entry => (
                <TextEditor
                  key={entry.key}
                  textKey={entry.key}
                  override={overrides[entry.key]}
                  sectionLabel={section === 'all' || query ? sectionLabel(entry.section) : null}
                  shared={entry.section === 'common'}
                  outdated={entry.section === 'outdated'}
                />
              ))}
            </div>

            {filtered.length > limit && (
              <button type="button" className="texts-page__more" onClick={() => setLimit(value => value + PAGE_SIZE)}>
                {t('Показать ещё ({count})', { count: filtered.length - limit })}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

type TextEditorProps = {
  textKey: string
  override: TextOverride | undefined
  /** Shown when texts of several parts of the site are listed together. */
  sectionLabel: string | null
  /** The text is used in several places, so a change shows up everywhere. */
  shared: boolean
  /** The text is no longer in the code: the change can only be deleted. */
  outdated: boolean
}

type SaveState = { status: 'idle' | 'saving' | 'saved' } | { status: 'error'; message: string }

function TextEditor({ textKey, override, sectionLabel, shared, outdated }: TextEditorProps) {
  const { t, setOverride } = useI18n()
  const defaults = useMemo(() => ({ ru: textKey, en: defaultText('en', textKey) }), [textKey])
  const saved = useMemo(
    () => ({ ru: override?.ru ?? defaults.ru, en: override?.en ?? defaults.en }),
    [defaults, override],
  )
  const [draft, setDraft] = useState(saved)
  const [state, setState] = useState<SaveState>({ status: 'idle' })

  // A save from another tab or a reset brings the fields up to date.
  useEffect(() => {
    setDraft(saved)
  }, [saved])

  const dirty = draft.ru !== saved.ru || draft.en !== saved.en
  const required = placeholders(textKey)
  const missing = (['ru', 'en'] as const).flatMap(language =>
    draft[language].trim() ? required.filter(item => !draft[language].includes(item)) : [],
  )

  const store = async (ru: string | null, en: string | null) => {
    setState({ status: 'saving' })
    try {
      const result = await saveText(textKey, ru, en)
      setOverride(textKey, result.ru === null && result.en === null ? null : { ru: result.ru, en: result.en })
      setState({ status: 'saved' })
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Ошибка сервера' })
    }
  }

  // Only differences from the code are stored; an empty field also means "the text from the code".
  const save = () => {
    if (!dirty || missing.length || state.status === 'saving') return
    const value = (language: 'ru' | 'en') =>
      draft[language].trim() && draft[language] !== defaults[language] ? draft[language] : null
    void store(value('ru'), value('en'))
  }

  const reset = () => {
    setDraft(defaults)
    void store(null, null)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) save()
  }

  return (
    <article className={`text-editor${override ? ' is-changed' : ''}${dirty ? ' is-dirty' : ''}`}>
      <div className="text-editor__meta">
        {sectionLabel && <span className="text-editor__section">{sectionLabel}</span>}
        {override && !outdated && <span className="text-editor__badge">{t('Изменён')}</span>}
        {shared && <span className="text-editor__note">{t('Используется в нескольких местах сайта')}</span>}
        {outdated && (
          <span className="text-editor__note">
            {t('Этого текста больше нет в коде сайта, правка не показывается. Её можно удалить.')}
          </span>
        )}
      </div>

      <div className="text-editor__fields">
        {(['ru', 'en'] as const).map(language => (
          <label key={language} className="text-editor__field">
            <span className="text-editor__language">{language === 'ru' ? t('Русский') : t('Английский')}</span>
            <AutoSizeTextarea
              value={draft[language]}
              placeholder={defaults[language]}
              readOnly={outdated}
              onChange={value => {
                setDraft(current => ({ ...current, [language]: value }))
                setState({ status: 'idle' })
              }}
              onKeyDown={handleKeyDown}
            />
            {override?.[language] != null && !outdated && (
              <span className="text-editor__original">
                {t('Исходный текст:')} {defaults[language]}
              </span>
            )}
          </label>
        ))}
      </div>

      {(dirty || override || state.status !== 'idle') && (
        <div className="text-editor__actions">
          {missing.length > 0 && (
            <span className="text-editor__message is-error">
              {t('Верните в текст: {items}', { items: missing.join(', ') })}
            </span>
          )}
          {state.status === 'saved' && !dirty && <span className="text-editor__message">{t('Сохранено')}</span>}
          {state.status === 'error' && <span className="text-editor__message is-error">{t(state.message)}</span>}

          {dirty && !outdated && (
            <button type="button" className="text-editor__button" onClick={() => setDraft(saved)}>
              {t('Отменить')}
            </button>
          )}
          {override && !dirty && (
            <button type="button" className="text-editor__button" onClick={reset} disabled={state.status === 'saving'}>
              {outdated ? t('Удалить') : t('Вернуть исходный')}
            </button>
          )}
          {(dirty || state.status === 'saving') && !outdated && (
            <button
              type="button"
              className="text-editor__button text-editor__button--primary"
              onClick={save}
              disabled={missing.length > 0 || state.status === 'saving'}
            >
              {state.status === 'saving' ? t('Сохранение…') : t('Сохранить')}
            </button>
          )}
        </div>
      )}
    </article>
  )
}

type AutoSizeTextareaProps = {
  value: string
  placeholder: string
  readOnly: boolean
  onChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent) => void
}

/** A textarea that grows with its text, so long texts can be read without scrolling inside it. */
function AutoSizeTextarea({ value, placeholder, readOnly, onChange, onKeyDown }: AutoSizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const textarea = ref.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight + 2}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      onChange={event => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      className="text-editor__textarea"
    />
  )
}
