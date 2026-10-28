import { useState, type Dispatch, type SetStateAction } from 'react'
import SectionLayout, { type SectionItem } from '../../../components/SectionLayout'
import { useI18n } from '../../../i18n/context'
import FundamentalsTab from './FundamentalsTab'
import IndicatorsTab from './IndicatorsTab'
import type { ToggleSet } from '../../../hooks/useToggleSet'
import WatchlistTab from './WatchlistTab'
import './PromptSettings.css'

type Tab = 'indicators' | 'fundamental' | 'watchlist'

type PromptSettingsProps = {
  watchlist: string[]
  setWatchlist: Dispatch<SetStateAction<string[]>>
  /** Enabled indicators and fundamentals; kept by App, so the prompt uses them. */
  indicators: ToggleSet
  fundamentals: ToggleSet
}

/** Which data goes into a prompt: indicators, fundamentals and the instrument watchlist. */
export default function PromptSettings({ watchlist, setWatchlist, indicators, fundamentals }: PromptSettingsProps) {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('indicators')

  const tabs: SectionItem<Tab>[] = [
    {
      id: 'indicators',
      label: t('Индикаторы'),
      icon: (
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M1.5 12.5h11M2.5 10l2.4-3 2.2 1.7L11.5 3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="11.5" cy="3" r="1.2" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'fundamental',
      label: t('Фундамент'),
      icon: (
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M2 12V6.5M5.3 12V3.5M8.7 12V8M12 12V1.5M1 12.5h12"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: (
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M7 1.5l1.6 3.2 3.5.5-2.6 2.5.7 3.6L7 9.6 3.8 11.3l.7-3.6L2 5.2l3.5-.5L7 1.5z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ]

  return (
    <SectionLayout items={tabs} active={tab} onChange={setTab} className="prompt-settings">
      <div className="prompt-settings__content">
        {tab === 'indicators' && <IndicatorsTab selection={indicators} />}
        {tab === 'fundamental' && <FundamentalsTab selection={fundamentals} />}
        {tab === 'watchlist' && <WatchlistTab watchlist={watchlist} setWatchlist={setWatchlist} />}
      </div>
    </SectionLayout>
  )
}
