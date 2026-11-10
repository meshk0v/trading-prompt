import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import UserAvatar from './UserAvatar'
import { changePassword, fetchSessions, revokeSession, updateProfile, type UserSession } from '../api/auth'

type AccountSettingsProps = {
  user: { name: string; email: string; uid: string; avatarUrl: string; telegram?: string } | null
  onAvatarChange: (avatarUrl: string) => void
}

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

const formatIdle = (seconds: number) => {
  if (seconds < 120) return 'Сейчас'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} мин. назад`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч. назад`
  return `${Math.floor(seconds / 86400)} дн. назад`
}

function SectionHeader({ children }: { children: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '18px', paddingBottom: '13px', borderBottom: '1px solid #2E2E46', color: '#EDEBFA', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.1px' }}>
      <span style={{ width: 3, height: 14, flexShrink: 0, borderRadius: 2, background: '#8B7CFF' }} />
      {children}
    </div>
  )
}

function Status({ status }: { status: { ok: boolean; text: string } | null }) {
  if (!status) return null
  return (
    <div role={status.ok ? 'status' : 'alert'} style={{ color: status.ok ? '#7BD9A5' : '#FF8A6B', fontFamily: 'Inter, sans-serif', fontSize: '11px', lineHeight: 1.4 }}>
      {status.text}
    </div>
  )
}

const errorText = (reason: unknown) => (reason instanceof Error ? reason.message : 'Ошибка сервера')

