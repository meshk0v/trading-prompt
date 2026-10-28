import { createContext, useContext } from 'react'
import type { Language, TextOverride, TextOverrides, TranslationParams } from './translate'

type I18nValue = {
  language: Language
  setLanguage: (language: Language) => void
  /** Translates Russian UI text into the current language. */
  t: (text: string, params?: TranslationParams) => string
  /** Same as t(), into a given language. */
  tIn: (language: Language, text: string, params?: TranslationParams) => string
  /** Texts changed in the admin text editor, keyed by the Russian text in the code. */
  overrides: TextOverrides
  /** Applies a saved change at once; `null` brings back the text from the code. */
  setOverride: (key: string, value: TextOverride | null) => void
}

export const I18nContext = createContext<I18nValue | null>(null)

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>')
  return value
}
