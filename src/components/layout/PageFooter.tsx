import { useI18n } from '../../i18n/context'
import { tr } from '../../i18n/translate'
import type { Page, SettingsSection } from '../../navigation'
import Logo from '../Logo'
import './PageFooter.css'

type PageFooterProps = {
  onOpenPage: (page: Page) => void
  onOpenSettings: (section: SettingsSection) => void
}

/** Footer navigation for signed-in users (desktop only). */
export default function PageFooter({ onOpenPage, onOpenSettings }: PageFooterProps) {
  const { t } = useI18n()
  const links = [
    { label: tr('Аккаунт'), action: () => onOpenSettings('account') },
    { label: tr('Кредиты'), action: () => onOpenSettings('subscription') },
    { label: tr('Настройки промпта'), action: () => onOpenSettings('prompt-settings') },
    { label: tr('Партнёрская программа'), action: () => onOpenPage('affiliate') },
    { label: tr('Поддержка и контакты'), action: () => onOpenPage('support') },
    { label: tr('Вопросы и ответы'), action: () => onOpenPage('faq') },
    { label: tr('Правовая информация'), action: () => onOpenPage('legal') },
  ]

  return (
    <footer className="page-footer">
      <div className="page-footer__inner">
        <div className="page-footer__brand">
          <Logo size={20} opacity={0.72} />
          Trading Prompt
        </div>
        <nav aria-label={t('Навигация в подвале')} className="page-footer__nav">
          {links.map(link => (
            <button key={link.label} type="button" onClick={link.action}>
              {t(link.label)}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  )
}
