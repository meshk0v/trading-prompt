import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchTexts } from '../api/texts'
import { I18nContext } from './context'
import { translate, type Language, type TextOverride, type TextOverrides, type TranslationParams } from './translate'

const STORAGE_KEY = 'trading-prompt-language'
/** Changed texts from the last visit, so they show up at once while fresh ones load. */
const TEXTS_CACHE_KEY = 'trading-prompt-texts'
/** On a first visit the page waits this long for changed texts instead of flashing the old ones. */
const TEXTS_WAIT_MS = 1500

function readStoredLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ru'
  } catch {
    return 'ru'
  }
}

function readCachedTexts(): TextOverrides | null {
  try {
    const cached = localStorage.getItem(TEXTS_CACHE_KEY)
    return cached ? (JSON.parse(cached) as TextOverrides) : null
  } catch {
    return null
  }
}

function cacheTexts(texts: TextOverrides) {
  try {
    localStorage.setItem(TEXTS_CACHE_KEY, JSON.stringify(texts))
  } catch {
    // The site still shows the right texts, only without the cache.
  }
}

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readStoredLanguage)
  const [cachedTexts] = useState(readCachedTexts)
  const [overrides, setOverrides] = useState<TextOverrides>(cachedTexts ?? {})
  const [ready, setReady] = useState(cachedTexts !== null)

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
    fetchTexts()
      .then(texts => {
        setOverrides(texts)
        cacheTexts(texts)
      })
      // Without the API (e.g. the GitHub Pages preview) the site shows the texts from the code.
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer)
        setReady(true)
      })
    return () => clearTimeout(timer)
  }, [])

  const setOverride = useCallback((key: string, value: TextOverride | null) => {
    setOverrides(current => {
      const next = { ...current }
      if (value && (value.ru !== null || value.en !== null)) next[key] = value
      else delete next[key]
      cacheTexts(next)
      return next
    })
  }, [])

  const tIn = useCallback(
    (target: Language, text: string, params?: TranslationParams) => translate(target, text, params, overrides),
    [overrides],
  )
  const t = useCallback((text: string, params?: TranslationParams) => tIn(language, text, params), [language, tIn])
  const value = useMemo(
    () => ({ language, setLanguage, t, tIn, overrides, setOverride }),
    [language, t, tIn, overrides, setOverride],
  )

  if (!ready) return null
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
