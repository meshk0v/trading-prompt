import { useI18n } from '../../i18n/context'
import Logo from '../Logo'
import './AppHeader.css'

export default function AppHeader() {
  const { language, setLanguage } = useI18n()
  const nextLanguage = language === 'ru' ? 'en' : 'ru'

  return (
    <header className="app-header">
      <div className="app-header__row">
        <div className="app-header__brand">
          <Logo size={28} opacity={0.82} />
          <span>Trading Prompt</span>
        </div>
        <button
          type="button"
          className="language-switcher"
          onClick={() => setLanguage(nextLanguage)}
          aria-label={nextLanguage === 'en' ? 'Switch to English' : 'Switch to Russian'}
          title={nextLanguage === 'en' ? 'English' : 'Russian'}
        >
          {/* The flag shows the language you switch to. */}
          <span className={`fi fi-${nextLanguage === 'en' ? 'gb' : 'ru'}`} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
