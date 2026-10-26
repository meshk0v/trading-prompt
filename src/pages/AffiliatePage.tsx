import { useState } from 'react'
import CustomSelect from '../components/CustomSelect'
import PageHeader from '../components/PageHeader'

const MOCK_PARTNERS = [
  { id: 'p1', name: 'Александр К.', email: 'ale***@gmail.com', date: '12.07.2026', status: 'active', earned: '$8.50', plan: 'Premium 3м' },
  { id: 'p2', name: 'Мария Т.', email: 'mar***@mail.ru', date: '18.07.2026', status: 'active', earned: '$3.20', plan: 'Premium 1м' },
  { id: 'p3', name: 'Дмитрий Р.', email: 'dmi***@yandex.ru', date: '22.07.2026', status: 'pending', earned: '$0.00', plan: 'Ожидает оплаты' },
  { id: 'p4', name: 'Светлана М.', email: 'sve***@gmail.com', date: '25.07.2026', status: 'active', earned: '$19.00', plan: 'Premium 1г' },
  { id: 'p5', name: 'Игорь Л.', email: 'igo***@proton.me', date: '01.08.2026', status: 'active', earned: '$3.20', plan: 'Premium 1м' },
  { id: 'p6', name: 'Анна С.', email: 'ann***@mail.ru', date: '03.08.2026', status: 'inactive', earned: '$0.00', plan: 'Отменён' },
]

const MOCK_WITHDRAWALS = [
  { id: 'w1', date: '28.07.2026', amount: '$11.70', wallet: 'TRX···xQ8F', status: 'completed' },
  { id: 'w2', date: '04.08.2026', amount: '$8.50', wallet: 'TRX···xQ8F', status: 'processing' },
]

type AffiliateLinkDemo = {
  id: string
  name: string
  url: string
  partnerIds: string[]
  activePartners: number
  earned: number
  pendingPayout: number
  removable: boolean
}

