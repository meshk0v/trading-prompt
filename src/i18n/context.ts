import { createContext, useContext } from 'react'
import type { Language, TranslationParams } from './translate'

type I18nValue = {
  language: Language
  setLanguage: (language: Language) => void
  /** Translates Russian UI text into the current language. */
  t: (text: string, params?: TranslationParams) => string
}

export const I18nContext = createContext<I18nValue | null>(null)

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>')
  return value
}
