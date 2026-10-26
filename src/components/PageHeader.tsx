const PageHeader = ({ icon, title, description, onClose }: {
  icon: React.ReactNode
  title: string
  description?: React.ReactNode
  onClose?: () => void
}) => (
  <div className="page-hdr" style={{
    background: 'var(--bg)', borderBottom: '1px solid var(--border)',
    padding: '20px 32px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexShrink: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '5px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        color: 'var(--muted)',
      }}>
        {icon}
      </div>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text)', letterSpacing: '-0.2px' }}>
          {title}
        </h1>
        {description && (
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7C7A98', fontFamily: 'Inter, sans-serif' }}>
            {description}
          </p>
        )}
      </div>
    </div>
    {onClose && (
      <button onClick={onClose} style={{
        width: 36, height: 36, borderRadius: '5px',
        background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer',
        color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = '#2E2E46'; e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    )}
  </div>
)

export default PageHeader
