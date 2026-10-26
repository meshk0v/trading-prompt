// @refresh reset
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { fetchCurrentUser, logout, type AuthUser } from './authApi'
import { createPromptPdf } from './promptPdf'
import MessageContent from './components/MessageContent'
import FaqPage from './components/FaqPage'
import PromptBuilderGuide from './components/PromptBuilderGuide'
import PromptPanelResizeHandle from './components/PromptPanelResizeHandle'
import PublicAffiliatePage from './components/PublicAffiliatePage'
import { applyAppLanguage, type AppLanguage } from './i18n'
import {
  AccountBalanceSummary,
  AffiliatePage,
  AuthModal,
  Binum_LOGO,
  CURRENCY_PAIRS,
  CustomSelect,
  DEFAULT_WATCHLIST,
  EconomicCalendarPage,
  GREETINGS,
  LegalPage,
  PLAN_CYCLE,
  PageFooter,
  PairFlag,
  PAIR_CATEGORIES,
  PromptTradingView,
  SettingsPage,
  SupportPage,
  TIMEFRAME_OPTIONS,
  UserMenu,
  buildCandles,
  formatTime,
  generateFundamentals,
  generateIndicators,
  generateVolumeData,
  type Message,
  type PlanTier,
} from './appSupport'

const ASSET_TYPE_OPTIONS = [
  'Crypto',
  'Major',
  'Minor',
  'Exotic',
]
  .map(type => ({ label: type, value: type }))

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [guestAiMenuOpen, setGuestAiMenuOpen] = useState(false)
  const [selectedAssetType, setSelectedAssetType] = useState('Major')
  const [selectedPair, setSelectedPair] = useState('EUR/USD')
  const [selectedTimeframe, setSelectedTimeframe] = useState('M5')
  const [selectedTimeframe2, setSelectedTimeframe2] = useState('')
  const [selectedTimeframe3, setSelectedTimeframe3] = useState('')
  const [priceHistory, setPriceHistory] = useState('1000')
  const [indicatorHistory, setIndicatorHistory] = useState('1000')
  const [promptPurpose, setPromptPurpose] = useState('')
  const [promptPanelWidth, setPromptPanelWidth] = useState(400)
  const [mobilePromptSettingsOpen, setMobilePromptSettingsOpen] = useState(false)
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null)
  const [copiedPdfId, setCopiedPdfId] = useState<string | null>(null)
  const [pdfErrorId, setPdfErrorId] = useState<string | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [affiliateOpen, setAffiliateOpen] = useState(false)
  const [legalOpen, setLegalOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)
  const [faqInitialCategory, setFaqInitialCategory] = useState<'Все' | 'Партнёрская программа'>('Все')
  const [language, setLanguage] = useState<AppLanguage>(() => {
    try {
      return localStorage.getItem('trading-prompt-language') === 'en' ? 'en' : 'ru'
    } catch {
      return 'ru'
    }
  })
  const [settingsSection, setSettingsSection] = useState('account')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [guestRequests, setGuestRequests] = useState(0)
  const [userRequests, setUserRequests] = useState(0)
  const [limitModal, setLimitModal] = useState<'guest' | 'user' | null>(null)
  const [emailHidden, setEmailHidden] = useState(false)
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST)
  const [activeTab, setActiveTab] = useState('chat')
  const [userPlan, setUserPlan] = useState<PlanTier>('free')
  const bottomRef = useRef<HTMLDivElement>(null)
  const categoryInstruments = PAIR_CATEGORIES[selectedAssetType as keyof typeof PAIR_CATEGORIES] ?? CURRENCY_PAIRS
  const watchedCategoryInstruments = categoryInstruments.filter(pair => watchlist.includes(pair))
  const availableInstruments = watchedCategoryInstruments.length > 0 ? watchedCategoryInstruments : categoryInstruments
  const handleAssetTypeChange = (assetType: string) => {
    const instruments = PAIR_CATEGORIES[assetType as keyof typeof PAIR_CATEGORIES] ?? CURRENCY_PAIRS
    const watchedInstruments = instruments.filter(pair => watchlist.includes(pair))
    const nextInstruments = watchedInstruments.length > 0 ? watchedInstruments : instruments
    setSelectedAssetType(assetType)
    setSelectedPair(nextInstruments[0])
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'black')
  }, [])

  useEffect(() => {
    if (!availableInstruments.includes(selectedPair)) {
      setSelectedPair(availableInstruments[0])
    }
  }, [selectedAssetType, watchlist]) // eslint-disable-line react-hooks/exhaustive-deps

  const FREE_LIMIT = 3
  const usedPrompts = user ? userRequests : guestRequests
  const remainingPrompts = Math.max(0, FREE_LIMIT - usedPrompts)
  const timeframeFields = [
    { label: 'TF 1', value: selectedTimeframe, onChange: setSelectedTimeframe },
    { label: 'TF 2', value: selectedTimeframe2, onChange: setSelectedTimeframe2, placeholder: 'Выбрать' },
    { label: 'TF 3', value: selectedTimeframe3, onChange: setSelectedTimeframe3, placeholder: 'Выбрать' },
  ]

  const handleAuth = useCallback((authUser: AuthUser) => {
    setUser(authUser)
    setAuthOpen(false)
    setUserRequests(0)
  }, [])

  const handleLogout = useCallback(() => {
    setUser(null)
    logout().catch(() => {})
  }, [])

  useEffect(() => {
    fetchCurrentUser().then(setUser).catch(() => {})
  }, [])

  useEffect(() => {
    let greetIdx = 0
    try {
      greetIdx = ((parseInt(localStorage.getItem('trading_prompt_greeting_idx') || '-1', 10) + 1) % GREETINGS.length)
      localStorage.setItem('trading_prompt_greeting_idx', String(greetIdx))
    } catch { greetIdx = 0 }
    const greeting = GREETINGS[greetIdx]
    const timestamp = new Date()
    let intervalId: ReturnType<typeof setInterval> | undefined

    setIsTyping(true)
    const startId = setTimeout(() => {
      let visibleLength = 0
      setIsTyping(false)
      setMessages([{ id: 'greeting', role: 'assistant', content: '', timestamp }])

      intervalId = setInterval(() => {
        visibleLength = Math.min(greeting.length, visibleLength + 10)
        setMessages([{ id: 'greeting', role: 'assistant', content: greeting.slice(0, visibleLength), timestamp }])
        if (visibleLength >= greeting.length && intervalId) clearInterval(intervalId)
      }, 20)
    }, 350)

    return () => {
      clearTimeout(startId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleGeneratePrompt = () => {
    if (usedPrompts >= FREE_LIMIT) {
      setLimitModal(user ? 'user' : 'guest')
      return
    }

    const purpose = promptPurpose.trim()
    const parsedPriceHistory = Number(priceHistory)
    const parsedIndicatorHistory = Number(indicatorHistory)
    const requestedPriceHistory = Number.isFinite(parsedPriceHistory) && parsedPriceHistory >= 1 ? Math.floor(parsedPriceHistory) : 1000
    const requestedIndicatorHistory = Number.isFinite(parsedIndicatorHistory) && parsedIndicatorHistory >= 1 ? Math.floor(parsedIndicatorHistory) : 1000
    const requestedTimeframes = [selectedTimeframe, selectedTimeframe2, selectedTimeframe3].filter(Boolean).join(', ')

    const now = Date.now()
    const indicators = generateIndicators('WAIT', selectedPair).slice(0, 8)
      .map(item => `• ${item.name} (${item.param}): ${item.value}; оценка ${item.signal}`).join('\n')
    const candles = buildCandles('WAIT', now).slice(-6)
      .map((item, index) => `• Свеча ${index + 1}: O ${item.o.toFixed(2)}, H ${item.h.toFixed(2)}, L ${item.l.toFixed(2)}, C ${item.c.toFixed(2)}`).join('\n')
    const volumes = generateVolumeData('WAIT', selectedPair).slice(0, 5)
      .map(item => `• ${item.exchange} / ${item.instrument}: объём ${item.volume}, изменение ${item.change}`).join('\n')
    const fundamentals = generateFundamentals('WAIT', selectedPair).slice(0, 5)
      .map(item => `• ${item.country}: ${item.name} (${item.period}) — значение ${item.actual}, прогноз ${item.forecast}, ранее ${item.previous}`).join('\n')
    const prompt = [
      ...(purpose ? [purpose] : []),
      `Инструмент: ${selectedPair}\nТип актива: ${selectedAssetType}\nТаймфреймы: ${requestedTimeframes}\nИстория цены: ${requestedPriceHistory} баров\nИстория индикаторов: ${requestedIndicatorHistory} баров`,
      `Индикаторы (учебные, вымышленные):\n${indicators}`,
      `Свечи OHLC (учебные, вымышленные, условный индекс):\n${candles}`,
      `Объёмы (учебные, вымышленные):\n${volumes}`,
      `Фундаментальные показатели (учебные, вымышленные):\n${fundamentals}`,
    ].join('\n\n')

    setMessages(prev => [...prev,
      {
        id: `${now}-user`, role: 'user',
        content: `Запрос промпта: **${selectedPair}** · Период графика **${selectedTimeframe}**`,
        timestamp: new Date(),
      },
      {
        id: `${now}-prompt`, role: 'assistant',
        content: 'Готовый учебный промпт. Скачайте PDF или скопируйте текст для выбранного вами ИИ:',
        prompt,
        chart: {
          pair: selectedPair,
          timeframe: selectedTimeframe,
        },
        timestamp: new Date(),
      },
    ])
    setCopiedPromptId(null)
    setCopyErrorId(null)
    setCopiedPdfId(null)
    setPdfErrorId(null)
    if (user) {
      setUserRequests(userRequests + 1)
      if (userRequests + 1 === FREE_LIMIT) setLimitModal('user')
    } else {
      setGuestRequests(guestRequests + 1)
      if (guestRequests + 1 === FREE_LIMIT) setLimitModal('guest')
    }
  }

  const handleCopyPrompt = async (id: string, prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPromptId(id)
      setCopyErrorId(null)
    } catch {
      setCopyErrorId(id)
      setCopiedPromptId(null)
    }
  }

  const handlePromptPdf = async (id: string, prompt: string, copy: boolean) => {
    try {
      const pdf = await createPromptPdf(prompt)
      if (copy) {
        if (!navigator.clipboard?.write || !ClipboardItem.supports?.('application/pdf')) {
          throw new Error('PDF clipboard is unsupported')
        }
        await navigator.clipboard.write([new ClipboardItem({ 'application/pdf': pdf })])
        setCopiedPdfId(id)
      } else {
        const url = URL.createObjectURL(pdf)
        const link = document.createElement('a')
        link.href = url
        link.download = 'binum-prompt.pdf'
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 60000)
      }
      setPdfErrorId(null)
    } catch {
      setPdfErrorId(id)
    }
  }

  const isChatView = !affiliateOpen && !legalOpen && !supportOpen && !settingsOpen && !calendarOpen && !faqOpen

  useEffect(() => {
    try {
      localStorage.setItem('trading-prompt-language', language)
    } catch {
      // Language switching still works when storage is unavailable.
    }
    return applyAppLanguage(language)
  }, [language])

  const openAffiliateFromMenu = () => {
    setActiveTab('affiliate')
    setAffiliateOpen(true)
    setFaqOpen(false)
    setSettingsOpen(false)
    setSupportOpen(false)
    setLegalOpen(false)
    setCalendarOpen(false)
    setSidebarOpen(false)
  }
  const openFaqFromMenu = () => {
    setFaqInitialCategory('Все')
    setActiveTab('faq')
    setFaqOpen(true)
    setAffiliateOpen(false)
    setSettingsOpen(false)
    setSupportOpen(false)
    setLegalOpen(false)
    setCalendarOpen(false)
    setSidebarOpen(false)
  }

  return (
    <div className={`app-root${isChatView ? ' home-inter-font' : ''}`} style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif', position: 'relative', transition: 'background 0.25s, color 0.25s', color: 'var(--text)' }}>

      {/* Backdrop — mobile only (desktop nav replaces sidebar) */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 30,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(1px)',
          }}
        />
      )}

      {/* Hamburger — authorized users on all screens, guests on mobile */}
      {!sidebarOpen && (
        <div className={user ? undefined : 'guest-mobile-menu-trigger'} style={{ position: 'fixed', top: 8, right: 12, zIndex: 50, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Hamburger button */}
          <button
            data-prompt-guide="main-menu"
            onClick={() => setSidebarOpen(o => !o)}
            className="main-menu-button"
            aria-label="Открыть меню"
            title="Открыть меню"
          >
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
              <rect width="22" height="2" rx="1" fill="currentColor" />
              <rect y="7" width="22" height="2" rx="1" fill="currentColor" />
              <rect y="14" width="22" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}

      {/* Sidebar — mobile only overlay */}
      <aside className="mobile-sidebar" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 256,
        background: 'var(--card)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 40,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: sidebarOpen ? '-4px 0 24px rgba(0,0,0,0.4)' : 'none',
      }}>
        {/* Top bar: logo */}
        <div style={{
          padding: '0 12px 0 56px',
          height: 56,
          borderBottom: '1px solid var(--border2)',
          display: 'flex', alignItems: 'center', gap: '8px',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            whiteSpace: 'nowrap', overflow: 'hidden',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'Outfit, sans-serif', fontWeight: 400, fontSize: '18px', color: 'var(--text)', letterSpacing: '-0.2px' }}>
              <Binum_LOGO size={24} />
              Trading Prompt
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', gap: '2px', overflowY: 'auto' }}>
          {user ? (
            <div data-prompt-guide="authorized-menu-items" className="account-menu-icons" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <AccountBalanceSummary remaining={remainingPrompts} className="account-balance-summary--mobile" />

              {([
                { id: 'account',      label: 'Аккаунт',               action: () => { setSettingsSection('account');      setSettingsOpen(true); setAffiliateOpen(false); setSupportOpen(false); setLegalOpen(false); setCalendarOpen(false); setFaqOpen(false); setSidebarOpen(false) }, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.2" stroke="#7C7A98" strokeWidth="1.3"/><path d="M2 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#7C7A98" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                { id: 'subscription', label: 'Кредиты',                action: () => { setSettingsSection('subscription'); setSettingsOpen(true); setAffiliateOpen(false); setSupportOpen(false); setLegalOpen(false); setCalendarOpen(false); setFaqOpen(false); setSidebarOpen(false) }, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="#7C7A98" strokeWidth="1.3"/><path d="M1.5 6h11" stroke="#7C7A98" strokeWidth="1.3"/><circle cx="4" cy="9" r="1" fill="currentColor"/></svg> },
                { id: 'prompt-settings', label: 'Настройки', action: () => { setSettingsSection('prompt-settings'); setSettingsOpen(true); setAffiliateOpen(false); setSupportOpen(false); setLegalOpen(false); setCalendarOpen(false); setFaqOpen(false); setSidebarOpen(false) }, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="#7C7A98" strokeWidth="1.3"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M2.8 11.2l1.4-1.4M9.8 4.2l1.4-1.4" stroke="#7C7A98" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                { id: 'affiliate',    label: 'Партнёрская программа',  action: openAffiliateFromMenu, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="4" cy="5" r="2" stroke="#7C7A98" strokeWidth="1.3"/><circle cx="10" cy="5" r="2" stroke="#7C7A98" strokeWidth="1.3"/><path d="M1 13c0-2 1.3-3.5 3-3.5M13 13c0-2-1.3-3.5-3-3.5M6 13c0-1.8 1-3 2-3s2 1.2 2 3" stroke="#7C7A98" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                { id: 'support',      label: 'Поддержка и контакты',   action: () => { setSupportOpen(true); setSettingsOpen(false); setAffiliateOpen(false); setLegalOpen(false); setCalendarOpen(false); setFaqOpen(false); setSidebarOpen(false) }, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#7C7A98" strokeWidth="1.3"/><path d="M7 9V7.5c1.2-.3 2-1.2 2-2.5a2 2 0 0 0-4 0" stroke="#7C7A98" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7" cy="11" r="0.7" fill="currentColor"/></svg> },
                { id: 'faq',          label: 'Вопросы и ответы',       action: openFaqFromMenu, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#7C7A98" strokeWidth="1.3"/><path d="M5.4 5.4a1.7 1.7 0 1 1 2.5 1.5c-.7.4-.9.8-.9 1.5M7 10.5v.1" stroke="#7C7A98" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                { id: 'calendar',     label: 'Экономический календарь', action: () => { setCalendarOpen(true); setSettingsOpen(false); setAffiliateOpen(false); setSupportOpen(false); setLegalOpen(false); setFaqOpen(false); setSidebarOpen(false) }, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="#7C7A98" strokeWidth="1.3"/><path d="M4.5 1v3M9.5 1v3M1.5 6h11" stroke="#7C7A98" strokeWidth="1.3" strokeLinecap="round"/><path d="M4 9h1.5M4 11.5h1.5M8.5 9h1.5M8.5 11.5h1.5" stroke="#7C7A98" strokeWidth="1.2" strokeLinecap="round"/></svg> },
                { id: 'legal',        label: 'Правовая информация',    action: () => { setLegalOpen(true); setSettingsOpen(false); setAffiliateOpen(false); setSupportOpen(false); setCalendarOpen(false); setFaqOpen(false); setSidebarOpen(false) }, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="#7C7A98" strokeWidth="1.3"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="#7C7A98" strokeWidth="1.1" strokeLinecap="round"/></svg> },
              ] as const).map(item => (
                <div key={item.id} onClick={item.action} className="account-menu-button"
                  style={{ minHeight: 40, borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px', cursor: 'pointer', color: 'var(--muted)', fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, transition: 'background 0.15s, color 0.15s', userSelect: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
                >
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}

              {/* Logout */}
              <div onClick={() => { handleLogout(); setSidebarOpen(false) }} className="account-menu-button"
                style={{ minHeight: 40, borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px', cursor: 'pointer', color: 'var(--muted)', fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, transition: 'background 0.15s, color 0.15s', userSelect: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
              >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}><svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M5 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3M9 10l4-3-4-3M13 7H5" stroke="#7C7A98" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                <span>Выйти</span>
              </div>

            </div>
          ) : (
            <div data-prompt-guide="guest-menu-items" className="guest-mobile-menu" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button
                type="button"
                className="account-menu-button"
                onClick={() => { setSidebarOpen(false); setAuthOpen(true) }}
                style={{ minHeight: 42, border: 0, borderRadius: '5px', background: 'transparent', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                Войти
              </button>

              <button
                type="button"
                className="account-menu-button"
                aria-expanded={guestAiMenuOpen}
                onClick={() => setGuestAiMenuOpen(value => !value)}
                style={{ minHeight: 42, border: 0, borderRadius: '5px', background: 'transparent', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M9.5 2H14v4.5M14 2 7.5 8.5M12.5 9v3.5a1.5 1.5 0 0 1-1.5 1.5H3.5A1.5 1.5 0 0 1 2 12.5V5a1.5 1.5 0 0 1 1.5-1.5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ flex: 1 }}>Ссылки на ИИ</span>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ transform: guestAiMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="m2.5 4.5 3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>

              {guestAiMenuOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '0 0 4px 25px', paddingLeft: '10px', borderLeft: '1px solid var(--border)' }}>
                  {[
                    { label: 'ChatGPT', href: 'https://chatgpt.com/' },
                    { label: 'Claude', href: 'https://claude.ai/' },
                    { label: 'Gemini', href: 'https://gemini.google.com/app' },
                  ].map(ai => (
                    <a key={ai.label} href={ai.href} target="_blank" rel="noreferrer" onClick={() => setSidebarOpen(false)}
                      style={{ minHeight: 34, display: 'flex', alignItems: 'center', gap: '8px', padding: '0 10px', borderRadius: '5px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontSize: '12px', textDecoration: 'none' }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                      {ai.label}
                    </a>
                  ))}
                </div>
              )}

              {([
                {
                  id: 'affiliate',
                  label: 'Партнёрская программа',
                  action: openAffiliateFromMenu,
                  icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="4" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 13c0-2 1.3-3.5 3-3.5M13 13c0-2-1.3-3.5-3-3.5M6 13c0-1.8 1-3 2-3s2 1.2 2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                },
                {
                  id: 'faq',
                  label: 'Вопросы и ответы',
                  action: openFaqFromMenu,
                  icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5.4 5.4a1.7 1.7 0 1 1 2.5 1.5c-.7.4-.9.8-.9 1.5M7 10.5v.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                },
                {
                  id: 'legal',
                  label: 'Правовая информация',
                  action: () => { setActiveTab('legal'); setLegalOpen(true); setAffiliateOpen(false); setSupportOpen(false); setSettingsOpen(false); setCalendarOpen(false); setFaqOpen(false); setSidebarOpen(false) },
                  icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
                },
              ] as const).map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="account-menu-button"
                  onClick={item.action}
                  style={{ minHeight: 42, border: 0, borderRadius: '5px', background: 'transparent', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>


      </aside>

      {/* Main */}
      <main
        className={`${isChatView ? 'chat-main ' : ''}${user ? 'has-auth-footer' : ''}`.trim() || undefined}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
          position: 'relative',
          '--prompt-panel-width': `${promptPanelWidth}px`,
        } as CSSProperties}
      >
        {/* Header */}
        <header style={{
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)', flexShrink: 0, zIndex: 10,
        }}>
          {/* Single header row: logo left, nav + auth right */}
          {/* Right padding reserves room for the fixed hamburger button (36px + 12px offset + gap) */}
          <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 58px 0 16px', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <Binum_LOGO size={28} opacity={0.82} />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 400, fontSize: '18px', color: 'var(--text)', letterSpacing: '-0.2px' }}>Trading Prompt</span>
            </div>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              className="language-switcher"
              onClick={() => setLanguage(current => current === 'ru' ? 'en' : 'ru')}
              aria-label={language === 'ru' ? 'Switch to English' : 'Switch to Russian'}
              title={language === 'ru' ? 'English' : 'Russian'}
            >
              <span className={`fi fi-${language === 'ru' ? 'gb' : 'ru'}`} aria-hidden="true" />
            </button>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none' }}>
                <UserMenu
                  className="nav-desktop"
                  email={user.email}
                  emailHidden={emailHidden}
                  onToggleEmail={() => setEmailHidden(v => !v)}
                  remaining={Math.max(0, FREE_LIMIT - userRequests)}
                  plan={userPlan}
                  onCyclePlan={() => setUserPlan(p => PLAN_CYCLE[(PLAN_CYCLE.indexOf(p) + 1) % PLAN_CYCLE.length])}
                  onLogout={handleLogout}
                  onNavigate={(id) => {
                    if (id === 'faq') setFaqInitialCategory('Все')
                    setActiveTab(id)
                    setAffiliateOpen(id === 'affiliate')
                    setSupportOpen(id === 'support')
                    setLegalOpen(id === 'legal')
                    setCalendarOpen(id === 'calendar')
                    setFaqOpen(id === 'faq')
                    setSettingsOpen(false)
                  }}
                  onOpenSettings={(sec) => {
                    setSettingsSection(sec)
                    setSettingsOpen(true)
                    setAffiliateOpen(false)
                    setSupportOpen(false)
                    setLegalOpen(false)
                    setCalendarOpen(false)
                    setFaqOpen(false)
                  }}
                  userId={user.id}
                  name={user.name}
                />
              </div>
            ) : (
              <div data-prompt-guide="guest-desktop-menu-items" className="guest-header-actions">
                <div className="guest-header-links" aria-label="Навигация для гостя">
                  <div className="guest-ai-links">
                    <button data-prompt-guide="guest-menu-trigger" type="button" className="guest-header-link" aria-haspopup="true">
                      Ссылки на ИИ
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="m2.5 4.5 3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <div className="guest-ai-menu">
                      {[
                        { label: 'ChatGPT', href: 'https://chatgpt.com/' },
                        { label: 'Claude', href: 'https://claude.ai/' },
                        { label: 'Gemini', href: 'https://gemini.google.com/app' },
                      ].map(ai => (
                        <a key={ai.label} href={ai.href} target="_blank" rel="noreferrer">
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M9.5 2H14v4.5M14 2 7.5 8.5M12.5 9v3.5a1.5 1.5 0 0 1-1.5 1.5H3.5A1.5 1.5 0 0 1 2 12.5V5a1.5 1.5 0 0 1 1.5-1.5H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {ai.label}
                        </a>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="guest-header-link"
                    onClick={() => {
                      setActiveTab('affiliate')
                      setAffiliateOpen(true)
                      setLegalOpen(false)
                      setSupportOpen(false)
                      setSettingsOpen(false)
                      setCalendarOpen(false)
                      setFaqOpen(false)
                    }}
                  >
                    Партнёрская программа
                  </button>
                  <button
                    type="button"
                    className="guest-header-link"
                    onClick={() => {
                      setFaqInitialCategory('Все')
                      setActiveTab('faq')
                      setFaqOpen(true)
                      setAffiliateOpen(false)
                      setLegalOpen(false)
                      setSupportOpen(false)
                      setSettingsOpen(false)
                      setCalendarOpen(false)
                    }}
                  >
                    Вопросы и ответы
                  </button>
                  <button
                    type="button"
                    className="guest-header-link"
                    onClick={() => {
                      setActiveTab('legal')
                      setLegalOpen(true)
                      setAffiliateOpen(false)
                      setSupportOpen(false)
                      setSettingsOpen(false)
                      setCalendarOpen(false)
                      setFaqOpen(false)
                    }}
                  >
                    Правовая информация
                  </button>
                </div>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="auth-header-button"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Войти
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        {(() => {
          const nav = (id: string) => { if (id === 'faq') setFaqInitialCategory('Все'); setActiveTab(id); setAffiliateOpen(id === 'affiliate'); setSupportOpen(id === 'support'); setLegalOpen(id === 'legal'); setFaqOpen(id === 'faq'); setCalendarOpen(false); setSettingsOpen(false) }
          return (<>
            {affiliateOpen && (user
              ? <AffiliatePage onClose={() => { setAffiliateOpen(false); setActiveTab('chat') }} />
              : <PublicAffiliatePage onClose={() => { setAffiliateOpen(false); setActiveTab('chat') }} onSignUp={() => setAuthOpen(true)} onOpenFaq={() => nav('faq')} />
            )}
            {legalOpen && <LegalPage onClose={() => { setLegalOpen(false); setActiveTab('chat') }} />}
            {supportOpen && <SupportPage onClose={() => { setSupportOpen(false); setActiveTab('chat') }} />}
            {settingsOpen && <SettingsPage user={user} onUserUpdate={setUser} initialSection={settingsSection} onClose={() => { setSettingsOpen(false); setActiveTab('chat') }} watchlist={watchlist} setWatchlist={setWatchlist} />}
            {calendarOpen && <EconomicCalendarPage onClose={() => { setCalendarOpen(false); setActiveTab('chat') }} />}
            {faqOpen && <FaqPage initialCategory={faqInitialCategory} onClose={() => { setFaqOpen(false); setFaqInitialCategory('Все'); setActiveTab('chat') }} user={user} onSignUp={() => setAuthOpen(true)} onNavigate={nav} onOpenSettings={(sec) => { setSettingsSection(sec); setSettingsOpen(true); setAffiliateOpen(false); setSupportOpen(false); setLegalOpen(false); setCalendarOpen(false); setFaqOpen(false) }} />}
          </>)
        })()}

        {/* Messages */}
        <div data-prompt-guide="prompt-result" className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '24px 0', display: (affiliateOpen || legalOpen || supportOpen || settingsOpen || calendarOpen || faqOpen) ? 'none' : undefined }}>
          {messages.map(msg => (
            <div key={msg.id} className="message-fade" style={{
              padding: '20px 0',
              background: msg.id === 'greeting' || msg.prompt ? 'rgba(18,18,28,0.52)' : msg.role === 'assistant' ? 'var(--msg-assistant-bg)' : 'var(--accent-soft)',
              borderTop: `1px solid ${msg.role === 'assistant' ? 'var(--border)' : 'var(--accent-border)'}`,
              borderBottom: `1px solid ${msg.role === 'assistant' ? 'var(--border)' : 'var(--accent-border)'}`,
            }}>
              <div className="msg-inner" style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px', display: 'flex', gap: '16px' }}>
                <div style={{ flexShrink: 0, marginTop: '1px' }}>
                  {msg.role === 'assistant' ? (
                    <Binum_LOGO size={34} />
                  ) : (
                    <div style={{
                      width: 34, height: 34, borderRadius: '5px',
                      background: 'var(--user-avatar-bg)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 700, color: 'var(--muted)',
                    }}>{(user?.name || user?.email || 'Вы')[0].toUpperCase()}</div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '13px', fontWeight: 600, color: 'var(--text)',
                      fontFamily: msg.role === 'assistant' ? 'Outfit, sans-serif' : 'Inter, sans-serif',
                    }}>
                      {msg.role === 'assistant' ? 'Trading Prompt' : (user?.name || user?.email || 'Вы')}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--muted3)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <MessageContent
                    text={msg.content}
                    muted={msg.content.startsWith('Добро пожаловать')}
                    compactParagraphs={msg.content.startsWith('Добро пожаловать')}
                  />
                  {msg.prompt && (
                    <div style={{ marginTop: '12px' }}>
                      {msg.chart && <PromptTradingView pair={msg.chart.pair} timeframe={msg.chart.timeframe} />}
                      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: 1.7, color: 'var(--text2)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '16px', maxHeight: '280px', overflowY: 'auto', userSelect: 'text' }}>{msg.prompt}</pre>
                      <div className="prompt-export-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px, 100%), 1fr))', gap: '8px', marginTop: '10px' }}>
                        <div className="prompt-export-action flex min-w-0 flex-col items-center gap-2">
                          <button type="button" onClick={() => handleCopyPrompt(msg.id, msg.prompt!)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '190px', maxWidth: '100%', height: 36, padding: '0 20px', background: copiedPromptId === msg.id ? '#22C55E' : 'var(--accent)', border: `1px solid ${copiedPromptId === msg.id ? '#22C55E' : 'var(--accent)'}`, borderRadius: '5px', color: 'var(--on-accent)', fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" strokeWidth="1.5" /></svg>
                            <span className="prompt-export-label-desktop">{copiedPromptId === msg.id ? 'Текст скопирован' : 'Копировать текст'}</span>
                            <span className="prompt-export-label-mobile">Текст</span>
                          </button>
                          <a href="https://chatgpt.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-white" aria-label="Открыть ChatGPT в новой вкладке">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M9.5 2H14v4.5M14 2 7.5 8.5M12.5 9v3.5a1.5 1.5 0 0 1-1.5 1.5H3.5A1.5 1.5 0 0 1 2 12.5V5a1.5 1.5 0 0 1 1.5-1.5H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            ChatGPT
                          </a>
                        </div>
                        <div className="prompt-export-action flex min-w-0 flex-col items-center gap-2">
                          <button type="button" onClick={() => handlePromptPdf(msg.id, msg.prompt!, false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '190px', maxWidth: '100%', height: 36, padding: '0 20px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '5px', color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2v8m0 0 3-3m-3 3L5 7M2.5 11v2.5h11V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <span className="prompt-export-label-desktop">Скачать PDF</span>
                            <span className="prompt-export-label-mobile">PDF</span>
                          </button>
                          <a href="https://claude.ai/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-white" aria-label="Открыть Claude в новой вкладке">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M9.5 2H14v4.5M14 2 7.5 8.5M12.5 9v3.5a1.5 1.5 0 0 1-1.5 1.5H3.5A1.5 1.5 0 0 1 2 12.5V5a1.5 1.5 0 0 1 1.5-1.5H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Claude
                          </a>
                        </div>
                        <div className="prompt-export-action flex min-w-0 flex-col items-center gap-2">
                          <button type="button" onClick={() => {
                            const url = URL.createObjectURL(new Blob([msg.prompt!], { type: 'text/plain;charset=utf-8' }))
                            const link = document.createElement('a')
                            link.href = url
                            link.download = 'binum-prompt.txt'
                            link.click()
                            setTimeout(() => URL.revokeObjectURL(url), 60000)
                          }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '190px', maxWidth: '100%', height: 36, padding: '0 20px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '5px', color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2v8m0 0 3-3m-3 3L5 7M2.5 11v2.5h11V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <span className="prompt-export-label-desktop">Скачать TXT</span>
                            <span className="prompt-export-label-mobile">TXT</span>
                          </button>
                          <a href="https://gemini.google.com/app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-white" aria-label="Открыть Gemini в новой вкладке">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M9.5 2H14v4.5M14 2 7.5 8.5M12.5 9v3.5a1.5 1.5 0 0 1-1.5 1.5H3.5A1.5 1.5 0 0 1 2 12.5V5a1.5 1.5 0 0 1 1.5-1.5H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Gemini
                          </a>
                        </div>
                      </div>
                      {copyErrorId === msg.id && <p role="alert" style={{ color: 'var(--text2)', fontSize: '12px' }}>Не удалось скопировать автоматически. Выделите текст промпта и скопируйте вручную.</p>}
                      {pdfErrorId === msg.id && <p role="alert" style={{ color: 'var(--text2)', fontSize: '12px' }}>Не удалось обработать PDF. Копирование PDF поддерживается не всеми браузерами; попробуйте скачать его.</p>}
                    </div>
                  )}
                </div>
                <div style={{ width: 34, flexShrink: 0 }} />
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message-fade" style={{
              padding: '20px 0',
              background: 'var(--msg-assistant-bg)',
              borderTop: '1px solid var(--border2)',
              borderBottom: '1px solid var(--border2)',
            }}>
              <div className="msg-inner" style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px', display: 'flex', gap: '16px' }}>
                <div style={{ flexShrink: 0 }}>
                  <Binum_LOGO size={34} />
                </div>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.05em' }}>Trading Prompt</span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', opacity: 1 }}>
                      печатает...
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '24px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
                        animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
                <div style={{ width: 34, flexShrink: 0 }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Prompt builder panel */}
        <div className="sig-bar-outer scrollable" style={{
          display: (affiliateOpen || legalOpen || supportOpen || settingsOpen || calendarOpen || faqOpen) ? 'none' : undefined,
          padding: '16px 32px 20px',
          background: 'radial-gradient(circle at 92% 0%, rgba(139, 124, 255, 0.055) 0%, transparent 30%), var(--bg)',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <PromptPanelResizeHandle width={promptPanelWidth} onResize={setPromptPanelWidth} />
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div className="sig-card prompt-builder-card" style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '18px',
              marginLeft: '14px',
              boxShadow: 'none',
            }}>
              <div className="sig-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', margin: '-18px -18px 16px', padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', flexShrink: 0, background: 'rgba(139, 124, 255, 0.08)', border: '1px solid rgba(139, 124, 255, 0.28)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7.2 2.5c.45 3.05 1.9 4.5 4.95 4.95-3.05.45-4.5 1.9-4.95 4.95-.45-3.05-1.9-4.5-4.95-4.95 3.05-.45 4.5-1.9 4.95-4.95Z" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round"/><circle cx="14.3" cy="3.5" r="1.35" stroke="currentColor" strokeWidth="1.35"/></svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>Конструктор промпта</div>
                    <div style={{ marginTop: '3px', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Настройте инструмент, глубину данных и период графика</div>
                  </div>
                </div>
              </div>

              {/* Selectors row */}
              <div className="sig-config-panel" style={{ display: 'flex', flexDirection: 'column', gap: '11px', alignItems: 'stretch' }}>
                <div className="sig-instrument-row">
                  {/* Pair selector remains watchlist-aware and is not populated with other asset classes. */}
                  {(() => {
                    const activePairs = availableInstruments
                    const safeSelected = activePairs.includes(selectedPair) ? selectedPair : activePairs[0]
                    return (
                      <div data-prompt-guide="currency-pair" className="sig-field-pair" style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                        <div className="prompt-field-label">
                          <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '2px' }}>
                            Инструмент
                          </label>
                        </div>
                        <CustomSelect
                          value={safeSelected}
                          onChange={v => setSelectedPair(v)}
                          options={activePairs.filter(Boolean).map(p => ({ label: p, value: p, icon: <PairFlag pair={p} size={13} /> }))}
                          subdued
                          dropDown
                        />
                      </div>
                    )
                  })()}
                  <div data-prompt-guide="asset-type" style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                    <div className="prompt-field-label">
                      <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '2px' }}>
                        Тип инструмента
                      </label>
                    </div>
                    <CustomSelect
                      value={selectedAssetType}
                      onChange={handleAssetTypeChange}
                      options={ASSET_TYPE_OPTIONS}
                      menuWidth="min(240px, calc(100vw - 48px))"
                      menuAlign="right"
                      subdued
                      dropDown
                    />
                  </div>
                </div>

                <div data-prompt-guide="bar-count" className="prompt-data-volume">
                  <div className="prompt-data-volume-title">Объём данных в промпте</div>
                  <div className="prompt-history-grid">
                    {[
                      { id: 'price-history', label: 'История цены', value: priceHistory, setter: setPriceHistory },
                      { id: 'indicator-history', label: 'История индикаторов', value: indicatorHistory, setter: setIndicatorHistory },
                    ].map(field => (
                      <div key={field.id} className="flex min-w-0 flex-col gap-1.5">
                        <label htmlFor={field.id} className="prompt-field-label prompt-history-label">
                          {field.label}
                        </label>
                        <input
                          id={field.id}
                          className="prompt-builder-input prompt-history-input"
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={field.value}
                          onChange={event => field.setter(event.target.value)}
                          onBlur={() => field.setter(current => {
                            const value = Number(current)
                            return Number.isFinite(value) && value >= 1 ? String(Math.floor(value)) : '1000'
                          })}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="sig-timeframes-grid grid grid-cols-3 gap-2">
                    {timeframeFields.map((field, index) => (
                      <div key={field.label} data-prompt-guide={`timeframe-${index + 1}`} className="sig-field-timeframe flex min-w-0 flex-col gap-1.5">
                        <div className="prompt-field-label pl-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted2)]">
                          <span>{field.label}</span>
                        </div>
                        <CustomSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={TIMEFRAME_OPTIONS}
                          placeholder={field.placeholder}
                          width="100%"
                          subdued
                          dropDown
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit button — desktop only */}
                <button
                  data-prompt-guide="create-prompt"
                  onClick={handleGeneratePrompt}
                  className="signal-btn-desktop transition-transform hover:scale-105 active:scale-100"
                  style={{
                    height: 36,
                    width: 'max-content',
                    padding: '0 12px',
                    background: 'var(--accent)',
                    border: '1px solid var(--accent)',
                    borderRadius: '5px',
                    color: 'var(--on-accent)',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'Outfit, sans-serif',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s',
                    letterSpacing: '0.02em',
                    flexShrink: 0,
                  }}
                >
                  <>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ marginTop: '5px', flexShrink: 0 }}>
                      <path d="M8 2.5c.5 3.4 2.1 5 5.5 5.5C10.1 8.5 8.5 10.1 8 13.5 7.5 10.1 5.9 8.5 2.5 8 5.9 7.5 7.5 5.9 8 2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      <circle cx="16" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                    Собрать промпт
                  </>
                </button>
              </div>

              {/* Mobile actions */}
              <div className="mobile-prompt-actions hidden w-full gap-2">
              <div
                data-prompt-guide="mobile-settings"
                role="button"
                  tabIndex={0}
                  className="mobile-prompt-settings-btn mr-1.25 grid size-10 shrink-0 cursor-pointer place-items-center rounded-md border border-accent bg-accent text-slate-950 transition-opacity active:opacity-40"
                  aria-label="Настройки конструктора промпта"
                  title="Настройки конструктора промпта"
                  onClick={() => setMobilePromptSettingsOpen(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setMobilePromptSettingsOpen(true)
                    }
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.74v.5a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/>
                  </svg>
                </div>
              <button
                data-prompt-guide="create-prompt"
                onClick={handleGeneratePrompt}
                className="signal-btn-mobile"
                style={{
                  display: 'none',
                  width: '100%',
                  marginTop: '10px',
                  height: 40,
                  background: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  borderRadius: '5px',
                  color: 'var(--on-accent)',
                  fontSize: '14px',
                  fontWeight: 700,
                  fontFamily: 'Outfit, sans-serif',
                  cursor: 'pointer',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                  letterSpacing: '0.02em',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M8 1L2 8h5l-1 5 7-8H8l1-4z" fill="currentColor" />
                </svg>
                Собрать промпт
              </button>
              </div>
              <div className="mobile-prompt-usage mt-2.5 hidden w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card2)] p-3 text-center text-sm text-[var(--muted)]">
                <span>Доступно промптов <span className="font-mono font-semibold text-accent">{remainingPrompts}/{FREE_LIMIT}</span></span>
              </div>

              {/* Persistent prompt addition panel replaces the former modal flow. */}
              <div data-prompt-guide="prompt-purpose" className="sig-purpose-panel" style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)', display: 'flex', flex: '1 1 auto', flexDirection: 'column', minHeight: 0 }}>
                <div className="prompt-field-label">
                  <label
                    htmlFor="prompt-purpose"
                    className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted3)]"
                  >
                    Дополнение к промпту
                  </label>
                </div>
                <textarea
                  className="prompt-builder-input [&#prompt-purpose]:!p-2.5 [&#prompt-purpose]:!font-['Inter'] [&#prompt-purpose]:!text-[13px] [&#prompt-purpose]:!leading-[1.6] [&#prompt-purpose]:!tracking-[0.01em] [&#prompt-purpose::placeholder]:!font-normal [&#prompt-purpose::placeholder]:!tracking-[0.015em] [&#prompt-purpose::placeholder]:!text-[var(--muted)]"
                  id="prompt-purpose"
                  aria-label="Дополнительные требования к анализу"
                  value={promptPurpose}
                  onChange={e => setPromptPurpose(e.target.value)}
                  placeholder="Например: оцени вероятность роста или падения по данному активу в ближайший час"
                  rows={5}
                  style={{ width: '100%', height: 'auto', minHeight: 120, flex: '1 1 auto', marginTop: '9px', resize: 'none', padding: '10px', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '7px', fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: 1.6, letterSpacing: '0.01em', outline: 'none', transition: 'border-color 0.15s' }}
                />
                <div style={{ marginTop: '7px', display: 'flex', justifyContent: 'space-between', gap: '10px', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: 'var(--muted)' }}>Будет добавлено в готовый промпт</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'var(--muted)' }}>{promptPurpose.length}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {mobilePromptSettingsOpen && (
          <div
            className="mobile-prompt-settings-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-lg"
            onClick={() => setMobilePromptSettingsOpen(false)}
            onKeyDown={e => {
              if (e.key === 'Escape') setMobilePromptSettingsOpen(false)
            }}
          >
            <div
              className="message-fade mobile-prompt-settings-modal max-h-full w-full max-w-md overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-prompt-settings-title"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  </div>
                  <div>
                    <div id="mobile-prompt-settings-title" className="font-semibold text-[var(--text)]">Настройки промпта</div>
                    <div className="mt-0.5 text-xs text-[var(--muted)]">Параметры генерации запроса</div>
                  </div>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Закрыть"
                  className="grid size-8 cursor-pointer place-items-center rounded-md text-[var(--muted)]"
                  onClick={() => setMobilePromptSettingsOpen(false)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setMobilePromptSettingsOpen(false)
                    }
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="m3 3 8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </div>
              </div>

              <div className="mobile-prompt-settings-content flex flex-col gap-3 p-4">
                <div className="mobile-instrument-row grid grid-cols-2 gap-2">
                  <div data-prompt-guide="currency-pair" className="flex min-w-0 flex-col gap-1.5">
                    <div className="prompt-field-label text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      <span>Валютная пара</span>
                    </div>
                    <CustomSelect
                      value={selectedPair}
                      onChange={setSelectedPair}
                      options={availableInstruments.filter(Boolean).map(pair => ({ label: pair, value: pair, icon: <PairFlag pair={pair} size={13} /> }))}
                      subdued
                      dropDown
                    />
                  </div>
                  <div data-prompt-guide="asset-type" className="flex min-w-0 flex-col gap-1.5">
                    <div className="prompt-field-label text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      <span>Тип актива</span>
                    </div>
                    <CustomSelect
                      value={selectedAssetType}
                      onChange={handleAssetTypeChange}
                      options={ASSET_TYPE_OPTIONS}
                      menuWidth="min(220px, calc(100vw - 56px))"
                      menuAlign="right"
                      subdued
                      dropDown
                    />
                  </div>
                </div>

                <div data-prompt-guide="bar-count" className="prompt-data-volume">
                  <div className="prompt-data-volume-title">Объём данных в промпте</div>
                  <div className="prompt-history-grid">
                    {[
                      { id: 'mobile-price-history', label: 'История цены', value: priceHistory, setter: setPriceHistory },
                      { id: 'mobile-indicator-history', label: 'История индикаторов', value: indicatorHistory, setter: setIndicatorHistory },
                    ].map(field => (
                      <div key={field.id} className="flex min-w-0 flex-col gap-1.5">
                        <label htmlFor={field.id} className="prompt-field-label prompt-history-label">
                          {field.label}
                        </label>
                        <input
                          id={field.id}
                          className="prompt-history-input h-10"
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={field.value}
                          onChange={event => field.setter(event.target.value)}
                          onBlur={() => field.setter(current => {
                            const value = Number(current)
                            return Number.isFinite(value) && value >= 1 ? String(Math.floor(value)) : '1000'
                          })}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {timeframeFields.map((field, index) => (
                      <div key={field.label} data-prompt-guide={`timeframe-${index + 1}`} className="flex min-w-0 flex-col gap-1.5">
                        <div className="prompt-field-label text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          <span>{field.label}</span>
                        </div>
                        <CustomSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={TIMEFRAME_OPTIONS}
                          placeholder={field.placeholder}
                          width="100%"
                          subdued
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div data-prompt-guide="prompt-purpose" className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    <span className="prompt-field-label">Дополнение к промпту</span>
                    <span className="font-normal text-[var(--muted3)]">Необязательно</span>
                  </div>
                  <div
                    role="textbox"
                    aria-multiline="true"
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="Добавьте собственную задачу для AI"
                    className="mobile-prompt-purpose min-h-24 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] p-3 font-display text-sm leading-relaxed text-[var(--text)] outline-none"
                    onInput={e => setPromptPurpose(e.currentTarget.textContent ?? '')}
                  >
                    {promptPurpose}
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] p-4">
                <div
                  role="button"
                  tabIndex={0}
                  className="grid h-10 w-full cursor-pointer place-items-center rounded-lg bg-accent font-semibold text-[var(--bg)]"
                  onClick={() => setMobilePromptSettingsOpen(false)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setMobilePromptSettingsOpen(false)
                    }
                  }}
                >
                  Готово
                </div>
              </div>
            </div>
          </div>
        )}

        {user && (
          <PageFooter
            onNavigate={(id) => {
              if (id === 'faq') setFaqInitialCategory('Все')
              setActiveTab(id)
              setAffiliateOpen(id === 'affiliate')
              setSupportOpen(id === 'support')
              setLegalOpen(id === 'legal')
              setFaqOpen(id === 'faq')
              setCalendarOpen(false)
              setSettingsOpen(false)
            }}
            onOpenSettings={(sec) => {
              setSettingsSection(sec)
              setSettingsOpen(true)
              setAffiliateOpen(false)
              setSupportOpen(false)
              setLegalOpen(false)
              setCalendarOpen(false)
              setFaqOpen(false)
            }}
          />
        )}

      </main>

      <PromptBuilderGuide
        isAuthenticated={Boolean(user)}
        menuOpen={sidebarOpen}
        mobileSettingsOpen={mobilePromptSettingsOpen}
        onOpenMenu={() => setSidebarOpen(true)}
        onCloseMenu={() => setSidebarOpen(false)}
        onOpenMobileSettings={() => setMobilePromptSettingsOpen(true)}
        onCloseMobileSettings={() => setMobilePromptSettingsOpen(false)}
      />

      {authOpen && <AuthModal initialTab={!user && guestRequests >= FREE_LIMIT ? 'register' : 'login'} onClose={() => setAuthOpen(false)} onAuth={handleAuth} onOpenLegal={() => { setAuthOpen(false); setLegalOpen(true); setAffiliateOpen(false); setSupportOpen(false); setSettingsOpen(false); setCalendarOpen(false); setFaqOpen(false) }} />}
      {limitModal && (
        <div
          onClick={() => setLimitModal(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="message-fade"
            style={{ position: 'relative', width: '100%', maxWidth: 380, background: '#12121C', border: '1px solid #242436', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
          >
            {limitModal === 'guest' && (
              <button
                type="button"
                aria-label="Закрыть"
                onClick={() => setLimitModal(null)}
                style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, padding: 0, border: '1px solid transparent', borderRadius: '6px', background: 'transparent', color: '#9A98B5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#191926'; e.currentTarget.style.color = '#EDEBFA' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9A98B5' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            )}
            {/* Icon + title */}
            <div style={{ padding: '28px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '10px', background: '#191926', border: '1px solid #2E2E46', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v6m0 3v1" stroke="#9A98B5" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '17px', color: '#EDEBFA', letterSpacing: '-0.2px', marginBottom: '8px' }}>
                  {limitModal === 'guest' ? 'Лимит запросов исчерпан' : 'Пробный пакет завершён'}
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#9A98B5', fontFamily: 'Inter, sans-serif', lineHeight: 1.65 }}>
                  {limitModal === 'guest'
                    ? 'Вы собрали 3 бесплатных промпта. Чтобы продолжить, зарегистрируйтесь.'
                    : 'Вы использовали все 3 тестовых промпта. Для продолжения выберите подходящий пакет промптов.'}
                </p>
              </div>
            </div>
            {/* Divider */}
            <div style={{ height: 1, background: '#191926', margin: '22px 0 0' }} />
            {/* Buttons */}
            <div style={{ padding: '16px 24px 20px', display: 'flex', gap: '8px' }}>
              {limitModal !== 'guest' && (
                <button
                  onClick={() => setLimitModal(null)}
                  style={{ flex: 1, height: 38, background: '#12121C', border: '1px solid #191926', borderRadius: '6px', color: '#7C7A98', fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s, color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#0F0F19'; e.currentTarget.style.borderColor = '#242436'; e.currentTarget.style.color = '#EDEBFA' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#12121C'; e.currentTarget.style.borderColor = '#191926'; e.currentTarget.style.color = '#7C7A98' }}
                >
                  Закрыть
                </button>
              )}
              <button
                onClick={() => {
                  setLimitModal(null)
                  if (limitModal === 'guest') {
                    setAuthOpen(true)
                  } else {
                    setSettingsSection('subscription')
                    setSettingsOpen(true)
                  }
                }}
                style={{ flex: 1, height: 38, background: limitModal === 'guest' ? '#8B7CFF' : '#CFCDE3', border: `1px solid ${limitModal === 'guest' ? '#8B7CFF' : '#C0C0C0'}`, borderRadius: '6px', color: '#0D0A24', fontSize: '13px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = limitModal === 'guest' ? '#A194FF' : '#EFEFEF'; e.currentTarget.style.borderColor = limitModal === 'guest' ? '#A194FF' : '#D0D0D0' }}
                onMouseLeave={e => { e.currentTarget.style.background = limitModal === 'guest' ? '#8B7CFF' : '#CFCDE3'; e.currentTarget.style.borderColor = limitModal === 'guest' ? '#8B7CFF' : '#C0C0C0' }}
              >
                {limitModal === 'guest' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="6" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.4" /><path d="M1.5 13v-1a4.5 4.5 0 0 1 9 0v1M12.5 5v5M10 7.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
                {limitModal === 'guest' ? 'Зарегистрироваться' : 'Выбрать пакет'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .premium-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }
        @media (max-width: 1200px) {
          .premium-grid { grid-template-columns: repeat(3, 1fr); }
          .sub-packages-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 900px) {
          .premium-grid { grid-template-columns: repeat(2, 1fr); }
          .sub-packages-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 500px) {
          .premium-grid { grid-template-columns: 1fr; }
        }
        .nav-desktop { display: none !important; }
        .mobile-only { display: flex !important; }
        @media (max-width: 600px) {
          .signal-btn-desktop { display: none !important; }
          .signal-btn-mobile { display: flex !important; }
          .header-clock { display: none !important; }

          /* Chat message rows */
          .msg-inner { padding: 0 10px !important; gap: 8px !important; max-width: 100% !important; }

          /* Prompt builder bar */
          .sig-bar-outer { padding: 10px 10px 12px !important; }
          .sig-card {
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            font-size: 13px !important;
          }
          .sig-card-header,
          .sig-config-panel,
          .sig-purpose-panel { display: none !important; }
          .mobile-prompt-actions { display: flex !important; }
          .mobile-prompt-usage { display: flex !important; }
          .signal-btn-mobile {
            flex: 1 !important;
            width: auto !important;
            margin-top: 0 !important;
          }
          .sig-field-timeframe { width: 100% !important; }
          .chat-main .custom-select--subdued > button,
          .chat-main input.prompt-builder-input { height: 40px !important; }
          .prompt-export-actions {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .prompt-export-action > button {
            width: 100% !important;
            min-width: 0;
            max-width: none !important;
            padding-inline: 0 !important;
          }
          .prompt-export-label-desktop { display: none; }
          .prompt-export-label-mobile { display: inline; }

          /* Page headers */
          .page-hdr { padding: 12px 14px !important; }
          .page-hdr h2, .page-hdr h1 { font-size: 16px !important; }

          /* Page body scrollable areas */
          .page-body { padding: 14px 12px !important; }

          /* Settings body */
          .settings-body { padding: 12px 12px !important; }

          /* Settings cards — reduce inner paddings */
          .settings-body > div > div,
          .settings-body [style*="padding: 20px"],
          .settings-body [style*="padding: 24px"] {
            padding: 14px !important;
          }

          /* Settings section headings */
          .settings-body h3 { font-size: 14px !important; }
          .settings-body p, .settings-body label, .settings-body span { font-size: 13px !important; }

          /* Prompt builder actions — allow horizontal scroll */
          .sig-card .vote-list { overflow-x: auto; }

          /* Subscription — packages grid */
          .sub-packages-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .subscription-packages-hero {
            grid-template-columns: 1fr !important;
            padding: 18px !important;
            gap: 16px !important;
          }
          .subscription-rate-tile {
            min-width: 0 !important;
            width: 100% !important;
            text-align: left !important;
          }
          .subscription-package-card {
            padding: 16px !important;
          }
          .subscription-package-features {
            grid-template-columns: 1fr !important;
          }

          /* Subscription — payment history rows: stack as cards */
          .sub-history-row {
            grid-template-columns: 1fr auto !important;
            grid-template-rows: auto auto !important;
            gap: 4px 8px !important;
            padding: 10px 12px !important;
          }
          /* date spans full width on mobile */
          .sub-history-row > span:first-child {
            grid-column: 1 / -1;
            font-size: 10px !important;
            color: #676582;
          }
          /* desc takes available space */
          .sub-history-row > span:nth-child(2) {
            font-size: 12px !important;
            white-space: normal !important;
          }
          /* prompt count, amount, status in a tight row */
          .sub-history-row > span:nth-child(3),
          .sub-history-row > span:nth-child(4),
          .sub-history-row > span:nth-child(5) {
            font-size: 11px !important;
          }
        }

        @media (max-width: 420px) {
          .sub-packages-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 16px rgba(200,200,200,0.12), 0 4px 12px rgba(200,200,200,0.06); }
          50% { box-shadow: 0 0 32px rgba(200,200,200,0.2), 0 4px 20px rgba(200,200,200,0.1); }
        }
        @keyframes ai-chip-glow {
          0%, 100% { border-color: #2E2E46; background: #191926; }
          50% { border-color: #383838; background: #242436; }
        }
        @keyframes progress-scan {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        select option {
          background: var(--card);
          color: var(--text);
        }
        select:focus {
          border-color: rgba(59,130,246,0.6) !important;
          outline: none;
        }
      `}</style>
    </div>
  )
}
