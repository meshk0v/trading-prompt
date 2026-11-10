// @refresh reset
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import MessageContent from './components/MessageContent'
import PromptAnalysisChart from './components/PromptAnalysisChart'
import FaqPage from './components/FaqPage'
import PromptBuilderGuide from './components/PromptBuilderGuide'
import PromptPanelResizeHandle from './components/PromptPanelResizeHandle'
import PublicAffiliatePage from './components/PublicAffiliatePage'
import ReviewsPage from './components/ReviewsPage'
import AnalysisSettingsPanel from './components/AnalysisSettingsPanel'
import UserAvatar from './components/UserAvatar'
import { fetchTickets } from './api/tickets'
import { loadPurchases, reportDemoPayment, savePurchases, type Purchase } from './api/purchases'
import { rememberReferralFromUrl } from './api/referral'
import { completeGuide, fetchCurrentUser, logout, type AuthUser } from './api/auth'
import { applyAppLanguage, type AppLanguage } from './i18n'
import aiWorkspaceIcon from './imports/ai-workspace-icon.png'
import telegramLogo from './imports/telegram-logo.png'
import TPL from './tradingLevelsLibrary'
import type { TradingCandle } from './tradingLevelsLibrary'
import {
  fullErrorText,
  loadCalendarData,
  loadMarketData,
  loadTickRows,
  type AnalysisSource,
  type LoadedMarketData,
  type RequestLogEntry,
} from './tradingMarketData'
import {
  AccountBalanceSummary,
  AffiliatePage,
  AuthModal,
  Binum_LOGO,
  CURRENCY_PAIRS,
  CustomSelect,
  EconomicCalendarPage,
  GREETINGS,
  LegalPage,
  PLAN_CYCLE,
  PageFooter,
  PairFlag,
  PAIR_CATEGORIES,
  SettingsPage,
  SupportPage,
  TIMEFRAME_OPTIONS,
  UserMenu,
  formatTime,
  type Message,
  type PlanTier,
} from './appSupport'

const ASSET_TYPE_OPTIONS = Object.keys(PAIR_CATEGORIES)
  .map(type => ({ label: type, value: type }))

const DEFAULT_CHART_INDICATORS = new Set(['ind.ema', 'lvl.sr'])
type SiteUser = { name: string; email: string; id: number; uid: string; avatarUrl: string; telegram: string; guideCompleted: boolean }

const toSiteUser = (user: AuthUser): SiteUser => ({
  name: user.name,
  email: user.email,
  id: user.id,
  uid: `840-${String(user.id).padStart(6, '0')}`,
  avatarUrl: '',
  telegram: user.telegram,
  guideCompleted: user.guideCompleted,
})


type AssetSearchOption = {
  pair: string
  type: string
}

const ASSET_SEARCH_OPTIONS = Array.from(
  new Map(
    Object.entries(PAIR_CATEGORIES)
      .flatMap(([type, pairs]) => pairs.map(pair => [pair, { pair, type }] as const)),
  ).values(),
)

const normalizeAssetSearch = (value: string) =>
  value.toLocaleLowerCase('ru').replace(/[\s/_-]+/g, '')

