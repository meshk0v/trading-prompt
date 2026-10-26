import { useState, type FormEvent } from 'react'
import { login, register, type AuthUser } from '../api/auth'
import { useI18n } from '../i18n/context'
import Logo from './Logo'
import './AuthModal.css'

type Tab = 'login' | 'register'

type AuthModalProps = {
  initialTab?: Tab
  onClose: () => void
  onAuth: (user: AuthUser) => void
  onOpenLegal?: () => void
}

const EyeIcon = ({ crossed }: { crossed: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
    {crossed && <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
  </svg>
)

function PasswordInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="auth-modal__input-wrap">
      <input
        type={visible ? 'text' : 'password'}
        placeholder="••••••••"
        value={value}
        onChange={event => onChange(event.target.value)}
        required
        className="auth-modal__input auth-modal__input--password"
      />
      <button type="button" onClick={() => setVisible(current => !current)} className={`auth-modal__eye${visible ? ' is-active' : ''}`}>
        <EyeIcon crossed={visible} />
      </button>
    </div>
  )
}

/** Sign-in and registration dialog. Validates on the client, then calls the PHP API. */
export default function AuthModal({ initialTab = 'login', onClose, onAuth, onOpenLegal }: AuthModalProps) {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [telegram, setTelegram] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isRegister = tab === 'register'

  const switchTab = (next: Tab) => {
    setTab(next)
    setError('')
  }

  const validate = (): string | null => {
    if (isRegister && password !== confirmPassword) return 'Пароли не совпадают'
    if (password.length < 6) return 'Пароль должен быть не менее 6 символов'
    if (isRegister && !telegram.trim()) return 'Укажите ваш Telegram в формате @username'
    if (isRegister && !/^@[a-zA-Z0-9_]{3,}$/.test(telegram.trim())) return 'Telegram должен быть в формате @username (минимум 3 символа)'
    if (isRegister && !termsAccepted) return 'Необходимо принять условия платформы'
    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validate()
    setError(validationError ?? '')
    if (validationError) return

    setLoading(true)
    try {
      const user = isRegister
        ? await register({ name: name.trim(), email: email.trim(), telegram: telegram.trim(), password, termsAccepted })
        : await login(email.trim(), password)
      onAuth(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сервера')
    } finally {
      setLoading(false)
    }
  }

  const submitDisabled = loading || (isRegister && !termsAccepted)

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal message-fade" onClick={event => event.stopPropagation()}>
        <div className="auth-modal__header">
          <div className="auth-modal__brand">
            <Logo size={26} />
            <span>Trading Prompt</span>
          </div>
          <button type="button" onClick={onClose} className="auth-modal__close" aria-label={t('Закрыть')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="auth-modal__tabs">
          {(['login', 'register'] as const).map(item => (
            <button
              key={item}
              type="button"
              onClick={() => switchTab(item)}
              className={`auth-modal__tab${tab === item ? ' is-active' : ''}`}
            >
              {item === 'login' ? t('Войти') : t('Регистрация')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="auth-modal__form">
          {isRegister && (
            <div className="auth-modal__field">
              <label>{t('Имя')}</label>
              <input
                type="text"
                placeholder={t('Ваше имя')}
                value={name}
                onChange={event => setName(event.target.value)}
                className="auth-modal__input"
              />
            </div>
          )}

          <div className="auth-modal__field">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
              className="auth-modal__input"
            />
          </div>

          <div className="auth-modal__field">
            <label>{t('Пароль')}</label>
            <PasswordInput value={password} onChange={setPassword} />
          </div>

          {isRegister && (
            <>
              <div className="auth-modal__field">
                <label>{t('Повторите пароль')}</label>
                <PasswordInput value={confirmPassword} onChange={setConfirmPassword} />
              </div>

              <div className="auth-modal__field">
                <label>Telegram</label>
                <div className="auth-modal__input-wrap">
                  <input
                    type="text"
                    placeholder="@username"
                    value={telegram}
                    onChange={event => {
                      const value = event.target.value
                      setTelegram(value && !value.startsWith('@') ? `@${value}` : value)
                    }}
                    required
                    className="auth-modal__input auth-modal__input--telegram"
                  />
                  <svg className="auth-modal__telegram-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M21.8 3.3L2.3 10.8c-1.3.5-1.3 1.3-.2 1.6l4.8 1.5 1.8 5.6c.2.6.5.9 1 .9.4 0 .6-.2.9-.5l2.1-2.1 4.4 3.2c.8.4 1.4.2 1.6-.7l2.9-13.8c.3-1.2-.5-1.7-1-1.2z"
                      fill="currentColor"
                      stroke="currentColor"
                    />
                  </svg>
                </div>
              </div>

              <div onClick={() => setTermsAccepted(value => !value)} className={`auth-modal__terms${termsAccepted ? ' is-checked' : ''}`}>
                <div className="auth-modal__checkbox">
                  {termsAccepted && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                      <path d="M1.5 4.5l2 2L7.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span>
                  {t('Я принимаю')}{' '}
                  <button
                    type="button"
                    className="auth-modal__link auth-modal__link--underlined"
                    onClick={event => {
                      event.stopPropagation()
                      onClose()
                      onOpenLegal?.()
                    }}
                  >
                    {t('условия платформы')}
                  </button>
                  {t(', включая Пользовательское соглашение и Политику конфиденциальности')}
                </span>
              </div>
            </>
          )}

          {error && <div className="auth-modal__error">{t(error)}</div>}

          <button type="submit" disabled={submitDisabled} className="auth-modal__submit">
            {loading ? (
              <>
                <span className="auth-modal__spinner" />
                {t('Подождите...')}
              </>
            ) : isRegister ? (
              t('Создать аккаунт')
            ) : (
              t('Войти')
            )}
          </button>

          <p className="auth-modal__switch">
            {isRegister ? t('Уже есть аккаунт?') : t('Нет аккаунта?')}{' '}
            <button type="button" className="auth-modal__link" onClick={() => switchTab(isRegister ? 'login' : 'register')}>
              {isRegister ? t('Войти') : t('Зарегистрироваться')}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
