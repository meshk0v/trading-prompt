import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import PairFlag from '../../../components/PairFlag'
import { WATCHLIST_GROUPS } from '../../../data/promptSettings'
import { useI18n } from '../../../i18n/context'
import { Checkbox, TabHeader } from './shared'

type WatchlistTabProps = {
  watchlist: string[]
  setWatchlist: Dispatch<SetStateAction<string[]>>
}

const ALL_PAIRS = WATCHLIST_GROUPS.flatMap(group => group.pairs)

/** Currency pairs offered in the prompt builder. */
export default function WatchlistTab({ watchlist, setWatchlist }: WatchlistTabProps) {
  const { t } = useI18n()
  const selectedCount = WATCHLIST_GROUPS.reduce((sum, group) => sum + group.pairs.filter(pair => watchlist.includes(pair)).length, 0)
  const toggle = (pair: string) => setWatchlist(current => (current.includes(pair) ? current.filter(item => item !== pair) : [...current, pair]))

  return (
    <div className="settings-tab settings-tab--watchlist">
      <TabHeader
        title={t('Валютные пары')}
        active={selectedCount}
        total={ALL_PAIRS.length}
        actionLabel={t('Сбросить всё')}
        onAction={() => setWatchlist(current => current.filter(pair => !ALL_PAIRS.includes(pair)))}
        outlinedAction
      />

      <div className="watchlist">
        {WATCHLIST_GROUPS.map(group => {
          const selected = group.pairs.filter(pair => watchlist.includes(pair))
          const allSelected = selected.length === group.pairs.length
          return (
            <div key={group.key} style={{ '--group-accent': group.color } as CSSProperties}>
              <div className="watchlist__group-header">
                <div className="watchlist__group-title">
                  <div className="watchlist__marker" />
                  <span className="watchlist__group-name">{t(group.label)}</span>
                  <span className="watchlist__group-count">
                    {selected.length}/{group.pairs.length}
                  </span>
                </div>
                <button
                  type="button"
                  className="watchlist__group-toggle"
                  onClick={() =>
                    setWatchlist(current =>
                      allSelected
                        ? current.filter(pair => !group.pairs.includes(pair))
                        : [...current, ...group.pairs.filter(pair => !current.includes(pair))],
                    )
                  }
                >
                  {allSelected ? t('Снять все') : t('Выбрать все')}
                </button>
              </div>
              <div className="watchlist__pairs">
                {group.pairs.map(pair => {
                  const on = watchlist.includes(pair)
                  return (
                    <div key={pair} onClick={() => toggle(pair)} className={`watchlist__pair${on ? ' is-on' : ''}`}>
                      <Checkbox checked={on} onToggle={() => toggle(pair)} small />
                      <span className="watchlist__flag">
                        <PairFlag pair={pair} size={13} />
                      </span>
                      <span className="watchlist__pair-name">{pair}</span>
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
