import type { CSSProperties } from 'react'
import { FUNDAMENTAL_GROUPS } from '../../../data/promptSettings'
import { useI18n } from '../../../i18n/context'
import { Checkbox, TabHeader } from './shared'
import type { ToggleSet } from '../../../hooks/useToggleSet'

const ALL_ITEMS = FUNDAMENTAL_GROUPS.flatMap(group => group.items)

/** Fundamental data sources to include in the prompt (all enabled by default). */
export default function FundamentalsTab({ selection: { isOn, setMany } }: { selection: ToggleSet }) {
  const { t } = useI18n()

  const enabledCount = ALL_ITEMS.filter(item => isOn(item.id)).length
  const allEnabled = enabledCount === ALL_ITEMS.length

  return (
    <div className="settings-tab">
      <TabHeader
        title={t('Фундаментальный анализ')}
        active={enabledCount}
        total={ALL_ITEMS.length}
        actionLabel={allEnabled ? t('Снять все') : t('Выбрать все')}
        onAction={() =>
          setMany(
            ALL_ITEMS.map(item => item.id),
            !allEnabled,
          )
        }
      />

      <div className="fundamental-list">
        {FUNDAMENTAL_GROUPS.map(group => {
          const groupEnabled = group.items.filter(item => isOn(item.id)).length
          const allGroupEnabled = groupEnabled === group.items.length
          return (
            <div
              key={group.id}
              className="fundamental-group"
              style={{ '--group-accent': group.accent } as CSSProperties}
            >
              <div className="fundamental-group__header">
                <div className="fundamental-group__heading">
                  <div className="fundamental-group__title">
                    <span className="fundamental-group__marker" />
                    <span className="fundamental-group__label">{t(group.label)}</span>
                    <span className="fundamental-group__count">
                      {groupEnabled}/{group.items.length}
                    </span>
                  </div>
                  <div className="fundamental-group__description">{t(group.description)}</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setMany(
                      group.items.map(item => item.id),
                      !allGroupEnabled,
                    )
                  }
                >
                  {allGroupEnabled ? t('Снять') : t('Вкл.')}
                </button>
              </div>
              <div className="fundamental-group__items">
                {group.items.map(item => {
                  const on = isOn(item.id)
                  const toggle = () => setMany([item.id], !on)
                  return (
                    <div key={item.id} className={`fundamental-item${on ? ' is-on' : ''}`} onClick={toggle}>
                      <Checkbox checked={on} onToggle={toggle} />
                      <div className="settings-code settings-code--wide">
                        <span>{item.code}</span>
                      </div>
                      <div className="fundamental-item__text">
                        <div className="fundamental-item__name">{t(item.name)}</div>
                        <div className="fundamental-item__description">{t(item.description)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
