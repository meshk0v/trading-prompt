import type { CSSProperties } from 'react'
import { INDICATOR_GROUPS } from '../../../data/promptSettings'
import { useI18n } from '../../../i18n/context'
import { Checkbox, TabHeader } from './shared'
import type { ToggleSet } from './useToggleSet'

const ALL_INDICATORS = INDICATOR_GROUPS.flatMap(group => group.indicators)

/** Technical indicators to include in the prompt (all enabled by default). */
export default function IndicatorsTab({ selection: { isOn, setMany } }: { selection: ToggleSet }) {
  const { t } = useI18n()

  const enabledCount = ALL_INDICATORS.filter(indicator => isOn(indicator.id)).length
  const allEnabled = enabledCount === ALL_INDICATORS.length

  return (
    <div className="settings-tab">
      <TabHeader
        title={t('Технические индикаторы')}
        active={enabledCount}
        total={ALL_INDICATORS.length}
        actionLabel={allEnabled ? t('Снять все') : t('Выбрать все')}
        onAction={() => setMany(ALL_INDICATORS.map(indicator => indicator.id), !allEnabled)}
      />

      <div className="indicator-table__columns">
        <div />
        <div />
        <span>{t('Индикатор')}</span>
        <span className="indicator-table__purpose">{t('Назначение')}</span>
        <span>{t('Параметры')}</span>
      </div>

      <div className="indicator-table__list">
        {INDICATOR_GROUPS.map(group => {
          const groupEnabled = group.indicators.filter(indicator => isOn(indicator.id)).length
          const allGroupEnabled = groupEnabled === group.indicators.length
          return (
            <div key={group.id} className="indicator-group" style={{ '--group-accent': group.accent } as CSSProperties}>
              <div className="indicator-group__header">
                <div className="indicator-group__title">
                  <span className="indicator-group__marker" />
                  <span className="indicator-group__label">{t(group.label)}</span>
                  <span className="indicator-group__description">{t(group.description)}</span>
                </div>
                <div className="indicator-group__actions">
                  <span>
                    {groupEnabled}/{group.indicators.length}
                  </span>
                  <button type="button" onClick={() => setMany(group.indicators.map(indicator => indicator.id), !allGroupEnabled)}>
                    {allGroupEnabled ? t('Снять') : t('Вкл.')}
                  </button>
                </div>
              </div>

              {group.indicators.map(indicator => {
                const on = isOn(indicator.id)
                const toggle = () => setMany([indicator.id], !on)
                return (
                  <div key={indicator.id} className={`indicator-row${on ? ' is-on' : ''}`} onClick={toggle}>
                    <Checkbox checked={on} onToggle={toggle} />
                    <div className="settings-code">
                      <span>{indicator.code}</span>
                    </div>
                    <span className="indicator-row__name">{indicator.name}</span>
                    <span className="indicator-row__description">{t(indicator.description)}</span>
                    <span className="indicator-row__parameters">{indicator.parameters}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
