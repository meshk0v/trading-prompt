import { useState } from 'react'
import { useI18n } from '../../../i18n/context'

/** Small square checkbox used in the prompt settings lists. */
export function Checkbox({ checked, onToggle, small }: { checked: boolean; onToggle: () => void; small?: boolean }) {
  return (
    <div
      className={`settings-checkbox${checked ? ' is-checked' : ''}${small ? ' settings-checkbox--small' : ''}`}
      onClick={event => {
        event.stopPropagation()
        onToggle()
      }}
    >
      {checked &&
        (small ? (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path d="M1 4L3 6L7 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ))}
    </div>
  )
}

type TabHeaderProps = {
  title: string
  active: number
  total: number
  actionLabel: string
  onAction: () => void
  /** Outlined button (watchlist) instead of the filled one. */
  outlinedAction?: boolean
}

/** Title with an "active N of M" counter and a bulk action button. */
export function TabHeader({ title, active, total, actionLabel, onAction, outlinedAction }: TabHeaderProps) {
  const { t } = useI18n()
  return (
    <div className="settings-tab__header">
      <div>
        <div className="settings-tab__title">{title}</div>
        <div className="settings-tab__counter">
          {t('Активно:')} <span>{active}</span> {t('из')} {total}
        </div>
      </div>
      <button type="button" onClick={onAction} className={outlinedAction ? 'settings-reset-button' : 'settings-bulk-button'}>
        {actionLabel}
      </button>
    </div>
  )
}

/** On/off state for a list of ids; everything starts enabled. */
export function useToggleSet() {
  const [disabled, setDisabled] = useState<Record<string, boolean>>({})
  return {
    isOn: (id: string) => !disabled[id],
    setMany: (ids: string[], on: boolean) => setDisabled(current => ({ ...current, ...Object.fromEntries(ids.map(id => [id, !on])) })),
  }
}

export type ToggleSet = ReturnType<typeof useToggleSet>