function SaveButton({ children, disabled }: { children: string; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{ width: '100%', height: 38, marginTop: '4px', border: '1px solid #8B7CFF', borderRadius: '7px', background: '#8B7CFF', color: '#0D0A24', fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em', cursor: disabled ? 'wait' : 'pointer', opacity: disabled ? 0.6 : 1, transition: 'background 0.15s, border-color 0.15s' }}
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

export default function AccountSettings({ user, onAvatarChange }: AccountSettingsProps) {
  const [name, setName] = useState(user?.name ?? '')
  const [avatarError, setAvatarError] = useState('')
  const [profileStatus, setProfileStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [passwords, setPasswords] = useState({ current: '', next: '', repeat: '' })
  const [passwordStatus, setPasswordStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [sessions, setSessions] = useState<UserSession[]>([])

  const loadSessions = useCallback(() => {
    fetchSessions().then(setSessions, () => undefined)
  }, [])
  useEffect(() => {
    if (user) loadSessions()
  }, [user, loadSessions])

  const saveProfile = (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    updateProfile(name.trim())
      .then(
        saved => {
          setName(saved.name)
          setProfileStatus({ ok: true, text: 'Сохранено' })
        },
        (reason: unknown) => setProfileStatus({ ok: false, text: errorText(reason) }),
      )
      .finally(() => setBusy(false))
  }

  const savePassword = (event: FormEvent) => {
    event.preventDefault()
    if (passwords.next !== passwords.repeat) {
      setPasswordStatus({ ok: false, text: 'Пароли не совпадают' })
      return
    }
    setBusy(true)
    changePassword(passwords.current, passwords.next)
      .then(
        () => {
          setPasswords({ current: '', next: '', repeat: '' })
          setPasswordStatus({ ok: true, text: 'Пароль изменён, остальные устройства вышли из аккаунта' })
          loadSessions()
        },
        (reason: unknown) => setPasswordStatus({ ok: false, text: errorText(reason) }),
      )
      .finally(() => setBusy(false))
  }

  const handleAvatarFile = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarError('Выберите файл изображения')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Размер изображения не должен превышать 5 МБ')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      onAvatarChange(reader.result)
      setAvatarError('')
    }
    reader.onerror = () => setAvatarError('Не удалось прочитать изображение')
    reader.readAsDataURL(file)
  }

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
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', border: '1px solid #2E2E46', borderRadius: '8px', background: '#0F0F19' }}>
              <UserAvatar
                src={user?.avatarUrl ?? ''}
                name={user?.name ?? ''}
                size={64}
                style={{ border: '1px solid rgba(139,124,255,0.38)', borderRadius: '12px', objectPosition: 'center 28%' }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: '#EDEBFA', fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700 }}>Личное фото</div>
                <div style={{ marginTop: '3px', color: '#676582', fontFamily: 'Inter, sans-serif', fontSize: '10px', lineHeight: 1.45 }}>JPG, PNG или WEBP до 5 МБ. Фото появится в меню аккаунта.</div>
                <label style={{ display: 'inline-flex', height: 30, alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '9px', padding: '0 11px', border: '1px solid rgba(139,124,255,0.38)', borderRadius: '6px', background: 'rgba(139,124,255,0.1)', color: '#B9AFFF', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 11V3m0 0L5 6m3-3 3 3M3 10v3h10v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Выбрать фото
                  <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={event => handleAvatarFile(event.target.files?.[0])} />
                </label>
                {avatarError && <div role="alert" style={{ marginTop: '7px', color: '#FF8A6B', fontFamily: 'Inter, sans-serif', fontSize: '10px', lineHeight: 1.4 }}>{avatarError}</div>}
              </div>
            </div>
            <div><label style={labelStyle}>Имя</label><input style={inputStyle} value={name} onChange={event => setName(event.target.value)} placeholder="Ваше имя" onFocus={event => focusInput(event.target)} onBlur={event => blurInput(event.target)} /></div>
            <div><label style={labelStyle}>UID пользователя</label><input style={{ ...inputStyle, color: '#B9AFFF', cursor: 'default', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }} value={user?.uid ?? ''} readOnly /></div>
            <div><label style={labelStyle}>Email</label><input style={{ ...inputStyle, color: '#676582', cursor: 'not-allowed' }} value={user?.email ?? ''} readOnly /></div>
            <div><label style={labelStyle}>Telegram</label><input style={{ ...inputStyle, color: '#676582', cursor: 'not-allowed' }} value={user?.telegram ?? ''} readOnly placeholder="Не указан" /></div>
            <Status status={profileStatus} />
            <SaveButton disabled={busy}>Сохранить</SaveButton>
          </form>
        </div>

        <div className="account-cell" style={cardStyle}>
          <SectionHeader>Безопасность и пароль</SectionHeader>
          <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {([['Текущий пароль', 'current', 'current-password'], ['Новый пароль', 'next', 'new-password'], ['Повторите пароль', 'repeat', 'new-password']] as const).map(([label, key, autoComplete]) => (
              <div key={key}><label style={labelStyle}>{label}</label><input type="password" autoComplete={autoComplete} style={inputStyle} placeholder="••••••••" value={passwords[key]} onChange={event => setPasswords(current => ({ ...current, [key]: event.target.value }))} onFocus={event => focusInput(event.target)} onBlur={event => blurInput(event.target)} /></div>
            ))}
            <Status status={passwordStatus} />
            <SaveButton disabled={busy || !passwords.current || !passwords.next}>Сменить пароль</SaveButton>
          </form>
        </div>

        <div className="account-cell account-cell--right account-cell--last" style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <SectionHeader>Активные сессии</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sessions.map(session => (
              <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', border: `1px solid ${session.current ? '#34344F' : '#191926'}`, borderRadius: '4px', background: '#0F0F19' }}>
                <div style={{ display: 'flex', width: 28, height: 28, flexShrink: 0, alignItems: 'center', justifyContent: 'center', border: `1px solid ${session.current ? '#2E2E46' : '#191926'}`, borderRadius: '4px', background: '#191926' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="9" rx="2" stroke={session.current ? '#CFCDE3' : '#676582'} strokeWidth="1.3"/><path d="M6 12h4" stroke={session.current ? '#CFCDE3' : '#676582'} strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: session.current ? '#EDEBFA' : '#9A98B5', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500 }}>{session.device}</div>
                  <div style={{ marginTop: '1px', color: '#676582', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>{session.ip} · {session.current ? 'Сейчас' : formatIdle(session.secondsAgo)}</div>
                </div>
                {session.current ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, padding: '2px 7px', border: '1px solid #2E2E46', borderRadius: '2px', background: '#191926', color: '#7C7A98', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em' }}>
                    <span style={{ width: 4, height: 4, flexShrink: 0, borderRadius: '50%', background: '#8B7CFF' }} />
                    ТЕКУЩАЯ
                  </span>
                ) : (
                  <button type="button" onClick={() => revokeSession(session.id).then(loadSessions, () => undefined)} style={{ padding: '3px 10px', border: '1px solid #191926', borderRadius: '3px', background: 'none', color: '#676582', fontFamily: 'Inter, sans-serif', fontSize: '11px', cursor: 'pointer', transition: 'all 0.12s' }} onMouseEnter={event => { event.currentTarget.style.color = '#EDEBFA'; event.currentTarget.style.borderColor = '#34344F' }} onMouseLeave={event => { event.currentTarget.style.color = '#676582'; event.currentTarget.style.borderColor = '#191926' }}>Завершить</button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
