import Logo from './Logo'

export default function PageFooter({ onNavigate, onOpenSettings }: { onNavigate?: (id: string) => void; onOpenSettings?: (sec: string) => void }) {
  const navLinks = [
    { label: 'Аккаунт',              action: () => onOpenSettings?.('account') },
    { label: 'Кредиты',              action: () => onOpenSettings?.('subscription') },
    { label: 'Настройки промпта',    action: () => onOpenSettings?.('prompt-settings') },
    { label: 'Партнёрская программа',action: () => onNavigate?.('affiliate') },
    { label: 'Поддержка и контакты', action: () => onNavigate?.('support') },
    { label: 'Вопросы и ответы',     action: () => onNavigate?.('faq') },
    { label: 'Правовая информация',  action: () => onNavigate?.('legal') },
  ]
  return (
    <footer className="authenticated-page-footer" style={{ position: 'absolute', right: 0, bottom: 0, left: 0, zIndex: 40, height: 64, borderTop: '1px solid var(--border)', background: 'var(--bg)', padding: '10px 20px', boxSizing: 'border-box' }}>
      <div style={{ width: 'min(1024px, 100%)', height: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600 }}>
          <Logo size={20} opacity={0.72} />
          Trading Prompt
        </div>
        <nav aria-label="Навигация в подвале" style={{ display: 'flex', minWidth: 0, overflowX: 'auto', flexWrap: 'nowrap', justifyContent: 'flex-end', gap: '4px 14px', scrollbarWidth: 'none' }}>
          {navLinks.map(link => (
            <button
              key={link.label}
              type="button"
              onClick={link.action}
              style={{ flexShrink: 0, padding: '4px 0', border: 0, background: 'transparent', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontSize: '11px', cursor: 'pointer', transition: 'color 0.15s', whiteSpace: 'nowrap' }}
              onMouseEnter={event => { event.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={event => { event.currentTarget.style.color = 'var(--muted)' }}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  )
}
