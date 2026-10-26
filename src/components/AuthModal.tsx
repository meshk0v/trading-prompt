import { useState } from 'react'
import { login, register, type AuthUser } from '../api/auth'
import Logo from './Logo'

const AUTH_PALETTE = {
  background: '#0B0B12',
  accent: '#8B7CFF',
  accentHover: '#A194FF',
  accentText: '#B9AFFF',
  cyanText: '#8EDDF7',
  onAccent: '#0D0A24',
  accentSoft: 'rgba(139,124,255,0.16)',
  accentBorder: 'rgba(139,124,255,0.35)',
  card: '#12121C',
  text: '#EDEBFA',
  muted: '#9A98B5',
  border: '#242436',
} as const

export default function AuthModal({ onClose, onAuth, onOpenLegal, initialTab = 'login' }: { onClose: () => void; onAuth: (user: AuthUser) => void; onOpenLegal?: () => void; initialTab?: 'login' | 'register' }) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [telegram, setTelegram] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (tab === 'register' && password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }
    if (tab === 'register' && !telegram.trim()) {
      setError('Укажите ваш Telegram в формате @username')
      return
    }
    if (tab === 'register' && !/^@[a-zA-Z0-9_]{3,}$/.test(telegram.trim())) {
      setError('Telegram должен быть в формате @username (минимум 3 символа)')
      return
    }
    if (tab === 'register' && !termsAccepted) {
      setError('Необходимо принять условия платформы')
      return
    }
    setLoading(true)
    try {
      const user = tab === 'register'
        ? await register({ name: name.trim(), email: email.trim(), telegram: telegram.trim(), password, termsAccepted })
        : await login(email.trim(), password)
      onAuth(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сервера')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    background: AUTH_PALETTE.background,
    border: `1px solid ${AUTH_PALETTE.border}`,
    borderRadius: '7px',
    padding: '0 14px',
    color: AUTH_PALETTE.text,
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  }

  const isDisabled = loading || (tab === 'register' && !termsAccepted)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100dvh',
        padding: '16px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="message-fade auth-modal"
        style={{
          width: '100%', maxWidth: 420,
          background: AUTH_PALETTE.card,
          border: `1px solid ${AUTH_PALETTE.border}`,
          borderRadius: '12px',
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          boxSizing: 'border-box',
          boxShadow: '0 32px 90px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(139, 124, 255, 0.05)',
        }}
      >
        {/* Modal header */}
        <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <Logo size={26} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '17px', color: AUTH_PALETTE.text, letterSpacing: '-0.2px' }}>Trading Prompt</span>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid transparent', cursor: 'pointer',
            color: AUTH_PALETTE.muted, width: 30, height: 30, borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s, border-color 0.15s, color 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = AUTH_PALETTE.background; e.currentTarget.style.borderColor = AUTH_PALETTE.border; e.currentTarget.style.color = AUTH_PALETTE.text }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = AUTH_PALETTE.muted }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ margin: '18px 20px 0', padding: '3px', display: 'flex', gap: '3px', background: AUTH_PALETTE.background, border: `1px solid ${AUTH_PALETTE.border}`, borderRadius: '8px' }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{
              flex: 1, height: 38,
              background: tab === t ? AUTH_PALETTE.accentSoft : 'transparent',
              border: `1px solid ${tab === t ? AUTH_PALETTE.accentBorder : 'transparent'}`,
              borderRadius: '6px',
              color: tab === t ? AUTH_PALETTE.accentText : AUTH_PALETTE.muted,
              fontSize: '13px', fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.15s',
              letterSpacing: '0.01em',
              position: 'relative',
            }}>
              {t === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {tab === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: AUTH_PALETTE.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Имя</label>
              <input
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = AUTH_PALETTE.accent; e.target.style.boxShadow = 'none' }}
                onBlur={e => { e.target.style.borderColor = AUTH_PALETTE.border; e.target.style.boxShadow = 'none' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: AUTH_PALETTE.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = AUTH_PALETTE.accent; e.target.style.boxShadow = 'none' }}
              onBlur={e => { e.target.style.borderColor = AUTH_PALETTE.border; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: AUTH_PALETTE.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Пароль</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ ...inputStyle, paddingRight: '38px' }}
                onFocus={e => { e.target.style.borderColor = AUTH_PALETTE.accent; e.target.style.boxShadow = 'none' }}
                onBlur={e => { e.target.style.borderColor = AUTH_PALETTE.border; e.target.style.boxShadow = 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 3, top: 0, bottom: 0, width: 36, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showPassword ? AUTH_PALETTE.accent : AUTH_PALETTE.muted, transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = AUTH_PALETTE.accent }}
                onMouseLeave={e => { e.currentTarget.style.color = showPassword ? AUTH_PALETTE.accent : AUTH_PALETTE.muted }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
                )}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: AUTH_PALETTE.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Повторите пароль</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: '38px' }}
                  onFocus={e => { e.target.style.borderColor = AUTH_PALETTE.accent; e.target.style.boxShadow = 'none' }}
                  onBlur={e => { e.target.style.borderColor = AUTH_PALETTE.border; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  style={{ position: 'absolute', right: 3, top: 0, bottom: 0, width: 36, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showConfirmPassword ? AUTH_PALETTE.accent : AUTH_PALETTE.muted, transition: 'color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = AUTH_PALETTE.accent }}
                  onMouseLeave={e => { e.currentTarget.style.color = showConfirmPassword ? AUTH_PALETTE.accent : AUTH_PALETTE.muted }}
                >
                  {showConfirmPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: AUTH_PALETTE.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                Telegram
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="@username"
                  value={telegram}
                  onChange={e => {
                    let v = e.target.value
                    if (v && !v.startsWith('@')) v = '@' + v
                    setTelegram(v)
                  }}
                  required
                  style={{ ...inputStyle, paddingLeft: '36px' }}
                  onFocus={e => { e.target.style.borderColor = AUTH_PALETTE.accent; e.target.style.boxShadow = 'none' }}
                  onBlur={e => { e.target.style.borderColor = AUTH_PALETTE.border; e.target.style.boxShadow = 'none' }}
                />
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M21.8 3.3L2.3 10.8c-1.3.5-1.3 1.3-.2 1.6l4.8 1.5 1.8 5.6c.2.6.5.9 1 .9.4 0 .6-.2.9-.5l2.1-2.1 4.4 3.2c.8.4 1.4.2 1.6-.7l2.9-13.8c.3-1.2-.5-1.7-1-1.2z" fill={AUTH_PALETTE.muted} stroke={AUTH_PALETTE.muted}/></svg>
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div
              onClick={() => setTermsAccepted(v => !v)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 12px',
                background: AUTH_PALETTE.background,
                border: `1px solid ${termsAccepted ? AUTH_PALETTE.accent : AUTH_PALETTE.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
                userSelect: 'none',
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                border: `1.5px solid ${termsAccepted ? AUTH_PALETTE.accent : AUTH_PALETTE.muted}`,
                background: termsAccepted ? AUTH_PALETTE.accent : AUTH_PALETTE.background,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {termsAccepted && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2 2L7.5 2" stroke={AUTH_PALETTE.onAccent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: '12px', color: AUTH_PALETTE.muted, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                Я принимаю{' '}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onClose(); onOpenLegal?.() }}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: AUTH_PALETTE.cyanText, cursor: 'pointer', fontSize: '12px',
                    fontFamily: 'Inter, sans-serif', textDecoration: 'underline',
                    textDecorationColor: 'rgba(139, 124, 255, 0.45)',
                    transition: 'color 0.13s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = AUTH_PALETTE.text }}
                  onMouseLeave={e => { e.currentTarget.style.color = AUTH_PALETTE.cyanText }}
                >
                  условия платформы
                </button>
                {', включая Пользовательское соглашение и Политику конфиденциальности'}
              </span>
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 14px',
              background: AUTH_PALETTE.background, border: `1px solid ${AUTH_PALETTE.accent}`,
              borderRadius: '6px', fontSize: '13px', color: AUTH_PALETTE.text,
              fontFamily: 'Inter, sans-serif',
            }}>{error}</div>
          )}

          <button type="submit" disabled={isDisabled} style={{
            marginTop: '2px',
            height: 40,
            background: isDisabled ? '#191926' : AUTH_PALETTE.accent,
            border: `1px solid ${isDisabled ? '#191926' : AUTH_PALETTE.accent}`,
            borderRadius: '6px',
            color: isDisabled ? '#676582' : AUTH_PALETTE.onAccent,
            fontSize: '14px', fontWeight: 700,
            fontFamily: 'Outfit, sans-serif',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            letterSpacing: '0.02em',
          }}
            onMouseEnter={e => { if (!isDisabled) { e.currentTarget.style.background = AUTH_PALETTE.accentHover; e.currentTarget.style.borderColor = AUTH_PALETTE.accentHover } }}
            onMouseLeave={e => { if (!isDisabled) { e.currentTarget.style.background = AUTH_PALETTE.accent; e.currentTarget.style.borderColor = AUTH_PALETTE.accent } }}
          >
            {loading ? (
              <><div style={{ width: 16, height: 16, border: '2px solid rgba(11, 15, 20, 0.3)', borderTopColor: AUTH_PALETTE.background, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Подождите...</>
            ) : tab === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>

          <p style={{ fontSize: '12px', color: AUTH_PALETTE.muted, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            {tab === 'login' ? (
              <>Нет аккаунта?{' '}
                <button type="button" onClick={() => { setTab('register'); setError('') }}
                  style={{ background: 'none', border: 'none', color: AUTH_PALETTE.cyanText, cursor: 'pointer', fontSize: '12px', padding: 0, fontFamily: 'inherit', transition: 'color 0.13s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = AUTH_PALETTE.text }}
                  onMouseLeave={e => { e.currentTarget.style.color = AUTH_PALETTE.cyanText }}
                >
                  Зарегистрироваться
                </button></>
            ) : (
              <>Уже есть аккаунт?{' '}
                <button type="button" onClick={() => { setTab('login'); setError('') }}
                  style={{ background: 'none', border: 'none', color: AUTH_PALETTE.cyanText, cursor: 'pointer', fontSize: '12px', padding: 0, fontFamily: 'inherit', transition: 'color 0.13s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = AUTH_PALETTE.text }}
                  onMouseLeave={e => { e.currentTarget.style.color = AUTH_PALETTE.cyanText }}
                >
                  Войти
                </button></>
            )}
          </p>
        </form>
      </div>
    </div>
  )
}
