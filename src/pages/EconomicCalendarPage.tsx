export default function EconomicCalendarPage({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted2)', padding: '4px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="var(--muted2)" strokeWidth="1.3"/>
            <path d="M5 1v3M11 1v3M1.5 6.5h13" stroke="var(--muted2)" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M4.5 10h2M4.5 12.5h2M9.5 10h2M9.5 12.5h2" stroke="var(--muted2)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>Экономический календарь</span>
        </div>
      </div>
      {/* Full-height TradingView economic calendar widget */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <iframe
          src="https://s.tradingview.com/embed-widget/events/?locale=ru#%7B%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22importanceFilter%22%3A%22-1%2C0%2C1%22%2C%22countryFilter%22%3A%22ar%2Cau%2Cbr%2Cca%2Ccn%2Cfr%2Cde%2Cin%2Cid%2Cit%2Cjp%2Ckr%2Cmx%2Cru%2Csa%2Cza%2Ctr%2Cgb%2Cus%2Ceu%22%7D"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          scrolling="yes"
          title="Economic Calendar"
        />
      </div>
    </div>
  )
}
