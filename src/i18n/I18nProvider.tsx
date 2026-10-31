import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchSiteContent, type SiteContent } from '../api/texts'
import { mergeTerms, type TermName } from '../data/affiliate'
import { I18nContext } from './context'
import { translate, type Language, type TextOverride, type TextOverrides, type TranslationParams } from './translate'

const STORAGE_KEY = 'trading-prompt-language'
/** Changed texts and terms from the last visit, so they show up at once while fresh ones load. */
const CONTENT_CACHE_KEY = 'trading-prompt-content'
/** On a first visit the page waits this long for changed texts instead of flashing the old ones. */
const TEXTS_WAIT_MS = 1500

function readStoredLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ru'
  } catch {
    return 'ru'
  }
}

function readCachedContent(): SiteContent | null {
  try {
    const cached = localStorage.getItem(CONTENT_CACHE_KEY)
    return cached ? (JSON.parse(cached) as SiteContent) : null
  } catch {
    return null
  }
}

function cacheContent(content: SiteContent) {
  try {
    localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(content))
  } catch {
    // The site still shows the right texts, only without the cache.
  }
}

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readStoredLanguage)
  const [cached] = useState(readCachedContent)
  const [overrides, setOverrides] = useState<TextOverrides>(cached?.texts ?? {})
  const [storedTerms, setStoredTerms] = useState<Record<string, string>>(cached?.terms ?? {})
  const [ready, setReady] = useState(cached !== null)

  useEffect(() => {
    document.documentElement.lang = language
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Switching still works when storage is unavailable.
    }
  }, [language])

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), TEXTS_WAIT_MS)
    fetchSiteContent()
      .then(content => {
        setOverrides(content.texts)
        setStoredTerms(content.terms)
        cacheContent(content)
      })
      // Without the API (e.g. the GitHub Pages preview) the site shows the texts from the code.
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer)
        setReady(true)
      })
    return () => clearTimeout(timer)
  }, [])

  const setOverride = useCallback(
    (key: string, value: TextOverride | null) => {
      setOverrides(current => {
        const next = { ...current }
        if (value && (value.ru !== null || value.en !== null)) next[key] = value
        else delete next[key]
        cacheContent({ texts: next, terms: storedTerms })
        return next
      })
    },
    [storedTerms],
  )

  const setTerm = useCallback(
    (name: TermName, value: string | null) => {
      setStoredTerms(current => {
        const next = { ...current }
        if (value === null) delete next[name]
        else next[name] = value
        cacheContent({ texts: overrides, terms: next })
        return next
      })
    },
    [overrides],
  )

  const terms = useMemo(() => mergeTerms(storedTerms), [storedTerms])

  // Terms fill their placeholders in every text; a placeholder given explicitly wins.
  const tIn = useCallback(
    (target: Language, text: string, params?: TranslationParams) =>
      translate(target, text, { ...terms, ...params }, overrides),
    [overrides, terms],
  )
  const t = useCallback((text: string, params?: TranslationParams) => tIn(language, text, params), [language, tIn])
  const value = useMemo(
    () => ({ language, setLanguage, t, tIn, overrides, setOverride, terms, setTerm }),
    [language, t, tIn, overrides, setOverride, terms, setTerm],
  )

  if (!ready) return null
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
