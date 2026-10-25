import { useState, type CSSProperties } from 'react'

type AccountSettingsProps = {
  user: { name: string; email: string; telegram?: string } | null
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

const sessions = [
  { device: 'Chrome · Windows', ip: '94.232.12.48', time: 'Сейчас', current: true },
  { device: 'Safari · iPhone', ip: '88.147.30.201', time: '2 ч. назад', current: false },
  { device: 'Firefox · macOS', ip: '195.80.14.77', time: '3 дня назад', current: false },
]

function SectionHeader({ children }: { children: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '18px', paddingBottom: '13px', borderBottom: '1px solid #2E2E46', color: '#EDEBFA', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.1px' }}>
      <span style={{ width: 3, height: 14, flexShrink: 0, borderRadius: 2, background: '#8B7CFF' }} />
      {children}
    </div>
  )
}

function SaveButton({ children }: { children: string }) {
  return (
    <button
      style={{ width: '100%', height: 38, marginTop: '4px', border: '1px solid #8B7CFF', borderRadius: '7px', background: '#8B7CFF', color: '#0D0A24', fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em', cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}
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

export default function AccountSettings({ user }: AccountSettingsProps) {
  const [name, setName] = useState(user?.name ?? '')

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><label style={labelStyle}>Имя</label><input style={inputStyle} value={name} onChange={event => setName(event.target.value)} placeholder="Ваше имя" onFocus={event => focusInput(event.target)} onBlur={event => blurInput(event.target)} /></div>
            <div><label style={labelStyle}>Email</label><input style={{ ...inputStyle, color: '#676582', cursor: 'not-allowed' }} value={user?.email ?? ''} readOnly /></div>
            <div><label style={labelStyle}>Telegram</label><input style={{ ...inputStyle, color: '#676582', cursor: 'not-allowed' }} value={user?.telegram ?? ''} readOnly placeholder="Не указан" /></div>
            <SaveButton>Сохранить</SaveButton>
          </div>
        </div>

        <div className="account-cell" style={cardStyle}>
          <SectionHeader>Безопасность и пароль</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Текущий пароль', 'Новый пароль', 'Повторите пароль'].map(label => (
              <div key={label}><label style={labelStyle}>{label}</label><input type="password" style={inputStyle} placeholder="••••••••" onFocus={event => focusInput(event.target)} onBlur={event => blurInput(event.target)} /></div>
            ))}
            <SaveButton>Сменить пароль</SaveButton>
          </div>
        </div>

        <div className="account-cell account-cell--right account-cell--last" style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <SectionHeader>Активные сессии</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sessions.map(session => (
              <div key={session.ip} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', border: `1px solid ${session.current ? '#34344F' : '#191926'}`, borderRadius: '4px', background: '#0F0F19' }}>
                <div style={{ display: 'flex', width: 28, height: 28, flexShrink: 0, alignItems: 'center', justifyContent: 'center', border: `1px solid ${session.current ? '#2E2E46' : '#191926'}`, borderRadius: '4px', background: '#191926' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="9" rx="2" stroke={session.current ? '#CFCDE3' : '#676582'} strokeWidth="1.3"/><path d="M6 12h4" stroke={session.current ? '#CFCDE3' : '#676582'} strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: session.current ? '#EDEBFA' : '#9A98B5', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500 }}>{session.device}</div>
                  <div style={{ marginTop: '1px', color: '#676582', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>{session.ip} · {session.time}</div>
                </div>
                {session.current ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, padding: '2px 7px', border: '1px solid #2E2E46', borderRadius: '2px', background: '#191926', color: '#7C7A98', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em' }}>
                    <span style={{ width: 4, height: 4, flexShrink: 0, borderRadius: '50%', background: '#8B7CFF' }} />
                    ТЕКУЩАЯ
                  </span>
                ) : (
                  <button style={{ padding: '3px 10px', border: '1px solid #191926', borderRadius: '3px', background: 'none', color: '#676582', fontFamily: 'Inter, sans-serif', fontSize: '11px', cursor: 'pointer', transition: 'all 0.12s' }} onMouseEnter={event => { event.currentTarget.style.color = '#EDEBFA'; event.currentTarget.style.borderColor = '#34344F' }} onMouseLeave={event => { event.currentTarget.style.color = '#676582'; event.currentTarget.style.borderColor = '#191926' }}>Завершить</button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
