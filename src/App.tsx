import { lazy, Suspense, useCallback, useEffect, useState, type CSSProperties } from 'react'
import { completeGuide, fetchCurrentUser, logout, type AuthUser } from './api/auth'
import AuthModal from './components/AuthModal'
import ChatMessages from './components/chat/ChatMessages'
import MobilePromptSettings from './components/chat/MobilePromptSettings'
import PromptBuilderPanel from './components/chat/PromptBuilderPanel'
import AppHeader from './components/layout/AppHeader'
import MainMenu from './components/layout/MainMenu'
import PageFooter from './components/layout/PageFooter'
import LimitModal from './components/LimitModal'
import PromptBuilderGuide from './components/PromptBuilderGuide'
import { DEFAULT_WATCHLIST } from './data/instruments'
import { useChat } from './hooks/useChat'
import { usePromptBuilder } from './hooks/usePromptBuilder'
import { useI18n } from './i18n/context'
import { LINKABLE_PAGES, type FaqCategoryFilter, type Page, type SettingsSection } from './navigation'
import AffiliatePage from './pages/AffiliatePage'
import EconomicCalendarPage from './pages/EconomicCalendarPage'
import FaqPage from './pages/FaqPage'
import LegalPage from './pages/LegalPage'
import PublicAffiliatePage from './pages/PublicAffiliatePage'
import SettingsPage from './pages/settings/SettingsPage'
import SupportPage from './pages/SupportPage'
import { buildPrompt, parseBarCount } from './utils/buildPrompt'
import './App.css'

// Only administrators open the text editor, so it is loaded on demand.
const TextsPage = lazy(() => import('./pages/TextsPage'))

/** Prompts available for free (guests, and signed-in users before buying credits). */
const FREE_PROMPT_LIMIT = 3