function AssetSearch({
  onSelect,
}: {
  onSelect: (option: AssetSearchOption) => void
}) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const normalizedQuery = normalizeAssetSearch(query)
  const results = normalizedQuery
    ? ASSET_SEARCH_OPTIONS
        .filter(option =>
          normalizeAssetSearch(option.pair).includes(normalizedQuery)
          || normalizeAssetSearch(option.type).includes(normalizedQuery),
        )
        .slice(0, 8)
    : []

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const selectOption = (option: AssetSearchOption) => {
    onSelect(option)
    setQuery('')
    setFocused(false)
  }

  return (
    <div ref={rootRef} data-prompt-guide="asset-search" className="relative min-w-0">
      <div className="relative">
        <svg className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          autoComplete="off"
          aria-label="Поиск актива по всем типам"
          aria-expanded={focused && query.length > 0}
          placeholder="Поиск актива по всем типам"
          className="h-[30px] w-full rounded-md border border-[var(--border)] bg-[var(--input-bg)] py-0 pl-8 pr-3 text-xs text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          onChange={event => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={event => {
            if (!rootRef.current?.contains(event.relatedTarget as Node)) setFocused(false)
          }}
          onKeyDown={event => {
            if (!results.length) return
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActiveIndex(index => (index + 1) % results.length)
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActiveIndex(index => (index - 1 + results.length) % results.length)
            } else if (event.key === 'Enter') {
              event.preventDefault()
              selectOption(results[activeIndex])
            } else if (event.key === 'Escape') {
              setFocused(false)
            }
          }}
        />
      </div>
      {focused && query && (
        <div className="absolute inset-x-0 top-[calc(100%+4px)] z-[120] max-h-60 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--dropdown-bg)] p-1 shadow-[var(--panel-shadow)]">
          {results.length ? results.map((option, index) => (
            <button
              key={option.pair}
              type="button"
              className={`flex min-h-9 w-full items-center gap-2 rounded-md border-0 px-2.5 text-left text-xs transition-colors ${index === activeIndex ? 'bg-[var(--accent-soft)] text-[var(--text)]' : 'bg-transparent text-[var(--text2)] hover:bg-[var(--accent-soft)]'}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={event => event.preventDefault()}
              onClick={() => selectOption(option)}
            >
              <PairFlag pair={option.pair} size={14} />
              <span className="min-w-0 flex-1 font-semibold">{option.pair}</span>
              <span className="text-[10px] text-[var(--muted)]">{option.type}</span>
            </button>
          )) : (
            <div className="px-3 py-2.5 text-xs text-[var(--muted)]">Активы не найдены</div>
          )}
        </div>
      )}
    </div>
  )
}

const ANALYSIS_CANDLE_LIMIT = 1440
const DEFAULT_TICK_LOAD_COUNT = 300
const DEFAULT_RAW_TICK_COUNT = 20

const getDeviceUtcOffset = () => {
  const offset = -new Date().getTimezoneOffset() / 60
  return Math.min(14, Math.max(-12, offset))
}

const CopyActionIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const DownloadActionIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2v8m0 0 3-3m-3 3L5 7M2.5 11v2.5h11V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const AiDestinationLinks = () => (
  <div className="prompt-ai-links">
    <span>Отправить в:</span>
    {[
      { label: 'ChatGPT', href: 'https://chatgpt.com/' },
      { label: 'Claude', href: 'https://claude.ai/' },
      { label: 'Gemini', href: 'https://gemini.google.com/app' },
    ].map(ai => (
      <a key={ai.label} href={ai.href} target="_blank" rel="noreferrer">
        {ai.label}
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3h7v7M13 3 4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    ))}
  </div>
)

type AnalysisRun = {
  result: Record<string, any>
  candles: TradingCandle[]
  market: LoadedMarketData
  calendar: Record<string, any> | null
  tickRows: unknown[] | null
  historyBars: number
}

type AnalysisSession = {
  messageId: string
  runs: AnalysisRun[]
  purpose: string
}

const escapePromptHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

function addPurposeToAnalysisOutput(
  output: { prompt: string; userReport: string },
  purpose: string,
) {
  const normalizedPurpose = purpose.trim()
  if (!normalizedPurpose) return output

  return {
    prompt: `${output.prompt}\n\n@user_request_begin\n${normalizedPurpose}\n@user_request_end`,
    userReport: `<section style="margin:0 0 16px">
        <h3 style="margin:0 0 5px;color:#8b95a7;font:700 9px/1.3 Inter,system-ui,sans-serif!important;letter-spacing:.08em;text-transform:uppercase">Дополнение к промпту</h3>
        <p style="margin:0;color:#d8dde6;font:400 12px/1.5 Inter,system-ui,sans-serif!important;white-space:pre-wrap;overflow-wrap:anywhere">${escapePromptHtml(normalizedPurpose)}</p>
      </section>${output.userReport}`,
  }
}

function buildAnalysisOutputs(
  session: AnalysisSession,
  {
    rawTickCount,
    ticksEnabled,
    calendarEnabled,
    off,
  }: {
    rawTickCount: number
    ticksEnabled: boolean
    calendarEnabled: boolean
    off: string[]
  },
) {
  const outputs = session.runs.map(run => {
    const ticks = ticksEnabled && run.tickRows
      ? TPL.analyzeTicks(run.tickRows, {
          atr: run.result.meta.atr,
          raw: rawTickCount,
        })
      : null
    const options = {
      symbol: run.market.symbol,
      timeframe: run.market.timeframe,
      bars: run.historyBars,
      lastBarOpen: run.market.lastBarOpen,
      volumeKind: run.market.volumeKind,
      calendar: calendarEnabled ? run.calendar : null,
      ticks,
      source: run.market.sourceLabel,
      notes: [],
      off,
    }
    return {
      timeframe: run.market.timeframe,
      prompt: TPL.buildPrompt(run.result, run.candles, {
        ...options,
        format: 'compact',
      }),
      userReport: TPL.buildReport(run.result, run.candles, {
        ...options,
        bars: 0,
      }),
    }
  })

  if (outputs.length === 1) return addPurposeToAnalysisOutput(outputs[0], session.purpose)

  const timeframeOrder = outputs.map(output => output.timeframe).join(' → ')
  return addPurposeToAnalysisOutput({
    prompt: [
      `#TP1 | multi_tf=${outputs.length} | order=${outputs.map(output => output.timeframe).join('>')} | each @tf block is one complete timeframe dataset`,
      ...outputs.map((output, index) => [
        `@tf_begin i=${index + 1} of=${outputs.length} tf=${output.timeframe}`,
        output.prompt.replace(/^#TP1[^\n]*(?:\n|$)/, ''),
        `@tf_end i=${index + 1} tf=${output.timeframe}`,
      ].join('\n')),
    ].join('\n\n'),
    userReport: `<div style="font:14px system-ui,sans-serif;color:#d8dde6">
      <div style="margin:0 0 24px;padding:0 0 12px;border-bottom:1px solid #2a3140">
        <strong style="color:#b9afff">Мультитаймфреймовый анализ</strong>
        <div style="margin-top:4px;color:#8b95a7">Порядок: ${timeframeOrder}</div>
      </div>
      ${outputs.map((output, index) => `
        <section style="margin:0 0 28px">
          <h2 style="margin:0 0 14px;color:#b9afff;font-size:18px">
            TF ${index + 1}: ${output.timeframe}
          </h2>
          ${output.userReport}
        </section>
      `).join('')}
    </div>`,
  }, session.purpose)
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [guestAiMenuOpen, setGuestAiMenuOpen] = useState(false)
  const [selectedAssetType, setSelectedAssetType] = useState('Forex')
  const [selectedPair, setSelectedPair] = useState('EUR/USD')
  const [selectedTimeframe, setSelectedTimeframe] = useState('M5')
  const [promptPurpose, setPromptPurpose] = useState('')
  const [promptPanelWidth, setPromptPanelWidth] = useState(400)
  const [mobileChatWorkspace, setMobileChatWorkspace] = useState<'user' | 'ai'>('user')
  const [analysisSource, setAnalysisSource] = useState<AnalysisSource>('auto')
  const [analysisHistoryBars, setAnalysisHistoryBars] = useState(30)
  const [analysisUtcOffset, setAnalysisUtcOffset] = useState(getDeviceUtcOffset)
  const [calendarCountries, setCalendarCountries] = useState('')
  const [calendarEnabled, setCalendarEnabled] = useState(true)
  const [ticksEnabled, setTicksEnabled] = useState(true)
  const [disabledToggleKeys, setDisabledToggleKeys] = useState<string[]>([])
  const [disabledChartIndicatorKeys, setDisabledChartIndicatorKeys] = useState<string[]>(
    () => TPL.CHART_KEYS.filter(key => !DEFAULT_CHART_INDICATORS.has(key)),
  )
  const [analysisLogs, setAnalysisLogs] = useState<RequestLogEntry[]>([])
  const [analysisWarnings, setAnalysisWarnings] = useState<string[]>([])
  const [analysisSession, setAnalysisSession] = useState<AnalysisSession | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [mobilePromptSettingsOpen, setMobilePromptSettingsOpen] = useState(false)
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [affiliateOpen, setAffiliateOpen] = useState(false)
  const [legalOpen, setLegalOpen] = useState(false)
  // Links from support emails open the ticket history directly: /?support=history
  const [supportUnread, setSupportUnread] = useState(0)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [supportOpen, setSupportOpen] = useState(() => new URLSearchParams(window.location.search).has('support'))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [faqInitialCategory, setFaqInitialCategory] = useState<'Все' | 'Партнёрская программа'>('Все')
  const [language, setLanguage] = useState<AppLanguage>(() => {
    try {
      return localStorage.getItem('trading-prompt-language') === 'en' ? 'en' : 'ru'
    } catch {
      return 'ru'
    }
  })
  const [settingsSection, setSettingsSection] = useState('account')
  const [user, setUser] = useState<SiteUser | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [guestRequests, setGuestRequests] = useState(0)
  const [userRequests, setUserRequests] = useState(0)
  const [limitModal, setLimitModal] = useState<'guest' | 'user' | null>(null)
  const [emailHidden, setEmailHidden] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [userPlan, setUserPlan] = useState<PlanTier>('free')
  const bottomRef = useRef<HTMLDivElement>(null)
  const aiBottomRef = useRef<HTMLDivElement>(null)
  const categoryInstruments = PAIR_CATEGORIES[selectedAssetType as keyof typeof PAIR_CATEGORIES] ?? CURRENCY_PAIRS
  const availableInstruments: string[] = [...categoryInstruments]
  const handleAssetTypeChange = (assetType: string) => {
    const instruments = PAIR_CATEGORIES[assetType as keyof typeof PAIR_CATEGORIES] ?? CURRENCY_PAIRS
    setSelectedAssetType(assetType)
    setSelectedPair(instruments[0])
  }
  const handleAssetSearchSelect = ({ pair, type }: AssetSearchOption) => {
    setSelectedAssetType(type)
    setSelectedPair(pair)
  }

  const appendAnalysisLog = useCallback((entry: RequestLogEntry) => {
    setAnalysisLogs(current => [...current.slice(-249), entry])
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'black')
  }, [])

  useEffect(() => {
    const source = analysisSource === 'auto'
      ? (selectedAssetType === 'Crypto' ? 'binance' : 'biquote')
      : analysisSource
    setAnalysisUtcOffset(source === 'binance' ? 0 : 2)
  }, [analysisSource, selectedAssetType])

  useEffect(() => {
    if (affiliateOpen || legalOpen || supportOpen || settingsOpen || calendarOpen || faqOpen) {
      setReviewsOpen(false)
    }
  }, [affiliateOpen, legalOpen, supportOpen, settingsOpen, calendarOpen, faqOpen])

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      appendAnalysisLog({
        id: `${Date.now()}-window-error`,
        timestamp: Date.now(),
        level: 'ERROR',
        label: 'window error',
        message: fullErrorText(event.error || event.message),
      })
    }
    const handleRejection = (event: PromiseRejectionEvent) => {
      appendAnalysisLog({
        id: `${Date.now()}-unhandled-rejection`,
        timestamp: Date.now(),
        level: 'ERROR',
        label: 'unhandled rejection',
        message: fullErrorText(event.reason),
      })
    }
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [appendAnalysisLog])

  useEffect(() => {
    if (!availableInstruments.includes(selectedPair)) {
      setSelectedPair(availableInstruments[0])
    }
  }, [selectedAssetType]) // eslint-disable-line react-hooks/exhaustive-deps

  const FREE_LIMIT = 3
  const purchasedCredits = user ? purchases.reduce((sum, purchase) => sum + purchase.credits, 0) : 0
  // Free prompts plus bought credits (simulated for now).
  const promptAllowance = FREE_LIMIT + purchasedCredits
  const usedPrompts = user ? userRequests : guestRequests
  const remainingPrompts = Math.max(0, promptAllowance - usedPrompts)
  const timeframeFields: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }[] = [
    { label: 'Таймфрейм', value: selectedTimeframe, onChange: setSelectedTimeframe },
  ]

  const handleAuth = useCallback((authUser: AuthUser) => {
    setUser(toSiteUser(authUser))
    setAuthOpen(false)
    setUserRequests(0)
  }, [])

  // A visitor who came by a partner's link is attached to that partner at sign-up.
  useEffect(rememberReferralFromUrl, [])

  // Simulated purchases are kept per account in this browser.
  useEffect(() => {
    setPurchases(user ? loadPurchases(user.id) : [])
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBuyCredits = useCallback((credits: number, amountUsd: number) => {
    if (!user) return
    const purchase: Purchase = { id: `${Date.now()}`, date: new Date().toISOString(), credits, amountUsd }
    setPurchases(current => {
      const next = [purchase, ...current]
      savePurchases(user.id, next)
      return next
    })
    void reportDemoPayment(amountUsd)
  }, [user])

  // Answers from support arrive at any time: keep the unread counter of the menu fresh.
  useEffect(() => {
    if (!user) {
      setSupportUnread(0)
      return
    }
    const refresh = () => { if (!document.hidden) fetchTickets().then(({ unread }) => setSupportUnread(unread), () => undefined) }
    refresh()
    const timer = setInterval(refresh, 60000)
    return () => clearInterval(timer)
  }, [user])

  // Restore the session of a returning visitor; a failed request just leaves the guest view.
  useEffect(() => {
    fetchCurrentUser()
      .then(authUser => authUser && setUser(toSiteUser(authUser)), () => undefined)
      .finally(() => setSessionChecked(true))
  }, [])

  const handleGuideFinished = useCallback(() => {
    setUser(current => (current ? { ...current, guideCompleted: true } : current))
    completeGuide().catch(() => undefined)
  }, [])

  const handleLogout = useCallback(() => {
    logout().catch(() => undefined)
    setUser(null)
    setSidebarOpen(false)
    setSettingsOpen(false)
    setAnalysisSource('auto')
    setAnalysisUtcOffset(getDeviceUtcOffset())
    setCalendarCountries('')
    setCalendarEnabled(true)
    setTicksEnabled(true)
    setDisabledToggleKeys([])
  }, [])

  const handleAvatarChange = useCallback((avatarUrl: string) => {
    setUser(current => current ? { ...current, avatarUrl } : current)
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
    aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (!analysisSession) return
    const output = buildAnalysisOutputs(analysisSession, {
      rawTickCount: DEFAULT_RAW_TICK_COUNT,
      ticksEnabled,
      calendarEnabled,
      off: disabledToggleKeys,
    })
    setMessages(current => current.map(message =>
      message.id === analysisSession.messageId
        ? { ...message, prompt: output.prompt, userReport: output.userReport }
        : message,
    ))
  }, [analysisSession, ticksEnabled, calendarEnabled, disabledToggleKeys])

  const handleGeneratePrompt = async () => {
    if (analysisLoading) return
    if (usedPrompts >= promptAllowance) {
      setLimitModal(user ? 'user' : 'guest')
      return
    }

    const now = Date.now()
    const messageId = `${now}-prompt`
    const selectedTimeframes = [selectedTimeframe]

    setAnalysisLoading(true)
    setAnalysisError(null)
    setAnalysisWarnings([])
    setIsTyping(true)

    try {
      const warnings: string[] = []
      const analyzedRuns: Array<{ market: LoadedMarketData; result: Record<string, any> }> = []

      for (const timeframe of selectedTimeframes) {
        try {
          const market = await loadMarketData({
            pair: selectedPair,
            assetType: selectedAssetType,
            timeframe,
            limit: ANALYSIS_CANDLE_LIMIT,
            source: analysisSource,
            onLog: appendAnalysisLog,
          })
          const analysisStartedAt = performance.now()
          const result = TPL.analyzeLevels(market.candles, {
            tzOffsetHours: analysisUtcOffset,
            indicators: {
              history: analysisHistoryBars,
              volumeKind: market.volumeKind,
            },
            extra: {
              series: true,
            },
          })
          appendAnalysisLog({
            id: `${Date.now()}-analysis-${market.timeframe}`,
            timestamp: Date.now(),
            level: 'INFO',
            label: `analyzeLevels ${market.timeframe}`,
            message: `Расчёт ${market.timeframe} завершён за ${Math.round(performance.now() - analysisStartedAt)} мс`,
          })
          analyzedRuns.push({ market, result })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          warnings.push(`Таймфрейм ${timeframe} не загружен: ${message}`)
          appendAnalysisLog({
            id: `${Date.now()}-timeframe-${timeframe}`,
            timestamp: Date.now(),
            level: 'ERROR',
            label: `Таймфрейм ${timeframe}`,
            message: fullErrorText(error),
          })
        }
      }

      if (analyzedRuns.length === 0) {
        throw new Error('Не удалось загрузить данные ни для одного выбранного таймфрейма')
      }

      const markets = analyzedRuns.map(run => run.market)
      const primaryMarket = markets[0]

      let loadedCalendar: Record<string, any> | null = null
      let tickRows: unknown[] | null = null

      await Promise.all([
        calendarEnabled
          ? loadCalendarData({
              symbol: primaryMarket.symbol,
              countriesInput: calendarCountries,
              onLog: appendAnalysisLog,
            }).then(calendar => {
              loadedCalendar = calendar
            }).catch(error => {
              const reason = fullErrorText(error)
              warnings.push(`Календарь не загружен: ${error instanceof Error ? error.message : String(error)}`)
              appendAnalysisLog({
                id: `${Date.now()}-calendar-warning`,
                timestamp: Date.now(),
                level: 'WARN',
                label: 'calendar',
                message: reason,
              })
            })
          : Promise.resolve(),
        ticksEnabled && primaryMarket.source === 'biquote'
          ? loadTickRows(primaryMarket.symbol, DEFAULT_TICK_LOAD_COUNT, appendAnalysisLog).then(rows => {
              tickRows = rows
            }).catch(error => {
              const reason = fullErrorText(error)
              warnings.push(`Тики не загружены: ${error instanceof Error ? error.message : String(error)}`)
              appendAnalysisLog({
                id: `${Date.now()}-ticks-warning`,
                timestamp: Date.now(),
                level: 'WARN',
                label: 'ticks',
                message: reason,
              })
            })
          : Promise.resolve(),
      ])

      const session: AnalysisSession = {
        messageId,
        purpose: promptPurpose,
        runs: analyzedRuns.map(({ market, result }) => ({
          result,
          candles: market.candles,
          market,
          calendar: loadedCalendar,
          tickRows,
          historyBars: analysisHistoryBars,
        })),
      }
      const output = buildAnalysisOutputs(session, {
        rawTickCount: DEFAULT_RAW_TICK_COUNT,
        ticksEnabled,
        calendarEnabled,
        off: disabledToggleKeys,
      })
      const completedTimeframes = markets.map(market => market.timeframe)
      setAnalysisSession(session)
      setAnalysisWarnings(warnings)

      setMessages(prev => [...prev,
        {
          id: `${now}-user`, role: 'user',
          content: `Запрос анализа: **${selectedPair}** · Таймфреймы **${selectedTimeframes.join(' → ')}**`,
          timestamp: new Date(),
        },
        {
          id: messageId, role: 'assistant',
          content: `Расчёт выполнен для ${completedTimeframes.length} ${completedTimeframes.length === 1 ? 'таймфрейма' : 'таймфреймов'} (${completedTimeframes.join(' → ')}): ${markets.map(market => `${market.candles.length} свечей ${market.timeframe}`).join(', ')}.`,
          prompt: output.prompt,
          userReport: output.userReport,
          chart: {
            pair: selectedPair,
            timeframe: completedTimeframes[0],
            candles: analyzedRuns[0].market.candles,
            result: analyzedRuns[0].result,
            source: analyzedRuns[0].market.sourceLabel,
          },
          timestamp: new Date(),
        },
      ])
      setCopiedPromptId(null)
      setCopyErrorId(null)
      if (user) {
        setUserRequests(userRequests + 1)
        if (userRequests + 1 === promptAllowance) setLimitModal('user')
      } else {
        setGuestRequests(guestRequests + 1)
        if (guestRequests + 1 === FREE_LIMIT) setLimitModal('guest')
      }
    } catch (error) {
      const errorText = fullErrorText(error)
      setAnalysisError(error instanceof TypeError
        ? 'Запрос заблокирован средой или сетью: откройте приложение в обычной вкладке браузера (не во встроенном превью)'
        : error instanceof Error ? error.message : 'Не удалось выполнить расчёт')
      appendAnalysisLog({
        id: `${Date.now()}-fatal`,
        timestamp: Date.now(),
        level: 'ERROR',
        label: 'load',
        message: errorText,
      })
    } finally {
      setAnalysisLoading(false)
      setIsTyping(false)
    }
  }

  const toggleAnalysisBlock = (key: string) => {
    setDisabledToggleKeys(current =>
      current.includes(key) ? current.filter(item => item !== key) : [...current, key],
    )
  }

  const toggleChartIndicator = (key: string) => {
    setDisabledChartIndicatorKeys(current =>
      current.includes(key) ? current.filter(item => item !== key) : [...current, key],
    )
  }

  const handleCheckBlocks = () => {
    const prompt = [...messages].reverse().find(message => message.prompt)?.prompt
    if (!prompt) {
      appendAnalysisLog({
        id: `${Date.now()}-check-empty`,
        timestamp: Date.now(),
        level: 'WARN',
        label: 'Проверить блоки',
        message: 'Сначала загрузите данные и сформируйте TP1',
      })
      return
    }
    const baseBlocks = ['#TP1', '@meta', '@levels', '@lines', '@fib', '@ind', '@ind2', '@ticks', '@tkb', '@tk', '@cal', '@bars']
    const sourceBlocks = analysisSession?.runs.some(run => run.market.source === 'binance') ? ['@of', '@trades', '@book'] : []
    const toggleByBlock: Record<string, string[]> = {
      '@levels': TPL.TOGGLE_KEYS.filter(key => key.startsWith('lvl.')),
      '@lines': ['lvl.trendline'],
      '@fib': ['lvl.fib'],
      '@ind': TPL.TOGGLE_KEYS.filter(key => key.startsWith('ind.')),
      '@ind2': TPL.TOGGLE_KEYS.filter(key => key.startsWith('ext.')),
      '@ticks': ['tk.stats'],
      '@tkb': ['tk.buckets'],
      '@tk': ['tk.raw'],
      '@cal': ['cal'],
      '@bars': ['bars'],
      '@of': ['of.stats'],
      '@trades': ['tr.stats', 'tr.buckets', 'tr.profile', 'tr.raw'],
      '@book': ['bk.stats', 'bk.levels'],
    }
    const present: string[] = []
    const disabled: string[] = []
    const loadErrors: string[] = []
    const missing: string[] = []

    for (const block of [...baseBlocks, ...sourceBlocks]) {
      const escapedBlock = block.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      if (new RegExp(`^${escapedBlock}(?:\\s|$)`, 'm').test(prompt)) {
        present.push(block)
      } else if ((toggleByBlock[block] || []).some(key => disabledToggleKeys.includes(key))) {
        disabled.push(block)
      } else if (
        (block === '@cal' && analysisWarnings.some(warning => warning.startsWith('Календарь'))) ||
        (['@ticks', '@tkb', '@tk'].includes(block) && analysisWarnings.some(warning => warning.startsWith('Тики')))
      ) {
        loadErrors.push(block)
      } else {
        missing.push(block)
      }
    }
    const expectedOrder = baseBlocks.filter(block => present.includes(block))
    const actualOrder = expectedOrder
      .map(block => ({ block, index: prompt.search(new RegExp(`^${block.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`, 'm')) }))
      .sort((a, b) => a.index - b.index)
      .map(item => item.block)
    const orderIsCorrect = expectedOrder.every((block, index) => actualOrder[index] === block)
    appendAnalysisLog({
      id: `${Date.now()}-block-check`,
      timestamp: Date.now(),
      level: missing.length || loadErrors.length ? 'WARN' : 'INFO',
      label: 'Проверить блоки',
      message: [
        `Есть: ${present.join(', ') || '—'}`,
        `Выключены: ${disabled.join(', ') || '—'}`,
        `Нет из-за загрузки: ${loadErrors.join(', ') || '—'}`,
        `Отсутствуют: ${missing.join(', ') || '—'}`,
        `Порядок: ${orderIsCorrect ? 'корректный' : `ожидался ${expectedOrder.join(' → ')}, получен ${actualOrder.join(' → ')}`}`,
      ].join('\n'),
    })
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

  const downloadTextFile = (content: string, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`

  const promptToCsv = (prompt: string) => [
    'line,content',
    ...prompt.split('\n').map((line, index) => `${index + 1},${csvCell(line)}`),
  ].join('\n')

  const reportDocument = (html: string) => new DOMParser().parseFromString(html, 'text/html')

  const reportToText = (html: string) => reportDocument(html).body.innerText.trim()

  const reportToCsv = (html: string) => {
    const document = reportDocument(html)
    const rows = ['type,section,value']
    let section = ''
    document.body.querySelectorAll('h1,h2,h3,p,li,table').forEach(element => {
      if (/^H[1-3]$/.test(element.tagName)) {
        section = element.textContent?.trim() || ''
        rows.push(`heading,${csvCell(section)},${csvCell(section)}`)
        return
      }
      if (element.tagName === 'TABLE') {
        element.querySelectorAll('tr').forEach(row => {
          const cells = [...row.querySelectorAll('th,td')].map(cell => csvCell(cell.textContent?.trim() || ''))
          rows.push(['table', csvCell(section), ...cells].join(','))
        })
        return
      }
      const value = element.textContent?.trim()
      if (value) rows.push(`${element.tagName.toLowerCase()},${csvCell(section)},${csvCell(value)}`)
    })
    return rows.join('\n')
  }

  const isChatView = !affiliateOpen && !legalOpen && !supportOpen && !settingsOpen && !calendarOpen && !faqOpen && !reviewsOpen

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
    setReviewsOpen(false)
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
    setReviewsOpen(false)
    setSidebarOpen(false)
  }
  const openReviewsFromMenu = () => {
    setActiveTab('reviews')
    setReviewsOpen(true)
    setAffiliateOpen(false)
    setSettingsOpen(false)
    setSupportOpen(false)
    setLegalOpen(false)
    setCalendarOpen(false)
    setFaqOpen(false)
    setSidebarOpen(false)
  }

  const renderSidebarUtilities = () => (
    <div className="sidebar-utility-items">
      <a
        className="account-menu-button sidebar-utility-item"
        href="https://t.me/tradingprompt"
        target="_blank"
        rel="noreferrer"
        onClick={() => setSidebarOpen(false)}
        aria-label="Открыть Telegram-канал Trading Prompt"
      >
        <span className="sidebar-utility-icon sidebar-utility-icon--telegram">
          <img src={telegramLogo} alt="" aria-hidden="true" />
        </span>
        <span>Telegram-канал</span>
      </a>
      <button
        type="button"
        className="account-menu-button sidebar-utility-item"
        onClick={() => setLanguage(current => current === 'ru' ? 'en' : 'ru')}
        aria-label={language === 'ru' ? 'Switch to English' : 'Switch to Russian'}
      >
        <span className="sidebar-utility-icon sidebar-utility-icon--language">
          <span className={`fi fi-${language === 'ru' ? 'gb' : 'ru'}`} aria-hidden="true" />
        </span>
        <span>{language === 'ru' ? 'English' : 'Русский'}</span>
      </button>
    </div>
  )

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
      {!sidebarOpen && !user && (
        <div className={user ? undefined : 'guest-mobile-menu-trigger'} style={{ position: 'fixed', top: 8, right: 12, zIndex: 50, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Hamburger button */}
          <button
            data-prompt-guide="main-menu"
            onClick={() => setSidebarOpen(o => !o)}
            className="main-menu-button"
            style={{ width: 30, height: 30, marginTop: 1, borderRadius: '8px' }}
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
          height: 40,
          borderBottom: '1px solid var(--border2)',
          display: 'flex', alignItems: 'center', gap: '8px',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            whiteSpace: 'nowrap', overflow: 'hidden',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'Outfit, sans-serif', fontWeight: 400, fontSize: '14px', color: 'var(--text)', letterSpacing: '-0.2px' }}>
              <Binum_LOGO size={20} />
              Trading Prompt
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="sidebar-menu-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', gap: '2px', overflowY: 'auto' }}>
          {user ? (
            <div data-prompt-guide="authorized-menu-items" className="account-menu-icons" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <AccountBalanceSummary remaining={remainingPrompts} className="account-balance-summary--mobile" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 2px 8px', padding: '11px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' }}>
                <UserAvatar
                  src={user.avatarUrl}
                  name={user.name}
                  size={48}
                  style={{ border: '1px solid color-mix(in srgb, var(--accent) 46%, var(--border))', borderRadius: '12px', objectPosition: 'center 28%', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--accent) 12%, transparent)' }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', color: 'var(--text)', fontSize: '13px', fontWeight: 700, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>UID: {user.uid}</div>
                  <div style={{ overflow: 'hidden', marginTop: '5px', color: 'var(--muted)', fontSize: '12px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                </div>
              </div>

              {([
                { id: 'account',      label: 'Аккаунт',               action: () => { setSettingsSection('account');      setSettingsOpen(true); setAffiliateOpen(false); setSupportOpen(false); setLegalOpen(false); setCalendarOpen(false); setFaqOpen(false); setSidebarOpen(false) }, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.2" stroke="#7C7A98" strokeWidth="1.3"/><path d="M2 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#7C7A98" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                { id: 'subscription', label: 'Кредиты',                action: () => { setSettingsSection('subscription'); setSettingsOpen(true); setAffiliateOpen(false); setSupportOpen(false); setLegalOpen(false); setCalendarOpen(false); setFaqOpen(false); setSidebarOpen(false) }, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="#7C7A98" strokeWidth="1.3"/><path d="M1.5 6h11" stroke="#7C7A98" strokeWidth="1.3"/><circle cx="4" cy="9" r="1" fill="currentColor"/></svg> },
                { id: 'affiliate',    label: 'Партнёрская программа',  action: openAffiliateFromMenu, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="4" cy="5" r="2" stroke="#7C7A98" strokeWidth="1.3"/><circle cx="10" cy="5" r="2" stroke="#7C7A98" strokeWidth="1.3"/><path d="M1 13c0-2 1.3-3.5 3-3.5M13 13c0-2-1.3-3.5-3-3.5M6 13c0-1.8 1-3 2-3s2 1.2 2 3" stroke="#7C7A98" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                { id: 'support',      label: 'Поддержка и контакты',   action: () => { setSupportOpen(true); setSettingsOpen(false); setAffiliateOpen(false); setLegalOpen(false); setCalendarOpen(false); setFaqOpen(false); setSidebarOpen(false) }, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#7C7A98" strokeWidth="1.3"/><path d="M7 9V7.5c1.2-.3 2-1.2 2-2.5a2 2 0 0 0-4 0" stroke="#7C7A98" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7" cy="11" r="0.7" fill="currentColor"/></svg> },
                { id: 'faq',          label: 'Вопросы и ответы',       action: openFaqFromMenu, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#7C7A98" strokeWidth="1.3"/><path d="M5.4 5.4a1.7 1.7 0 1 1 2.5 1.5c-.7.4-.9.8-.9 1.5M7 10.5v.1" stroke="#7C7A98" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                { id: 'reviews',      label: 'Отзывы',                  action: openReviewsFromMenu, icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2 2.5h10v7H6l-3 2v-2H2v-7Z" stroke="#7C7A98" strokeWidth="1.3" strokeLinejoin="round"/><path d="M4.5 5h5M4.5 7h3" stroke="#7C7A98" strokeWidth="1.1" strokeLinecap="round"/></svg> },
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
                  {item.id === 'support' && supportUnread > 0 && (
                    <span aria-label="Новые ответы поддержки" style={{ marginLeft: 'auto', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: '#8B7CFF', color: '#0D0A24', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{supportUnread}</span>
                  )}
                </div>
              ))}

              {renderSidebarUtilities()}

              {/* Logout */}
              <div onClick={handleLogout} className="account-menu-button"
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
                  id: 'reviews',
                  label: 'Отзывы',
                  action: openReviewsFromMenu,
                  icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2 2.5h10v7H6l-3 2v-2H2v-7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M4.5 5h5M4.5 7h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
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

              {renderSidebarUtilities()}
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
          <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <Binum_LOGO size={28} opacity={0.82} />
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 400, fontSize: '14px', color: 'var(--text)', letterSpacing: '-0.2px' }}>Trading Prompt</span>
            </div>
            <div style={{ flex: 1 }} />
            {user && !sidebarOpen && (
              <button
                data-prompt-guide="main-menu"
                onClick={() => setSidebarOpen(true)}
                className="main-menu-button main-menu-button--header"
                style={{ marginRight: '-5px' }}
                aria-label="Открыть меню"
                title="Открыть меню"
              >
                <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
                  <rect width="22" height="2" rx="1" fill="currentColor" />
                  <rect y="7" width="22" height="2" rx="1" fill="currentColor" />
                  <rect y="14" width="22" height="2" rx="1" fill="currentColor" />
                </svg>
              </button>
            )}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none' }}>
                <UserMenu
                  className="nav-desktop"
                  email={user.email}
                  emailHidden={emailHidden}
                  onToggleEmail={() => setEmailHidden(v => !v)}
                  remaining={Math.max(0, promptAllowance - userRequests)}
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
                    setReviewsOpen(id === 'reviews')
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
                    setReviewsOpen(false)
                  }}
                  uid={user.uid}
                  name={user.name}
                  avatarUrl={user.avatarUrl}
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
                    onClick={openReviewsFromMenu}
                  >
                    Отзывы
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
          const nav = (id: string) => { if (id === 'faq') setFaqInitialCategory('Все'); setActiveTab(id); setAffiliateOpen(id === 'affiliate'); setSupportOpen(id === 'support'); setLegalOpen(id === 'legal'); setFaqOpen(id === 'faq'); setReviewsOpen(id === 'reviews'); setCalendarOpen(false); setSettingsOpen(false) }
          return (<>
            {affiliateOpen && (user
              ? <AffiliatePage onClose={() => { setAffiliateOpen(false); setActiveTab('chat') }} />
              : <PublicAffiliatePage onClose={() => { setAffiliateOpen(false); setActiveTab('chat') }} onSignUp={() => setAuthOpen(true)} onOpenFaq={() => nav('faq')} />
            )}
            {legalOpen && <LegalPage onClose={() => { setLegalOpen(false); setActiveTab('chat') }} />}
            {supportOpen && <SupportPage unread={supportUnread} onUnreadChange={setSupportUnread} signedIn={Boolean(user)} onSignIn={() => setAuthOpen(true)} onClose={() => { setSupportOpen(false); setActiveTab('chat') }} />}
            {settingsOpen && (
              <SettingsPage
                user={user}
                initialSection={settingsSection}
                onAvatarChange={handleAvatarChange}
                purchases={purchases}
                onBuyCredits={handleBuyCredits}
                onSignIn={() => setAuthOpen(true)}
                onClose={() => { setSettingsOpen(false); setActiveTab('chat') }}
              />
            )}
            {calendarOpen && <EconomicCalendarPage onClose={() => { setCalendarOpen(false); setActiveTab('chat') }} />}
            {faqOpen && <FaqPage initialCategory={faqInitialCategory} onClose={() => { setFaqOpen(false); setFaqInitialCategory('Все'); setActiveTab('chat') }} user={user} onSignUp={() => setAuthOpen(true)} onNavigate={nav} onOpenSettings={(sec) => { setSettingsSection(sec); setSettingsOpen(true); setAffiliateOpen(false); setSupportOpen(false); setLegalOpen(false); setCalendarOpen(false); setFaqOpen(false) }} />}
            {reviewsOpen && <ReviewsPage onClose={() => { setReviewsOpen(false); setActiveTab('chat') }} user={user} onSignUp={() => setAuthOpen(true)} />}
          </>)
        })()}

        {/* Parallel user and AI workspaces */}
        <div
          data-prompt-guide="prompt-result"
          className="chat-parallel"
          data-mobile-workspace={mobileChatWorkspace}
          style={{
            display: (affiliateOpen || legalOpen || supportOpen || settingsOpen || calendarOpen || faqOpen || reviewsOpen) ? 'none' : undefined,
          }}
        >
          <div className="mobile-chat-switcher" role="tablist" aria-label="Выбор отображаемого чата">
            <button
              type="button"
              role="tab"
              aria-selected={mobileChatWorkspace === 'user'}
              className={mobileChatWorkspace === 'user' ? 'is-active' : ''}
              onClick={() => setMobileChatWorkspace('user')}
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="7.5" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2.5 16c0-2.8 2.2-5 5-5s5 2.2 5 5M13 5.2a2.6 2.6 0 0 1 0 5M14.5 11.7c1.8.7 3 2.3 3 4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Для пользователя
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileChatWorkspace === 'ai'}
              className={mobileChatWorkspace === 'ai' ? 'is-active' : ''}
              onClick={() => setMobileChatWorkspace('ai')}
            >
              <img src={aiWorkspaceIcon} alt="" width="19" height="12" aria-hidden="true" />
              Для ИИ
              <span>TP1</span>
            </button>
          </div>

          <section className="chat-workspace chat-workspace--user" aria-labelledby="user-workspace-title">
            <header className="chat-workspace-heading">
              <div className="chat-workspace-icon chat-workspace-icon--user">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="7.5" cy="7" r="3" stroke="var(--color-white)" strokeWidth="1.5" />
                  <path d="M2.5 16c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="var(--color-white)" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M13 5.2a2.6 2.6 0 0 1 0 5M14.5 11.7c1.8.7 3 2.3 3 4.3" stroke="var(--color-white)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <span className="chat-workspace-kicker">Читаемый поток</span>
                <h2 id="user-workspace-title">Для пользователя</h2>
              </div>
              <span className="chat-workspace-status" style={{ color: 'var(--accent)' }}>
                <span className="fg-inline-italic"><br /></span> TEkct
              </span>
            </header>
            <div className="chat-workspace-feed scrollable">
              {messages.map(msg => (
                <article key={msg.id} className={`workspace-message message-fade workspace-message--${msg.role}`}>
                  <div className="workspace-message-meta">
                    <span className="workspace-message-sender">
                      <span className={`workspace-message-avatar workspace-message-avatar--${msg.role}`} aria-hidden="true">
                        {msg.role === 'assistant'
                          ? <Binum_LOGO size={18} />
                          : <span>{(user?.email || user?.name || 'В').charAt(0).toUpperCase()}</span>}
                      </span>
                      <span className="workspace-message-sender-name">
                        {msg.role === 'assistant' ? 'Trading Prompt' : (user?.email || 'Вы')}
                      </span>
                    </span>
                    <time>{formatTime(msg.timestamp)}</time>
                  </div>
                  <MessageContent
                    text={msg.prompt ? 'Отчёт собран и синхронизирован с данными для ИИ.' : msg.content}
                    muted={msg.content.startsWith('Добро пожаловать')}
                    compactParagraphs={msg.content.startsWith('Добро пожаловать')}
                  />
                  {msg.prompt && (
                    <div className="prompt-user-result">
                      <div
                        className="prompt-user-report tpl-user-report"
                        dangerouslySetInnerHTML={{ __html: msg.userReport || '' }}
                      />
                      <AiDestinationLinks />
                      {msg.chart?.candles && msg.chart.result && (
                        <PromptAnalysisChart
                          pair={msg.chart.pair || selectedPair}
                          timeframe={(msg.chart.timeframe || selectedTimeframe).split(' → ')[0]}
                          candles={msg.chart.candles}
                          result={msg.chart.result}
                          source={msg.chart.source}
                          show={TPL.CHART_KEYS.filter(key => !disabledChartIndicatorKeys.includes(key))}
                          exportTargetId={`prompt-export-actions-${msg.id}`}
                        />
                      )}
                      <div className="prompt-export-actions" id={`prompt-export-actions-${msg.id}`}>
                        <button className="prompt-export-button--copy" type="button" onClick={() => handleCopyPrompt(`user-${msg.id}`, reportToText(msg.userReport || ''))}>
                          <CopyActionIcon />
                          {copiedPromptId === `user-${msg.id}` ? 'Скопировано' : 'Скопировать'}
                        </button>
                        <button className="prompt-export-button--csv" type="button" onClick={() => downloadTextFile(reportToCsv(msg.userReport || ''), 'trading-prompt-report.csv', 'text/csv;charset=utf-8')}>
                          <DownloadActionIcon />
                          CSV
                        </button>
                        <button className="prompt-export-button--txt" type="button" onClick={() => downloadTextFile(reportToText(msg.userReport || ''), 'trading-prompt-report.txt', 'text/plain;charset=utf-8')}>
                          <DownloadActionIcon />
                          TXT
                        </button>
                      </div>
                      {copyErrorId === `user-${msg.id}` && <p role="alert" className="prompt-output-error">Не удалось скопировать отчёт автоматически.</p>}
                    </div>
                  )}
                </article>
              ))}
              {isTyping && (
                <div className="workspace-typing message-fade">
                  <Binum_LOGO size={26} />
                  <span>Trading Prompt формирует ответ</span>
                  <div className="workspace-typing-dots">
                    {[0, 1, 2].map(i => <i key={i} style={{ animationDelay: `${i * 0.2}s` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </section>

          <section className="chat-workspace chat-workspace--ai" aria-labelledby="ai-workspace-title">
            <header className="chat-workspace-heading">
              <div className="chat-workspace-icon chat-workspace-icon--ai">
                <img src={aiWorkspaceIcon} alt="" width="22" height="14" aria-hidden="true" />
              </div>
              <div>
                <span className="chat-workspace-kicker">Машиночитаемый поток</span>
                <h2 id="ai-workspace-title">Для ИИ</h2>
              </div>
              <span className="chat-workspace-format">TP1</span>
            </header>
            <div className="chat-workspace-feed scrollable">
              {messages.filter(msg => msg.prompt).length === 0 && (
                <div className="chat-workspace-empty">
                  <div className="chat-workspace-empty-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M8 9 5 12l3 3M16 9l3 3-3 3M14 6l-4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <strong>Данные появятся здесь</strong>
                  <span>Обе части чата обновляются одновременно после сборки промпта.</span>
                </div>
              )}
              {messages.filter(msg => msg.prompt).map(msg => (
                <article key={msg.id} className="workspace-message workspace-message--ai message-fade">
                  <div className="workspace-message-meta">
                    <span>{msg.chart?.pair || selectedPair} · {msg.chart?.timeframe || selectedTimeframe}</span>
                    <time>{formatTime(msg.timestamp)}</time>
                  </div>
                  <pre className="prompt-json-output">{msg.prompt}</pre>
                  <div className="prompt-export-actions">
                    <button className="prompt-export-button--copy" type="button" onClick={() => handleCopyPrompt(`ai-${msg.id}`, msg.prompt!)}>
                      <CopyActionIcon />
                      {copiedPromptId === `ai-${msg.id}` ? 'Скопировано' : 'Скопировать'}
                    </button>
                    <button className="prompt-export-button--csv" type="button" onClick={() => downloadTextFile(promptToCsv(msg.prompt!), 'trading-prompt-tp1.csv', 'text/csv;charset=utf-8')}>
                      <DownloadActionIcon />
                      CSV
                    </button>
                    <button className="prompt-export-button--txt" type="button" onClick={() => downloadTextFile(msg.prompt!, 'trading-prompt-tp1.txt', 'text/plain;charset=utf-8')}>
                      <DownloadActionIcon />
                      TXT
                    </button>
                  </div>
                  <AiDestinationLinks />
                  {copyErrorId === `ai-${msg.id}` && <p role="alert" className="prompt-output-error">Не удалось скопировать автоматически. Выделите TP1 и скопируйте вручную.</p>}
                </article>
              ))}
              {isTyping && (
                <div className="workspace-typing workspace-typing--ai message-fade">
                  <Binum_LOGO size={26} />
                  <span>Trading Prompt формирует ответ</span>
                  <div className="workspace-typing-dots">
                    {[0, 1, 2].map(i => <i key={i} style={{ animationDelay: `${i * 0.2}s` }} />)}
                  </div>
                </div>
              )}
              <div ref={aiBottomRef} />
            </div>
          </section>
        </div>

        {/* Prompt builder panel */}
        <div className="sig-bar-outer" style={{
          display: (affiliateOpen || legalOpen || supportOpen || settingsOpen || calendarOpen || faqOpen || reviewsOpen) ? 'none' : undefined,
          padding: '12px',
          background: 'radial-gradient(circle at 92% 0%, rgba(139, 124, 255, 0.055) 0%, transparent 30%), var(--bg)',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <PromptPanelResizeHandle width={promptPanelWidth} onResize={setPromptPanelWidth} />
          <div className="prompt-builder-scroll scrollable" style={{ maxWidth: 760, margin: '0 auto' }}>
            <div className="sig-card prompt-builder-card" style={{
              background: 'transparent',
              border: 0,
              borderRadius: 0,
              padding: 0,
              margin: 0,
              boxShadow: 'none',
            }}>
              <div className="sig-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', margin: '0 0 12px', padding: '0 0 12px', borderBottom: '1px solid var(--border)' }}>
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
                <AssetSearch onSelect={handleAssetSearchSelect} />
                <div className="sig-instrument-row">
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

                <div className="prompt-data-volume">
                  <div className="prompt-history-grid">
                    <div data-prompt-guide="bar-count" className="flex min-w-0 flex-col gap-1.5">
                      <label htmlFor="analysis-history-bars" className="prompt-field-label prompt-history-label">
                        Баров в промпте
                      </label>
                      <input
                        id="analysis-history-bars"
                        className="prompt-builder-input prompt-history-input"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        inputMode="numeric"
                        value={analysisHistoryBars}
                        onChange={event => setAnalysisHistoryBars(Number(event.target.value))}
                        onBlur={() => setAnalysisHistoryBars(value => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 30)))}
                      />
                    </div>
                    {timeframeFields.map((field, index) => (
                      <div key={field.label} data-prompt-guide={`timeframe-${index + 1}`} className="sig-field-timeframe flex min-w-0 flex-col gap-1.5">
                        <div className="prompt-field-label pl-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted2)]">
                          <span style={{ display: 'block', height: '11px', fontSize: '9px', fontWeight: 400, lineHeight: '11px' }}>{field.label}</span>
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
                  disabled={analysisLoading}
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
                    {analysisLoading ? 'Расчёт…' : 'Собрать промпт'}
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
                disabled={analysisLoading}
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
                {analysisLoading ? 'Расчёт…' : 'Собрать промпт'}
              </button>
              </div>
              <div className="mobile-prompt-usage mt-2.5 hidden h-[30px] w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card2)] px-3 text-center text-sm text-[var(--muted)]">
                <span>Доступно промптов <span className="font-mono font-semibold text-accent">{remainingPrompts}/{promptAllowance}</span></span>
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
              </div>

              <AnalysisSettingsPanel
                source={analysisSource}
                onSourceChange={setAnalysisSource}
                utcOffset={analysisUtcOffset}
                onUtcOffsetChange={setAnalysisUtcOffset}
                calendarCountries={calendarCountries}
                onCalendarCountriesChange={setCalendarCountries}
                calendarEnabled={calendarEnabled}
                onCalendarEnabledChange={setCalendarEnabled}
                ticksEnabled={ticksEnabled}
                onTicksEnabledChange={setTicksEnabled}
                disabledToggleKeys={disabledToggleKeys}
                disabledChartIndicatorKeys={disabledChartIndicatorKeys}
                toggleGroups={TPL.TOGGLES}
                onToggleBlock={toggleAnalysisBlock}
                onToggleChartIndicator={toggleChartIndicator}
                logs={analysisLogs}
                onClearLogs={() => setAnalysisLogs([])}
                onCheckBlocks={handleCheckBlocks}
              />
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
              className="message-fade mobile-prompt-settings-modal scrollable max-h-full w-full max-w-md overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
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
                    <div id="mobile-prompt-settings-title" className="font-semibold text-[var(--text)]">Конструктор промпта</div>
                    <div className="mt-0.5 text-xs text-[var(--muted)]">Настройки промпта</div>
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
                <AssetSearch onSelect={handleAssetSearchSelect} />
                <div className="mobile-instrument-row grid grid-cols-2 gap-2">
                  <div data-prompt-guide="currency-pair" className="flex min-w-0 flex-col gap-1.5">
                    <div className="prompt-field-label text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      <span>Инструмент</span>
                    </div>
                    <CustomSelect
                      value={availableInstruments.includes(selectedPair) ? selectedPair : availableInstruments[0]}
                      onChange={setSelectedPair}
                      options={availableInstruments.filter(Boolean).map(pair => ({ label: pair, value: pair, icon: <PairFlag pair={pair} size={13} /> }))}
                      subdued
                      dropDown
                    />
                  </div>
                  <div data-prompt-guide="asset-type" className="flex min-w-0 flex-col gap-1.5">
                    <div className="prompt-field-label text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      <span>Тип инструмента</span>
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

                <div className="prompt-data-volume">
                  <div className="prompt-history-grid">
                    <div data-prompt-guide="bar-count" className="flex min-w-0 flex-col gap-1.5">
                      <label htmlFor="mobile-analysis-history-bars" className="prompt-field-label prompt-history-label">
                        Баров в промпте
                      </label>
                      <input
                        id="mobile-analysis-history-bars"
                        className="prompt-builder-input prompt-history-input"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        inputMode="numeric"
                        value={analysisHistoryBars}
                        onChange={event => setAnalysisHistoryBars(Number(event.target.value))}
                        onBlur={() => setAnalysisHistoryBars(value => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 30)))}
                      />
                    </div>
                    {timeframeFields.map((field, index) => (
                      <div key={field.label} data-prompt-guide={`timeframe-${index + 1}`} className="sig-field-timeframe flex min-w-0 flex-col gap-1.5">
                        <div className="prompt-field-label pl-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted2)]">
                          <span style={{ display: 'block', height: '11px', fontSize: '9px', fontWeight: 400, lineHeight: '11px' }}>{field.label}</span>
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

                <div data-prompt-guide="prompt-purpose" className="flex flex-col gap-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    <span className="prompt-field-label">Дополнение к промпту</span>
                  </div>
                  <textarea
                    aria-label="Дополнительные требования к анализу"
                    dir="ltr"
                    value={promptPurpose}
                    placeholder="Например: оцени вероятность роста или падения по данному активу в ближайший час"
                    className="mobile-prompt-purpose min-h-24 resize-none rounded-lg border border-[var(--border)] bg-[var(--input-bg)] p-3 font-display text-xs leading-relaxed text-[var(--text)] outline-none"
                    onChange={e => setPromptPurpose(e.target.value)}
                  />
                </div>

                <AnalysisSettingsPanel
                  source={analysisSource}
                  onSourceChange={setAnalysisSource}
                  utcOffset={analysisUtcOffset}
                  onUtcOffsetChange={setAnalysisUtcOffset}
                  calendarCountries={calendarCountries}
                  onCalendarCountriesChange={setCalendarCountries}
                  calendarEnabled={calendarEnabled}
                  onCalendarEnabledChange={setCalendarEnabled}
                  ticksEnabled={ticksEnabled}
                  onTicksEnabledChange={setTicksEnabled}
                  disabledToggleKeys={disabledToggleKeys}
                  disabledChartIndicatorKeys={disabledChartIndicatorKeys}
                  toggleGroups={TPL.TOGGLES}
                  onToggleBlock={toggleAnalysisBlock}
                  onToggleChartIndicator={toggleChartIndicator}
                  onDone={() => setMobilePromptSettingsOpen(false)}
                  logs={analysisLogs}
                  onClearLogs={() => setAnalysisLogs([])}
                  onCheckBlocks={handleCheckBlocks}
                />
              </div>

              <div className="border-t border-[var(--border)] p-4">
                <button
                  type="button"
                  className="flex h-10 w-full items-center justify-center rounded-lg border border-[var(--accent)] bg-[var(--accent)] font-semibold text-[var(--on-accent)] transition-colors hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)]"
                  onClick={() => setMobilePromptSettingsOpen(false)}
                >
                  Готово
                </button>
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
        sessionChecked={sessionChecked}
        guideCompleted={user?.guideCompleted ?? false}
        onGuideFinished={handleGuideFinished}
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
            className="message-fade limit-notice-modal"
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
              <div className="limit-notice-icon" style={{ width: 48, height: 48, borderRadius: '10px', background: '#191926', border: '1px solid #2E2E46', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          .sig-bar-outer { padding: 12px !important; }
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
          .chat-main input.prompt-builder-input { height: 30px !important; }
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
