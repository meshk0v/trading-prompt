import { useEffect, useState, type Dispatch, type ReactElement, type SetStateAction } from 'react'
import type { AuthUser } from '../../api/auth'
import PageHeader from '../../components/PageHeader'
import { useI18n } from '../../i18n/context'
import { tr } from '../../i18n/translate'
import type { SettingsSection } from '../../navigation'
import AccountSettings from './AccountSettings'
import CreditsSettings from './CreditsSettings'
import PromptSettings from './prompt/PromptSettings'
import './SettingsPage.css'

type SettingsPageProps = {
  user: AuthUser | null
  onUserUpdate?: (user: AuthUser) => void
  initialSection?: SettingsSection
  onClose: () => void
  watchlist: string[]
  setWatchlist: Dispatch<SetStateAction<string[]>>
}

const SECTIONS: Record<SettingsSection, { title: string; description: string; icon: ReactElement }> = {
  account: {
    title: tr('Аккаунт'),
    description: tr('Управление профилем и данными аккаунта'),
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M2 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  'prompt-settings': {
    title: tr('Настройки'),
    description: tr('Общие настройки и настройки генерации промптов'),
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M3.2 3.2l1.4 1.4M10.4 10.4l1.4 1.4M3.2 11.8l1.4-1.4M10.4 4.6l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  subscription: {
    title: tr('Кредиты'),
    description: tr('Пополнение баланса для создания готовых промптов'),
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <rect x="1.5" y="3.5" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M1.5 6.5h12" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="4.5" cy="9.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
}

export default function SettingsPage({
  user,
  onUserUpdate,
  initialSection,
  onClose,
  watchlist,
  setWatchlist,
}: SettingsPageProps) {
  const { t } = useI18n()
  const [section, setSection] = useState<SettingsSection>(initialSection || 'account')

  useEffect(() => {
    if (initialSection) setSection(initialSection)
  }, [initialSection])

  const current = SECTIONS[section]

  return (
    <div className="settings-page message-fade">
      <PageHeader icon={current.icon} title={t(current.title)} description={t(current.description)} onClose={onClose} />

      {section === 'account' && (
        <div className="settings-page__account scrollable">
          <div className="settings-page__account-inner">
            <AccountSettings user={user} onUserUpdate={onUserUpdate} />
          </div>
        </div>
      )}

      {section === 'prompt-settings' && (
        <div className="settings-page__panel settings-page__panel--prompt">
          <PromptSettings watchlist={watchlist} setWatchlist={setWatchlist} />
        </div>
      )}

      {section === 'subscription' && (
        <div className="settings-page__panel">
          <CreditsSettings />
        </div>
      )}
    </div>
  )
}
