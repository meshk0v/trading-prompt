import { useEffect, useState, type KeyboardEvent } from 'react'
import { saveTerm } from '../api/texts'
import { DEFAULT_TERMS, TERM_FIELDS } from '../data/affiliate'
import { useI18n } from '../i18n/context'

type TermField = (typeof TERM_FIELDS)[number]
type SaveState = { status: 'idle' | 'saving' | 'saved' } | { status: 'error'; message: string }

/** Affiliate program terms: one value, used by the calculator, the program pages and the texts that mention it. */
export default function TermsEditor() {
  const { t } = useI18n()
  return (
    <>
      <p className="texts-page__hint">
        {t(
          'Эти числа сайт подставляет в тексты, калькулятор и условия партнёрской программы. Измените значение один раз, и оно обновится везде. Пустое поле — вернётся значение по умолчанию.',
        )}{' '}
        {t('В любом тексте их можно вставить в фигурных скобках, например {rewardPercent}.', {
          // Shown as written: terms fill their placeholders in every text.
          rewardPercent: '{rewardPercent}',
        })}
      </p>
      <div className="texts-list">
        {TERM_FIELDS.map(field => (
          <TermRow key={field.name} field={field} />
        ))}
      </div>
    </>
  )
}

function TermRow({ field }: { field: TermField }) {
  const { t, terms, setTerm } = useI18n()
  const current = String(terms[field.name])
  const defaultValue = String(DEFAULT_TERMS[field.name])
  const [draft, setDraft] = useState(current)
  const [state, setState] = useState<SaveState>({ status: 'idle' })

  // A save from another tab or a reset brings the field up to date.
  useEffect(() => {
    setDraft(current)
  }, [current])

  const dirty = draft.trim() !== current
  const changed = current !== defaultValue

  const store = async (value: string) => {
    setState({ status: 'saving' })
    try {
      const stored = await saveTerm(field.name, value)
      setTerm(field.name, stored)
      setDraft(stored ?? defaultValue)
      setState({ status: 'saved' })
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Ошибка сервера' })
    }
  }

  // Only a difference from the default is stored; an empty field also means "the default".
  const save = () => {
    if (!dirty || state.status === 'saving') return
    const value = draft.trim()
    void store(value === defaultValue ? '' : value)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') save()
  }

  return (
    <article className={`text-editor${changed ? ' is-changed' : ''}${dirty ? ' is-dirty' : ''}`}>
      <div className="text-editor__meta">
        <span className="text-editor__section term-name">{`{${field.name}}`}</span>
        {changed && <span className="text-editor__badge">{t('Изменён')}</span>}
      </div>
      <label className="text-editor__field">
        <span className="text-editor__language">{t(field.label)}</span>
        <input
          className="text-editor__textarea term-input"
          value={draft}
          inputMode={field.kind === 'word' ? 'text' : 'decimal'}
          placeholder={defaultValue}
          onChange={event => {
            setDraft(event.target.value)
            setState({ status: 'idle' })
          }}
          onKeyDown={handleKeyDown}
        />
        <span className="text-editor__original">
          {t(field.hint)} {t('По умолчанию: {value}', { value: defaultValue })}
        </span>
      </label>

      {(dirty || changed || state.status !== 'idle') && (
        <div className="text-editor__actions">
          {state.status === 'saved' && !dirty && <span className="text-editor__message">{t('Сохранено')}</span>}
          {state.status === 'error' && <span className="text-editor__message is-error">{t(state.message)}</span>}

          {dirty && (
            <button type="button" className="text-editor__button" onClick={() => setDraft(current)}>
              {t('Отменить')}
            </button>
          )}
          {changed && !dirty && (
            <button
              type="button"
              className="text-editor__button"
              onClick={() => void store('')}
              disabled={state.status === 'saving'}
            >
              {t('Вернуть по умолчанию')}
            </button>
          )}
          {(dirty || state.status === 'saving') && (
            <button
              type="button"
              className="text-editor__button text-editor__button--primary"
              onClick={save}
              disabled={state.status === 'saving'}
            >
              {state.status === 'saving' ? t('Сохранение…') : t('Сохранить')}
            </button>
          )}
        </div>
      )}
    </article>
  )
}
