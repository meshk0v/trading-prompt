import { useI18n } from '../i18n/context'
import { CloseIcon } from './icons'
import './LimitModal.css'

type LimitModalProps = {
  /** Guests are asked to sign up; signed-in users are offered a credit package. */
  variant: 'guest' | 'user'
  onClose: () => void
  onAction: () => void
}

export default function LimitModal({ variant, onClose, onAction }: LimitModalProps) {
  const { t } = useI18n()
  const isGuest = variant === 'guest'

  return (
    <div className="limit-modal-overlay" onClick={onClose}>
      <div className="limit-modal message-fade" onClick={event => event.stopPropagation()}>
        {isGuest && (
          <button type="button" aria-label={t('Закрыть')} onClick={onClose} className="limit-modal__close">
            <CloseIcon />
          </button>
        )}

        <div className="limit-modal__body">
          <div className="limit-modal__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v6m0 3v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="limit-modal__title">{isGuest ? t('Лимит запросов исчерпан') : t('Пробный пакет завершён')}</div>
            <p className="limit-modal__text">
              {isGuest
                ? t('Вы собрали 3 бесплатных промпта. Чтобы продолжить, зарегистрируйтесь.')
                : t('Вы использовали все 3 тестовых промпта. Для продолжения выберите подходящий пакет промптов.')}
            </p>
          </div>
        </div>

        <div className="limit-modal__divider" />

        <div className="limit-modal__actions">
          {!isGuest && (
            <button type="button" onClick={onClose} className="limit-modal__secondary">
              {t('Закрыть')}
            </button>
          )}
          <button type="button" onClick={onAction} className={`limit-modal__primary limit-modal__primary--${variant}`}>
            {isGuest && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="6" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M1.5 13v-1a4.5 4.5 0 0 1 9 0v1M12.5 5v5M10 7.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {isGuest ? t('Зарегистрироваться') : t('Выбрать пакет')}
          </button>
        </div>
      </div>
    </div>
  )
}
