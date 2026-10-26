import { useState, type ReactNode } from 'react'
import { useI18n } from '../../i18n/context'
import { tr } from '../../i18n/translate'
import { AI_LINKS, type Page, type SettingsSection } from '../../navigation'
import AccountBalanceSummary from '../AccountBalanceSummary'
import {
  CalendarIcon,
  CardIcon,
  ChevronDownIcon,
  DocumentIcon,
  ExternalLinkIcon,
  LogoutIcon,
  MenuIcon,
  PartnersIcon,
  QuestionIcon,
  SettingsIcon,
  SignInIcon,
  SupportIcon,
  UserIcon,
} from '../icons'
import Logo from '../Logo'
import './MainMenu.css'

type MainMenuProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isAuthenticated: boolean
  remainingPrompts: number
  onOpenPage: (page: Page) => void
  onOpenSettings: (section: SettingsSection) => void
  onOpenFaq: () => void
  onSignIn: () => void
  onLogout: () => void
}

type MenuEntry = { id: string; label: string; icon: ReactNode; action: () => void }

/** Hamburger button plus the slide-in menu panel on the right. */
export default function MainMenu({
  open,
  onOpenChange,
  isAuthenticated,
  remainingPrompts,
  onOpenPage,
  onOpenSettings,
  onOpenFaq,
  onSignIn,
  onLogout,
}: MainMenuProps) {
  const { t } = useI18n()
  const [aiLinksOpen, setAiLinksOpen] = useState(false)

  const run = (action: () => void) => () => {
    action()
    onOpenChange(false)
  }

  const userEntries: MenuEntry[] = [
    { id: 'account', label: tr('Аккаунт'), icon: <UserIcon />, action: () => onOpenSettings('account') },
    { id: 'subscription', label: tr('Кредиты'), icon: <CardIcon />, action: () => onOpenSettings('subscription') },
    { id: 'prompt-settings', label: tr('Настройки'), icon: <SettingsIcon />, action: () => onOpenSettings('prompt-settings') },
    { id: 'affiliate', label: tr('Партнёрская программа'), icon: <PartnersIcon />, action: () => onOpenPage('affiliate') },
    { id: 'support', label: tr('Поддержка и контакты'), icon: <SupportIcon />, action: () => onOpenPage('support') },
    { id: 'faq', label: tr('Вопросы и ответы'), icon: <QuestionIcon />, action: onOpenFaq },
    { id: 'calendar', label: tr('Экономический календарь'), icon: <CalendarIcon />, action: () => onOpenPage('calendar') },
    { id: 'legal', label: tr('Правовая информация'), icon: <DocumentIcon />, action: () => onOpenPage('legal') },
  ]

  const guestEntries: MenuEntry[] = [
    { id: 'affiliate', label: tr('Партнёрская программа'), icon: <PartnersIcon />, action: () => onOpenPage('affiliate') },
    { id: 'faq', label: tr('Вопросы и ответы'), icon: <QuestionIcon />, action: onOpenFaq },
    { id: 'legal', label: tr('Правовая информация'), icon: <DocumentIcon />, action: () => onOpenPage('legal') },
  ]

  return (
    <>
      {open && <div className="main-menu-backdrop" onClick={() => onOpenChange(false)} />}

      {!open && (
        <button
          type="button"
          data-prompt-guide="main-menu"
          className="main-menu-toggle"
          onClick={() => onOpenChange(true)}
          aria-label={t('Открыть меню')}
          title={t('Открыть меню')}
        >
          <MenuIcon />
        </button>
      )}

      <nav className={`main-menu${open ? ' is-open' : ''}`}>
        <div className="main-menu__brand">
          <Logo size={24} />
          Trading Prompt
        </div>

        <div className="main-menu__body">
          {isAuthenticated ? (
            <div data-prompt-guide="authorized-menu-items" className="main-menu__list main-menu__list--user">
              <AccountBalanceSummary remaining={remainingPrompts} />
              {userEntries.map(entry => (
                <button key={entry.id} type="button" className="menu-item" onClick={run(entry.action)}>
                  {entry.icon}
                  {t(entry.label)}
                </button>
              ))}
              <button type="button" className="menu-item" onClick={run(onLogout)}>
                <LogoutIcon />
                {t('Выйти')}
              </button>
            </div>
          ) : (
            <div data-prompt-guide="guest-menu-items" className="main-menu__list">
              <button type="button" className="menu-item menu-item--tall" onClick={run(onSignIn)}>
                <SignInIcon />
                {t('Войти')}
              </button>

              <button
                type="button"
                className="menu-item menu-item--tall"
                aria-expanded={aiLinksOpen}
                onClick={() => setAiLinksOpen(value => !value)}
              >
                <ExternalLinkIcon />
                <span className="menu-item__label">{t('Ссылки на ИИ')}</span>
                <ChevronDownIcon className={`menu-item__chevron${aiLinksOpen ? ' is-open' : ''}`} />
              </button>

              {aiLinksOpen && (
                <div className="main-menu__ai-links">
                  {AI_LINKS.map(link => (
                    <a key={link.label} href={link.href} target="_blank" rel="noreferrer" onClick={() => onOpenChange(false)}>
                      <span className="main-menu__dot" />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}

              {guestEntries.map(entry => (
                <button key={entry.id} type="button" className="menu-item menu-item--tall" onClick={run(entry.action)}>
                  {entry.icon}
                  {t(entry.label)}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
