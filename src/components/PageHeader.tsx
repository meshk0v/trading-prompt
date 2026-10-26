import type { ReactNode } from 'react'
import { useI18n } from '../i18n/context'
import './PageHeader.css'

type PageHeaderProps = {
  icon: ReactNode
  title: string
  description?: ReactNode
  onClose?: () => void
}

/** Title bar of a full-screen page (icon, title, subtitle and a close button). */
export default function PageHeader({ icon, title, description, onClose }: PageHeaderProps) {
  const { t } = useI18n()
  return (
    <div className="page-header">
      <div className="page-header__title-group">
        <div className="page-header__icon">{icon}</div>
        <div>
          <h1 className="page-header__title">{title}</h1>
          {description && <p className="page-header__description">{description}</p>}
        </div>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="page-header__close" aria-label={t('Закрыть')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}