export default function App() {
  const { t } = useI18n()
  const [user, setUser] = useState<AuthUser | null>(null)

  // Navigation
  const [page, setPage] = useState<Page>('chat')
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('account')
  const [faqCategory, setFaqCategory] = useState<FaqCategoryFilter>('Все')
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)
  const [limitModal, setLimitModal] = useState<'guest' | 'user' | null>(null)

  // Prompt builder
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST)
  const [panelWidth, setPanelWidth] = useState(400)
  const builder = usePromptBuilder(watchlist)
  const { messages, isTyping, addPromptExchange } = useChat()
  const [guestPromptsUsed, setGuestPromptsUsed] = useState(0)
  const [userPromptsUsed, setUserPromptsUsed] = useState(0)
  const promptsUsed = user ? userPromptsUsed : guestPromptsUsed
  const remainingPrompts = Math.max(0, FREE_PROMPT_LIMIT - promptsUsed)

  // Restore the session on load.
  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => {})
  }, [])

  const openLinkedPage = (id: string) => {
    if (id === 'faq') setFaqCategory('Все')
    setPage(LINKABLE_PAGES.includes(id as Page) ? (id as Page) : 'chat')
  }
  const openSettings = (section: SettingsSection) => {
    setSettingsSection(section)
    setPage('settings')
  }
  const openFaq = () => {
    setFaqCategory('Все')
    setPage('faq')
  }
  const closePage = () => setPage('chat')

  const handleAuth = useCallback((authUser: AuthUser) => {
    setUser(authUser)
    setAuthOpen(false)
    setUserPromptsUsed(0)
  }, [])

  const handleGuideComplete = useCallback(() => {
    setUser(current => (current ? { ...current, guideCompleted: true } : current))
    completeGuide().catch(() => {})
  }, [])

  const handleLogout = useCallback(() => {
    setUser(null)
    logout().catch(() => {})
  }, [])

  const handleGeneratePrompt = () => {
    if (promptsUsed >= FREE_PROMPT_LIMIT) {
      setLimitModal(user ? 'user' : 'guest')
      return
    }

    const prompt = buildPrompt(
      {
        pair: builder.pair,
        assetType: builder.assetType,
        timeframes: builder.timeframes.filter(Boolean),
        priceHistory: parseBarCount(builder.priceHistory),
        indicatorHistory: parseBarCount(builder.indicatorHistory),
        purpose: builder.purpose,
      },
      t,
    )
    addPromptExchange(prompt, { pair: builder.pair, timeframe: builder.timeframes[0] })

    const used = promptsUsed + 1
    if (user) setUserPromptsUsed(used)
    else setGuestPromptsUsed(used)
    if (used === FREE_PROMPT_LIMIT) setLimitModal(user ? 'user' : 'guest')
  }

  const isChat = page === 'chat'
  const mainClassName = ['app-main', isChat && 'app-main--chat', user && 'app-main--with-footer']
    .filter(Boolean)
    .join(' ')

  return (
    <div className="app">
      <MainMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        isAuthenticated={Boolean(user)}
        isAdmin={Boolean(user?.isAdmin)}
        remainingPrompts={remainingPrompts}
        onOpenPage={setPage}
        onOpenSettings={openSettings}
        onOpenFaq={openFaq}
        onSignIn={() => setAuthOpen(true)}
        onLogout={handleLogout}
      />

      <main className={mainClassName} style={{ '--prompt-panel-width': `${panelWidth}px` } as CSSProperties}>
        <AppHeader />

        {page === 'affiliate' &&
          (user ? (
            <AffiliatePage onClose={closePage} />
          ) : (
            <PublicAffiliatePage onClose={closePage} onSignUp={() => setAuthOpen(true)} />
          ))}
        {page === 'legal' && <LegalPage onClose={closePage} />}
        {page === 'support' && <SupportPage onClose={closePage} />}
        {page === 'settings' && (
          <SettingsPage
            user={user}
            onUserUpdate={setUser}
            initialSection={settingsSection}
            onClose={closePage}
            watchlist={watchlist}
            setWatchlist={setWatchlist}
          />
        )}
        {page === 'calendar' && <EconomicCalendarPage onClose={closePage} />}
        {page === 'texts' && user?.isAdmin && (
          <Suspense fallback={null}>
            <TextsPage onClose={closePage} />
          </Suspense>
        )}
        {page === 'faq' && (
          <FaqPage
            initialCategory={faqCategory}
            onClose={() => {
              setFaqCategory('Все')
              closePage()
            }}
            user={user}
            onSignUp={() => setAuthOpen(true)}
            onNavigate={openLinkedPage}
            onOpenSettings={section => openSettings(section as SettingsSection)}
          />
        )}

        {/* The chat stays mounted on other pages so its state survives navigation. */}
        <ChatMessages messages={messages} isTyping={isTyping} user={user} hidden={!isChat} />
        <PromptBuilderPanel
          builder={builder}
          hidden={!isChat}
          panelWidth={panelWidth}
          onPanelWidthChange={setPanelWidth}
          remainingPrompts={remainingPrompts}
          promptLimit={FREE_PROMPT_LIMIT}
          onGenerate={handleGeneratePrompt}
          onOpenMobileSettings={() => setMobileSettingsOpen(true)}
        />

        {mobileSettingsOpen && <MobilePromptSettings builder={builder} onClose={() => setMobileSettingsOpen(false)} />}
        {user && <PageFooter onOpenPage={openLinkedPage} onOpenSettings={openSettings} />}
      </main>

      <PromptBuilderGuide
        isAuthenticated={Boolean(user)}
        authGuideCompleted={Boolean(user?.guideCompleted)}
        onAuthGuideComplete={handleGuideComplete}
        menuOpen={menuOpen}
        mobileSettingsOpen={mobileSettingsOpen}
        onOpenMenu={() => setMenuOpen(true)}
        onCloseMenu={() => setMenuOpen(false)}
        onOpenMobileSettings={() => setMobileSettingsOpen(true)}
        onCloseMobileSettings={() => setMobileSettingsOpen(false)}
      />

      {authOpen && (
        <AuthModal
          initialTab={!user && guestPromptsUsed >= FREE_PROMPT_LIMIT ? 'register' : 'login'}
          onClose={() => setAuthOpen(false)}
          onAuth={handleAuth}
          onOpenLegal={() => {
            setAuthOpen(false)
            setPage('legal')
          }}
        />
      )}

      {limitModal && (
        <LimitModal
          variant={limitModal}
          onClose={() => setLimitModal(null)}
          onAction={() => {
            setLimitModal(null)
            if (limitModal === 'guest') setAuthOpen(true)
            else openSettings('subscription')
          }}
        />
      )}
    </div>
  )
}
