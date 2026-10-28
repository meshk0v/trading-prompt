// Screens of the single-page app. "chat" is the prompt builder; the rest replace it while open.
export type Page = 'chat' | 'affiliate' | 'legal' | 'support' | 'settings' | 'calendar' | 'faq' | 'texts'

export type SettingsSection = 'account' | 'prompt-settings' | 'subscription'

export type FaqCategoryFilter = 'Все' | 'Партнёрская программа'

/** Pages reachable from footer and in-page links. Anything else falls back to the chat. */
export const LINKABLE_PAGES: Page[] = ['affiliate', 'support', 'legal', 'faq']

export const AI_LINKS = [
  { label: 'ChatGPT', href: 'https://chatgpt.com/' },
  { label: 'Claude', href: 'https://claude.ai/' },
  { label: 'Gemini', href: 'https://gemini.google.com/app' },
]
