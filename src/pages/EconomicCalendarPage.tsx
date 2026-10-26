import { useI18n } from '../i18n/context'
import './EconomicCalendarPage.css'

const CALENDAR_SETTINGS = {
  colorTheme: 'dark',
  isTransparent: false,
  width: '100%',
  height: '100%',
  importanceFilter: '-1,0,1',
  countryFilter: 'ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu',
}

/** Full-height TradingView economic calendar widget. */
export default function EconomicCalendarPage({ onClose }: { onClose: () => void }) {
  const { t, language } = useI18n()
  const src = `https://s.tradingview.com/embed-widget/events/?locale=${language}#${encodeURIComponent(JSON.stringify(CALENDAR_SETTINGS))}`

  return (
    <div className="calendar-page">
      <div className="calendar-page__header">
        <button type="button" onClick={onClose} className="calendar-page__back" aria-label={t('Закрыть')}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="calendar-page__title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 1v3M11 1v3M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M4.5 10h2M4.5 12.5h2M9.5 10h2M9.5 12.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>{t('Экономический календарь')}</span>
        </div>
      </div>
      <div className="calendar-page__body">
        <iframe src={src} className="calendar-page__frame" title="Economic Calendar" />
      </div>
    </div>
  )
}
