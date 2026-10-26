import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { changePassword, fetchSessions, revokeSession, updateProfile, type AuthUser, type UserSession } from '../authApi'

type AccountSettingsProps = {
  user: AuthUser | null
  onUserUpdate?: (user: AuthUser) => void
}

type Notice = { type: 'success' | 'error'; text: string } | null

const inputStyle: CSSProperties = {
  width: '100%',
  height: 44,
  boxSizing: 'border-box',
  padding: '0 14px',
  border: '1px solid #34344F',
  borderRadius: '7px',
  background: '#191926',
  color: '#EDEBFA',
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  color: '#9A98B5',
  fontFamily: 'Inter, sans-serif',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

const cardStyle: CSSProperties = {
  padding: '24px',
  border: '1px solid #2E2E46',
  borderRadius: '10px',
  background: 'linear-gradient(145deg, #191926 0%, #12121C 70%)',
  boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
}

function formatLastSeen(secondsAgo: number) {
  if (secondsAgo < 60) return 'Сейчас'
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} мин. назад`
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} ч. назад`
  return `${Math.floor(secondsAgo / 86400)} дн. назад`
}

function NoticeText({ notice }: { notice: Notice }) {
  if (!notice) return null
  return (
    <div role="status" style={{ color: notice.type === 'success' ? '#7FD7A6' : '#FF8A8A', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>
      {notice.text}
    </div>
  )
}

function SectionHeader({ children }: { children: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '18px', paddingBottom: '13px', borderBottom: '1px solid #2E2E46', color: '#EDEBFA', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.1px' }}>
      <span style={{ width: 3, height: 14, flexShrink: 0, borderRadius: 2, background: '#8B7CFF' }} />
      {children}
    </div>
  )
}

function SaveButton({ children, disabled }: { children: string; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{ width: '100%', height: 38, marginTop: '4px', border: '1px solid #8B7CFF', borderRadius: '7px', background: '#8B7CFF', color: '#0D0A24', fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em', cursor: disabled ? 'wait' : 'pointer', opacity: disabled ? 0.7 : 1, transition: 'background 0.15s, border-color 0.15s' }}
      onMouseEnter={event => {
        event.currentTarget.style.background = '#A194FF'
        event.currentTarget.style.borderColor = '#A194FF'
      }}
      onMouseLeave={event => {
        event.currentTarget.style.background = '#8B7CFF'
        event.currentTarget.style.borderColor = '#8B7CFF'
      }}
    >
      {children}
    </button>
  )
}

export default function AccountSettings({ user, onUserUpdate }: AccountSettingsProps) {
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
    fetchSessions().then(setSessions).catch(err => setSessionsError(err.message))
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setProfileNotice(null)
    setProfileSaving(true)
    try {
      const updated = await updateProfile(name.trim())
      setName(updated.name)
      onUserUpdate?.(updated)
      setProfileNotice({ type: 'success', text: 'Имя сохранено' })
    } catch (err) {
      setProfileNotice({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка сервера' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordNotice(null)
    if (passwords.next !== passwords.repeat) {
      setPasswordNotice({ type: 'error', text: 'Пароли не совпадают' })
      return
    }
    if (passwords.next.length < 6) {
      setPasswordNotice({ type: 'error', text: 'Пароль должен быть не менее 6 символов' })
      return
    }
    setPasswordSaving(true)
    try {
      await changePassword(passwords.current, passwords.next)
      setPasswords({ current: '', next: '', repeat: '' })
      setSessions(list => list.filter(session => session.current))
      setPasswordNotice({ type: 'success', text: 'Пароль изменён. Остальные устройства вышли из аккаунта' })
    } catch (err) {
      setPasswordNotice({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка сервера' })
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleRevoke = async (id: number) => {
    try {
      await revokeSession(id)
      setSessions(list => list.filter(session => session.id !== id))
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Ошибка сервера')
    }
  }

  const passwordFields = [
    { key: 'current', label: 'Текущий пароль', autoComplete: 'current-password' },
    { key: 'next', label: 'Новый пароль', autoComplete: 'new-password' },
    { key: 'repeat', label: 'Повторите пароль', autoComplete: 'new-password' },
  ] as const

  const focusInput = (element: HTMLInputElement) => {
    element.style.borderColor = '#8B7CFF'
    element.style.boxShadow = 'none'
  }
  const blurInput = (element: HTMLInputElement) => {
    element.style.borderColor = '#34344F'
    element.style.boxShadow = 'none'
  }

  return (
    <div className="account-wrapper" style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      <div className="account-overview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px', marginBottom: '16px', padding: '20px 22px', border: '1px solid rgba(139,124,255,0.38)', borderRadius: '10px', background: 'radial-gradient(circle at 0% 0%, rgba(139,124,255,0.12), transparent 42%), linear-gradient(145deg, #191926 0%, #12121C 72%)', boxShadow: '0 14px 34px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <div style={{ display: 'grid', width: 46, height: 46, flexShrink: 0, placeItems: 'center', border: '1px solid rgba(139,124,255,0.38)', borderRadius: '10px', background: 'rgba(139,124,255,0.12)', color: '#8B7CFF', fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700 }}>
            {(name || user?.email || 'A')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ overflow: 'hidden', color: '#EDEBFA', fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, lineHeight: 1.2, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name || 'Пользователь Trading Prompt'}
            </div>
            <div style={{ overflow: 'hidden', marginTop: '5px', color: '#9A98B5', fontFamily: 'Inter, sans-serif', fontSize: '12px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || 'Email не указан'}
            </div>
          </div>
        </div>
        <div className="account-status" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 10px', border: '1px solid #34344F', borderRadius: '6px', background: '#191926', color: '#CFCDE3', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B7CFF', boxShadow: '0 0 8px rgba(139,124,255,0.35)' }} />
          Аккаунт активен
        </div>
      </div>

      <div className="account-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'start', gap: '16px' }}>
        <div className="account-cell account-cell--right" style={cardStyle}>
          <SectionHeader>Профиль</SectionHeader>
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><label style={labelStyle}>Имя</label><input style={inputStyle} value={name} onChange={event => setName(event.target.value)} placeholder="Ваше имя" onFocus={event => focusInput(event.target)} onBlur={event => blurInput(event.target)} /></div>
            <div><label style={labelStyle}>Email</label><input style={{ ...inputStyle, color: '#676582', cursor: 'not-allowed' }} value={user?.email ?? ''} readOnly /></div>
            <div><label style={labelStyle}>Telegram</label><input style={{ ...inputStyle, color: '#676582', cursor: 'not-allowed' }} value={user?.telegram ?? ''} readOnly placeholder="Не указан" /></div>
            <NoticeText notice={profileNotice} />
            <SaveButton disabled={profileSaving}>{profileSaving ? 'Сохранение…' : 'Сохранить'}</SaveButton>
          </form>
        </div>

        <div className="account-cell" style={cardStyle}>
          <SectionHeader>Безопасность и пароль</SectionHeader>
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {passwordFields.map(field => (
              <div key={field.key}><label style={labelStyle}>{field.label}</label><input type="password" required autoComplete={field.autoComplete} style={inputStyle} placeholder="••••••••" value={passwords[field.key]} onChange={event => setPasswords(current => ({ ...current, [field.key]: event.target.value }))} onFocus={event => focusInput(event.target)} onBlur={event => blurInput(event.target)} /></div>
            ))}
            <NoticeText notice={passwordNotice} />
            <SaveButton disabled={passwordSaving}>{passwordSaving ? 'Сохранение…' : 'Сменить пароль'}</SaveButton>
          </form>
        </div>

        <div className="account-cell account-cell--right account-cell--last" style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <SectionHeader>Активные сессии</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sessionsError && <NoticeText notice={{ type: 'error', text: sessionsError }} />}
            {sessions.map(session => (
              <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', border: `1px solid ${session.current ? '#34344F' : '#191926'}`, borderRadius: '4px', background: '#0F0F19' }}>
                <div style={{ display: 'flex', width: 28, height: 28, flexShrink: 0, alignItems: 'center', justifyContent: 'center', border: `1px solid ${session.current ? '#2E2E46' : '#191926'}`, borderRadius: '4px', background: '#191926' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="9" rx="2" stroke={session.current ? '#CFCDE3' : '#676582'} strokeWidth="1.3"/><path d="M6 12h4" stroke={session.current ? '#CFCDE3' : '#676582'} strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: session.current ? '#EDEBFA' : '#9A98B5', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500 }}>{session.device}</div>
                  <div style={{ marginTop: '1px', color: '#676582', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>{session.ip} · {formatLastSeen(session.secondsAgo)}</div>
                </div>
                {session.current ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, padding: '2px 7px', border: '1px solid #2E2E46', borderRadius: '2px', background: '#191926', color: '#7C7A98', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em' }}>
                    <span style={{ width: 4, height: 4, flexShrink: 0, borderRadius: '50%', background: '#8B7CFF' }} />
                    ТЕКУЩАЯ
                  </span>
                ) : (
                  <button type="button" onClick={() => handleRevoke(session.id)} style={{ padding: '3px 10px', border: '1px solid #191926', borderRadius: '3px', background: 'none', color: '#676582', fontFamily: 'Inter, sans-serif', fontSize: '11px', cursor: 'pointer', transition: 'all 0.12s' }} onMouseEnter={event => { event.currentTarget.style.color = '#EDEBFA'; event.currentTarget.style.borderColor = '#34344F' }} onMouseLeave={event => { event.currentTarget.style.color = '#676582'; event.currentTarget.style.borderColor = '#191926' }}>Завершить</button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
