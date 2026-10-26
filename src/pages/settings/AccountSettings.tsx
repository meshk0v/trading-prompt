import { useEffect, useState, type FormEvent } from 'react'
import { changePassword, fetchSessions, revokeSession, updateProfile, type AuthUser, type UserSession } from '../../api/auth'
import { useI18n } from '../../i18n/context'
import { tr } from '../../i18n/translate'
import './AccountSettings.css'

type AccountSettingsProps = {
  user: AuthUser | null
  onUserUpdate?: (user: AuthUser) => void
}

type Notice = { type: 'success' | 'error'; text: string } | null

const PASSWORD_FIELDS = [
  { key: 'current', label: tr('Текущий пароль'), autoComplete: 'current-password' },
  { key: 'next', label: tr('Новый пароль'), autoComplete: 'new-password' },
  { key: 'repeat', label: tr('Повторите пароль'), autoComplete: 'new-password' },
] as const

function NoticeText({ notice }: { notice: Notice }) {
  if (!notice) return null
  return (
    <div role="status" className={`account-notice account-notice--${notice.type}`}>
      {notice.text}
    </div>
  )
}

function SectionHeader({ children }: { children: string }) {
  return (
    <div className="account-section-title">
      <span />
      {children}
    </div>
  )
}

/** Profile, password and active sessions of the signed-in user. */
export default function AccountSettings({ user, onUserUpdate }: AccountSettingsProps) {
  const { t } = useI18n()
  const [name, setName] = useState(user?.name ?? '')
  const [profileNotice, setProfileNotice] = useState<Notice>(null)
  const [profileSaving, setProfileSaving] = useState(false)

  const [passwords, setPasswords] = useState({ current: '', next: '', repeat: '' })
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  const [sessions, setSessions] = useState<UserSession[]>([])
  const [sessionsError, setSessionsError] = useState('')

  useEffect(() => {
    if (!user) return
    fetchSessions()
      .then(setSessions)
      .catch(err => setSessionsError(err.message))
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const errorText = (err: unknown) => t(err instanceof Error ? err.message : 'Ошибка сервера')

  const formatLastSeen = (secondsAgo: number) => {
    if (secondsAgo < 60) return t('Сейчас')
    if (secondsAgo < 3600) return t('{count} мин. назад', { count: Math.floor(secondsAgo / 60) })
    if (secondsAgo < 86400) return t('{count} ч. назад', { count: Math.floor(secondsAgo / 3600) })
    return t('{count} дн. назад', { count: Math.floor(secondsAgo / 86400) })
  }

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setProfileNotice(null)
    setProfileSaving(true)
    try {
      const updated = await updateProfile(name.trim())
      setName(updated.name)
      onUserUpdate?.(updated)
      setProfileNotice({ type: 'success', text: t('Имя сохранено') })
    } catch (err) {
      setProfileNotice({ type: 'error', text: errorText(err) })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordNotice(null)
    if (passwords.next !== passwords.repeat) {
      setPasswordNotice({ type: 'error', text: t('Пароли не совпадают') })
      return
    }
    if (passwords.next.length < 6) {
      setPasswordNotice({ type: 'error', text: t('Пароль должен быть не менее 6 символов') })
      return
    }
    setPasswordSaving(true)
    try {
      await changePassword(passwords.current, passwords.next)
      setPasswords({ current: '', next: '', repeat: '' })
      setSessions(list => list.filter(session => session.current))
      setPasswordNotice({ type: 'success', text: t('Пароль изменён. Остальные устройства вышли из аккаунта') })
    } catch (err) {
      setPasswordNotice({ type: 'error', text: errorText(err) })
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleRevoke = async (id: number) => {
    try {
      await revokeSession(id)
      setSessions(list => list.filter(session => session.id !== id))
    } catch (err) {
      setSessionsError(errorText(err))
    }
  }

  return (
    <div className="account-wrapper">
      <div className="account-overview">
        <div className="account-overview__identity">
          <div className="account-overview__avatar">{(name || user?.email || 'A')[0].toUpperCase()}</div>
          <div className="account-overview__names">
            <div className="account-overview__name">{name || t('Пользователь Trading Prompt')}</div>
            <div className="account-overview__email">{user?.email || t('Email не указан')}</div>
          </div>
        </div>
        <div className="account-status">
          <span />
          {t('Аккаунт активен')}
        </div>
      </div>

      <div className="account-grid">
        <div className="account-card">
          <SectionHeader>{t('Профиль')}</SectionHeader>
          <form onSubmit={handleProfileSubmit} className="account-form">
            <div>
              <label className="account-label">{t('Имя')}</label>
              <input className="account-input" value={name} onChange={event => setName(event.target.value)} placeholder={t('Ваше имя')} />
            </div>
            <div>
              <label className="account-label">Email</label>
              <input className="account-input" value={user?.email ?? ''} readOnly />
            </div>
            <div>
              <label className="account-label">Telegram</label>
              <input className="account-input" value={user?.telegram ?? ''} readOnly placeholder={t('Не указан')} />
            </div>
            <NoticeText notice={profileNotice} />
            <button type="submit" disabled={profileSaving} className="account-button">
              {profileSaving ? t('Сохранение…') : t('Сохранить')}
            </button>
          </form>
        </div>

        <div className="account-card">
          <SectionHeader>{t('Безопасность и пароль')}</SectionHeader>
          <form onSubmit={handlePasswordSubmit} className="account-form">
            {PASSWORD_FIELDS.map(field => (
              <div key={field.key}>
                <label className="account-label">{t(field.label)}</label>
                <input
                  type="password"
                  required
                  autoComplete={field.autoComplete}
                  className="account-input"
                  placeholder="••••••••"
                  value={passwords[field.key]}
                  onChange={event => setPasswords(current => ({ ...current, [field.key]: event.target.value }))}
                />
              </div>
            ))}
            <NoticeText notice={passwordNotice} />
            <button type="submit" disabled={passwordSaving} className="account-button">
              {passwordSaving ? t('Сохранение…') : t('Сменить пароль')}
            </button>
          </form>
        </div>

        <div className="account-card account-card--wide">
          <SectionHeader>{t('Активные сессии')}</SectionHeader>
          <div className="account-sessions">
            {sessionsError && <NoticeText notice={{ type: 'error', text: sessionsError }} />}
            {sessions.map(session => (
              <div key={session.id} className={`account-session${session.current ? ' is-current' : ''}`}>
                <div className="account-session__icon">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="2" y="3" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M6 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="account-session__info">
                  <div className="account-session__device">{session.device}</div>
                  <div className="account-session__meta">
                    {session.ip} · {formatLastSeen(session.secondsAgo)}
                  </div>
                </div>
                {session.current ? (
                  <span className="account-session__current">
                    <span />
                    {t('ТЕКУЩАЯ')}
                  </span>
                ) : (
                  <button type="button" onClick={() => handleRevoke(session.id)} className="account-session__revoke">
                    {t('Завершить')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