export default function AffiliatePage({ onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<'partners' | 'funds'>('partners')
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  const [selectedLinkId, setSelectedLinkId] = useState('all')
  const [addingLink, setAddingLink] = useState(false)
  const [newLinkName, setNewLinkName] = useState('')
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLinkDemo[]>([
    {
      id: 'standard',
      name: 'Стандартная ссылка',
      url: 'https://binum.ai/ref/USR-48291',
      partnerIds: MOCK_PARTNERS.map(partner => partner.id),
      activePartners: MOCK_PARTNERS.filter(partner => partner.status === 'active').length,
      earned: 34.90,
      pendingPayout: 22.70,
      removable: false,
    },
  ])
  const [wallet, setWallet] = useState('')
  const [walletNetwork, setWalletNetwork] = useState('TRC20')
  const [walletSaved, setWalletSaved] = useState(false)
  const selectedLink = affiliateLinks.find(link => link.id === selectedLinkId)
  const visiblePartners = selectedLink
    ? MOCK_PARTNERS.filter(partner => selectedLink.partnerIds.includes(partner.id))
    : MOCK_PARTNERS

  const handleCopy = (link: AffiliateLinkDemo) => {
    navigator.clipboard.writeText(link.url).catch(() => {})
    setCopiedLinkId(link.id)
    setTimeout(() => setCopiedLinkId(current => current === link.id ? null : current), 2000)
  }

  const handleCreateLink = () => {
    const name = newLinkName.trim()
    if (!name) return
    const id = `custom-${Date.now()}`
    setAffiliateLinks(current => [
      ...current,
      {
        id,
        name,
        url: `https://binum.ai/ref/USR-48291-${current.length + 1}`,
        partnerIds: [],
        activePartners: 0,
        earned: 0,
        pendingPayout: 0,
        removable: true,
      },
    ])
    setNewLinkName('')
    setAddingLink(false)
  }

  const handleDeleteLink = (id: string) => {
    setAffiliateLinks(current => current.filter(link => link.id !== id || !link.removable))
    setSelectedLinkId(current => current === id ? 'all' : current)
    setCopiedLinkId(current => current === id ? null : current)
  }

  const handleSaveWallet = () => {
    if (!wallet.trim()) return
    setWallet(wallet.trim())
    setWalletSaved(true)
  }

  const totalEarned = selectedLink
    ? selectedLink.earned
    : affiliateLinks.reduce((total, link) => total + link.earned, 0)
  const pendingPayout = selectedLink
    ? selectedLink.pendingPayout
    : affiliateLinks.reduce((total, link) => total + link.pendingPayout, 0)
  const activePartners = selectedLink
    ? selectedLink.activePartners
    : affiliateLinks.reduce((total, link) => total + link.activePartners, 0)

  const menuItems = [
    {
      id: 'partners' as const,
      label: 'Партнёры',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
          <circle cx="10.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M1 14c0-2.5 2-4.5 4.5-4.5M15 14c0-2.5-2-4.5-4.5-4.5M7 14c0-2.5 1.3-4 3-4s3 1.5 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'funds' as const,
      label: 'Средства',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="4" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M1 7h14" stroke="currentColor" strokeWidth="1.3"/>
          <circle cx="4.5" cy="10" r="1" fill="currentColor"/>
        </svg>
      ),
    },
  ]

  // ── Midnight Violet palette ───────────────────────────────
  const P = {
    bg:       '#0B0B12',
    surface:  '#12121C',
    card:     '#12121C',
    surface2: '#0F0F19',
    panel:    '#191926',
    text:     '#EDEBFA',
    muted:    '#9A98B5',
    mutedDim: '#676582',
    border:   '#191926',
    border2:  '#0F0F19',
    accent:   '#8B7CFF',
    accentHov:'#A194FF',
    accentDim:'#191926',
    accentBrd:'rgba(139,124,255,0.38)',
    positive: '#CFCDE3',
    shadow:   'rgba(0,0,0,0.4)',
    // button defaults
    btnBg:    '#8B7CFF',
    btnText:  '#0D0A24',
    btnBord:  '#8B7CFF',
    btnHovBg: '#A194FF',
    btnHovBord: '#A194FF',
  } as const

  return (
    <div className="message-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: P.bg }}>

      {/* Header */}
      <PageHeader
        icon={<svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 7L9.5 5M6.5 9L9.5 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>}
        title="Партнёрская программа"
        description="Приглашайте друзей и получайте 20% от их оплаты"
        onClose={onClose}
      />

      {/* Mobile tab bar */}
      <div className="affiliate-mobile-tabs" style={{ display: 'none', borderBottom: `1px solid ${P.border}`, background: P.surface, padding: '8px 16px', gap: '8px' }}>
        {menuItems.map(item => {
          const active = section === item.id
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              style={{
                flex: 1, height: 38,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                background: active ? P.btnBg : 'transparent',
                border: `1px solid ${P.btnBord}`,
                borderRadius: '6px',
                color: active ? P.btnText : P.btnBg,
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px', fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar — desktop only */}
        <div className="affiliate-sidebar" style={{
          width: 210, flexShrink: 0,
          background: P.surface,
          borderRight: `1px solid ${P.border}`,
          display: 'flex', flexDirection: 'column',
        }}>
          <nav style={{ padding: '10px 8px', flex: 1 }}>
            {menuItems.map(item => {
              const active = section === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  style={{
                    width: '100%', height: 40,
                    display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '0 11px',
                    background: active ? P.btnBg : 'transparent',
                    border: `1px solid ${active ? P.btnBord : 'transparent'}`,
                    borderRadius: '6px',
                    color: active ? P.btnText : P.muted,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px', fontWeight: active ? 600 : 500,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s', marginBottom: '3px',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#0F0F19'; e.currentTarget.style.color = P.btnBg } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = P.muted } }}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="page-body scrollable" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', boxSizing: 'border-box', minWidth: 0 }}>

          {/* PARTNERS */}
          {section === 'partners' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Referral links */}
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: P.text }}>Реферальные ссылки</div>
                    <div style={{ marginTop: '3px', fontSize: '11px', color: P.mutedDim, fontFamily: 'Inter, sans-serif' }}>Создавайте отдельную ссылку для каждого источника трафика</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddingLink(value => !value)}
                    style={{ height: 34, padding: '0 12px', border: `1px solid ${P.accentBrd}`, borderRadius: '6px', background: 'rgba(139,124,255,0.12)', color: P.accent, fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    Добавить ссылку
                  </button>
                </div>

                {addingLink && (
                  <div className="affiliate-link-create-form" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '10px', marginTop: '14px' }}>
                    <input
                      type="text"
                      value={newLinkName}
                      onChange={event => setNewLinkName(event.target.value)}
                      onKeyDown={event => { if (event.key === 'Enter') handleCreateLink() }}
                      placeholder="Введите имя, например Telegram или YouTube"
                      style={{ width: '100%', height: 38, border: `1px solid ${P.border}`, borderRadius: '6px', background: P.surface2, padding: '0 12px', color: P.text, fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateLink}
                      disabled={!newLinkName.trim()}
                      style={{ height: 38, padding: '0 16px', border: `1px solid ${newLinkName.trim() ? P.btnBord : P.border}`, borderRadius: '6px', background: newLinkName.trim() ? P.btnBg : P.accentDim, color: newLinkName.trim() ? P.btnText : P.mutedDim, fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, cursor: newLinkName.trim() ? 'pointer' : 'not-allowed' }}
                    >
                      Сохранить
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                  {affiliateLinks.map(link => (
                    <div key={link.id} className="affiliate-ref-link-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 0.7fr) minmax(0, 1.4fr) auto auto', gap: '10px', alignItems: 'center', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: '6px', background: P.surface2 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: P.text, fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600 }}>{link.name}</div>
                        {!link.removable && <div style={{ marginTop: '2px', color: P.accent, fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Стандартная</div>}
                      </div>
                      <div title={link.url} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: P.muted, fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>{link.url}</div>
                      <button
                        type="button"
                        onClick={() => handleCopy(link)}
                        style={{ height: 30, padding: '0 10px', border: `1px solid ${P.border}`, borderRadius: '5px', background: P.card, color: copiedLinkId === link.id ? P.accent : P.muted, fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {copiedLinkId === link.id ? 'Скопировано' : 'Копировать'}
                      </button>
                      {link.removable ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteLink(link.id)}
                          aria-label={`Удалить ссылку ${link.name}`}
                          style={{ width: 30, height: 30, padding: 0, border: '1px solid rgba(239,68,68,0.28)', borderRadius: '5px', background: 'rgba(239,68,68,0.08)', color: '#EF4444', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 4h9M5 4V2.5h4V4m-5.5 0 .6 8h5.8l.6-8M5.7 6.2v3.5M8.3 6.2v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      ) : <span style={{ width: 30 }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral link filter */}
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '18px 22px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 600, color: P.mutedDim, textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: 'Inter, sans-serif' }}>
                  Показывать статистику по ссылке
                </p>
                <div style={{ width: 'min(320px, 100%)' }}>
                  <CustomSelect
                    value={selectedLinkId}
                    onChange={value => {
                      setSelectedLinkId(value)
                    }}
                    options={[
                      { label: 'Все ссылки', value: 'all' },
                      ...affiliateLinks.map(link => ({ label: link.name, value: link.id })),
                    ]}
                    dropDown
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="affiliate-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', width: '100%' }}>
                {[
                  {
                    label: 'Всего партнёров', value: String(visiblePartners.length), note: selectedLink ? selectedLink.name : 'по всем ссылкам', accent: false,
                    icon: <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="5" r="2.3" stroke="currentColor" strokeWidth="1.3"/><circle cx="11.5" cy="5.5" r="1.8" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 14c0-2.7 1.5-4.5 3.5-4.5s3.5 1.8 3.5 4.5M9 10c1.9 0 3.5 1.5 3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                  },
                  {
                    label: 'Активных', value: String(activePartners), note: 'приносят доход', accent: false,
                    icon: <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M2 13V9M6 13V6M10 13V8M14 13V3M1 13.5h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                  },
                  {
                    label: 'Заработано', value: `$${totalEarned.toFixed(2)}`, note: 'за весь период', accent: false,
                    icon: <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 5.5H7.2a1.7 1.7 0 0 0 0 3.4h1.6a1.7 1.7 0 0 1 0 3.4H5.5M8 3.8v1.7M8 12.3V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
                  },
                  {
                    label: 'К выплате', value: `$${pendingPayout.toFixed(2)}`, note: 'доступно сейчас', accent: true,
                    icon: <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3"/><circle cx="5" cy="10" r="1.2" fill="currentColor"/></svg>,
                  },
                ].map(stat => (
                  <div
                    key={stat.label}
                    style={{ minWidth: 0, minHeight: 116, background: stat.accent ? 'linear-gradient(145deg, rgba(255,138,107,0.12) 0%, #12121C 72%)' : 'linear-gradient(145deg, #191926 0%, #12121C 72%)', border: `1px solid ${stat.accent ? 'rgba(255,138,107,0.38)' : '#2E2E46'}`, borderRadius: '10px', padding: '17px 18px', position: 'relative', overflow: 'hidden', boxSizing: 'border-box', transition: 'border-color 0.15s, transform 0.15s, background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = stat.accent ? '#FF8A6B' : '#34344F'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = stat.accent ? 'rgba(255,138,107,0.38)' : '#2E2E46'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ position: 'absolute', top: -26, right: -20, width: 82, height: 82, borderRadius: '50%', background: stat.accent ? 'rgba(255,138,107,0.12)' : 'rgba(255,255,255,0.025)', pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '13px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: stat.accent ? '#FFB4A0' : P.mutedDim, textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: 'Inter, sans-serif', lineHeight: 1.35 }}>{stat.label}</div>
                      <div style={{ width: 30, height: 30, borderRadius: '7px', background: stat.accent ? 'rgba(255,138,107,0.12)' : '#191926', border: `1px solid ${stat.accent ? 'rgba(255,138,107,0.38)' : '#2E2E46'}`, color: stat.accent ? '#FF8A6B' : '#9A98B5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {stat.icon}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '27px', fontWeight: 700, color: stat.accent ? '#FFB4A0' : P.text, lineHeight: 1, letterSpacing: '-0.04em' }}>{stat.value}</div>
                      <div style={{ fontSize: '10px', color: P.mutedDim, fontFamily: 'Inter, sans-serif', textAlign: 'right', lineHeight: 1.3 }}>{stat.note}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Partners list */}
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '13px 22px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: P.surface }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: P.text }}>Список партнёров</span>
                  <span style={{ fontSize: '12px', color: P.mutedDim, fontFamily: 'Inter, sans-serif' }}>{visiblePartners.length} пользователей</span>
                </div>
                <div style={{ height: 'min(300px, 48vh)', overflow: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', scrollbarColor: `${P.border} ${P.surface2}`, scrollbarGutter: 'stable' }}>
                  <div style={{ position: 'sticky', top: 0, zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1.2fr 110px 120px 160px', minWidth: '824px', padding: '8px 22px', background: P.surface2, borderBottom: `1px solid ${P.border2}` }}>
                    {['Имя', 'Email', 'Дата', 'Пополнения', 'Доход'].map(h => (
                      <span key={h} style={{ fontSize: '10px', fontWeight: 600, color: P.mutedDim, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif' }}>{h}</span>
                    ))}
                  </div>
                  {visiblePartners.map((p, i) => (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 110px 120px 160px', minWidth: '824px', padding: '11px 22px', borderBottom: i < visiblePartners.length - 1 ? `1px solid ${P.border2}` : 'none', alignItems: 'center', transition: 'background 0.1s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0F0F19' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ fontSize: '13px', color: P.text, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: '12px', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>{p.email}</span>
                      <span style={{ fontSize: '12px', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>{p.date}</span>
                      <span style={{ fontSize: '12px', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                        ${(Number.parseFloat(p.earned.replace('$', '')) / 0.2).toFixed(2)}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: P.text, fontFamily: 'JetBrains Mono, monospace' }}>{p.earned}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FUNDS */}
          {section === 'funds' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Wallet */}
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="4" width="14" height="9" rx="2" stroke={P.muted} strokeWidth="1.3"/>
                    <path d="M1 7h14" stroke={P.muted} strokeWidth="1.3"/>
                    <circle cx="4.5" cy="10" r="1" fill={P.accent}/>
                  </svg>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: P.text }}>Кошелёк для вывода</span>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: P.muted, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                  {walletSaved
                    ? 'Сохранённый кошелёк используется для автоматического получения выплат.'
                    : `Укажите адрес кошелька USDT (${walletNetwork}) для автоматического получения выплат.`}
                </p>
                {walletSaved ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px', border: '1px solid rgba(76,201,240,0.35)', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(76,201,240,0.12), rgba(76,201,240,0.035))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.035)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ display: 'grid', width: 40, height: 40, flexShrink: 0, placeItems: 'center', border: '1px solid rgba(76,201,240,0.35)', borderRadius: '7px', background: 'rgba(76,201,240,0.12)', color: '#4CC9F0' }}>
                        <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <rect x="2" y="5" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.4"/>
                          <path d="M2 8.5h16" stroke="currentColor" strokeWidth="1.4"/>
                          <circle cx="6" cy="12.5" r="1.2" fill="currentColor"/>
                        </svg>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                          <span style={{ color: '#8EDDF7', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>USDT · {walletNetwork}</span>
                          <span style={{ padding: '2px 6px', border: '1px solid rgba(76,201,240,0.35)', borderRadius: '3px', background: 'rgba(76,201,240,0.12)', color: '#8EDDF7', fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em' }}>СОХРАНЁН</span>
                        </div>
                        <div title={wallet} style={{ overflow: 'hidden', color: '#8EDDF7', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {wallet}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setWalletSaved(false)
                        setWallet('')
                      }}
                      style={{ display: 'inline-flex', height: 34, flexShrink: 0, alignItems: 'center', gap: '7px', padding: '0 11px', border: '1px solid rgba(139,124,255,0.3)', borderRadius: '6px', background: 'rgba(139,124,255,0.055)', color: '#8B7CFF', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(139,124,255,0.12)'
                        e.currentTarget.style.borderColor = 'rgba(139,124,255,0.52)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(139,124,255,0.055)'
                        e.currentTarget.style.borderColor = 'rgba(139,124,255,0.3)'
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M2.5 4h9M5 4V2.5h4V4m-5.5 0 .6 8h5.8l.6-8M5.7 6.2v3.5M8.3 6.2v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Удалить
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ width: '100%', maxWidth: 240, marginBottom: '12px' }}>
                      <div style={{ marginBottom: '6px', color: P.muted, fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Сеть выплат
                      </div>
                      <CustomSelect
                        value={walletNetwork}
                        onChange={setWalletNetwork}
                        options={[
                          { label: 'TRC20 · TRON', value: 'TRC20' },
                          { label: 'ERC20 · Ethereum', value: 'ERC20' },
                          { label: 'BEP20 · BNB Smart Chain', value: 'BEP20' },
                          { label: 'Polygon', value: 'Polygon' },
                        ]}
                        dropDown
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        className="affiliate-wallet-input"
                        type="text" placeholder={`Адрес кошелька USDT (${walletNetwork})`} value={wallet} onChange={e => setWallet(e.target.value)}
                        style={{ flex: 1, minWidth: 0, height: 44, background: '#191926', border: '1px solid #34344F', borderRadius: '7px', padding: '0 14px', color: '#EDEBFA', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#8B7CFF'; e.target.style.boxShadow = 'none' }}
                        onBlur={e => { e.target.style.borderColor = '#34344F'; e.target.style.boxShadow = 'none' }}
                      />
                      <button onClick={handleSaveWallet}
                        style={{ height: 40, padding: '0 20px', flexShrink: 0, background: P.btnBg, border: `1px solid ${P.btnBord}`, borderRadius: '6px', color: P.btnText, fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.18s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = P.btnHovBg; e.currentTarget.style.borderColor = P.btnHovBord }}
                        onMouseLeave={e => { e.currentTarget.style.background = P.btnBg; e.currentTarget.style.borderColor = P.btnBord }}
                      >
                        Сохранить
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Payout info */}
              <div style={{ background: P.surface2, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '18px 22px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '6px', background: P.card, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <circle cx="7.5" cy="7.5" r="6" stroke={P.muted} strokeWidth="1.3"/>
                    <path d="M7.5 4.5v4M7.5 10v.5" stroke={P.accent} strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: '0 0 8px', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '13px', color: P.text }}>Условия выплат</p>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {['Выплаты производятся автоматически в момент пополнения реферала', 'Минимальная сумма вывода — нет (выплаты автоматические)', 'Комиссия за вывод от $0.01 до $2 в зависимости от сети (TRC20, ERC20, BEP20, Polygon)', 'Валюта выплат — USDT', 'Ваш реферальный доход — 50% от каждой оплаты реферала'].map((line, i) => (
                      <li key={i} style={{ fontSize: '13px', color: P.muted, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Balance tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Доступно к выводу', value: '$22.70' },
                  { label: 'Следующая выплата', value: '11.08.2026' },
                ].map(item => (
                  <div key={item.label} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '18px 20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: P.mutedDim, fontFamily: 'Inter, sans-serif', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{item.label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '24px', fontWeight: 700, color: P.text }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Withdrawal history */}
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', overflowX: 'auto', overflowY: 'hidden' }}>
                <div style={{ padding: '13px 22px', borderBottom: `1px solid ${P.border}`, background: P.surface }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: P.text }}>История выводов</span>
                </div>
                {MOCK_WITHDRAWALS.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: P.mutedDim, fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>Выводов пока не было</div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 90px', padding: '8px 22px', background: P.surface2, borderBottom: `1px solid ${P.border2}` }}>
                      {['Дата', 'Сумма', 'Кошелёк', 'Статус'].map(h => (
                        <span key={h} style={{ fontSize: '10px', fontWeight: 600, color: P.mutedDim, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif' }}>{h}</span>
                      ))}
                    </div>
                    {MOCK_WITHDRAWALS.map((w, i) => (
                      <div key={w.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 90px', padding: '12px 22px', borderBottom: i < MOCK_WITHDRAWALS.length - 1 ? `1px solid ${P.border2}` : 'none', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>{w.date}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: P.positive, fontFamily: 'JetBrains Mono, monospace' }}>{w.amount}</span>
                        <span style={{ fontSize: '12px', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>{w.wallet}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: w.status === 'completed' ? P.positive : P.text }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: w.status === 'completed' ? P.accent : P.muted }} />
                          {w.status === 'completed' ? 'Выплачено' : 'В обработке'}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
