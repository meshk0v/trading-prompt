import { DICTIONARY } from './dictionary'

export type Language = 'ru' | 'en'
export type TranslationParams = Record<string, string | number>

/** A text changed by an administrator; `null` keeps the text from the code for that language. */
export type TextOverride = { ru: string | null; en: string | null }
export type TextOverrides = Record<string, TextOverride>

/** The text from the code: Russian is the key itself, English comes from the dictionary. */
export function defaultText(language: Language, text: string): string {
  if (language === 'ru') return text
  if (text in DICTIONARY) return DICTIONARY[text]
  if (import.meta.env.DEV) console.warn(`[i18n] Missing English translation: "${text}"`)
  return text
}

/**
 * Russian is the source language: UI code passes Russian text, and English comes from the dictionary.
 * Texts changed in the admin text editor (`overrides`) win over both.
 * Placeholders like `{count}` are filled from `params`.
 */
export function translate(
  language: Language,
  text: string,
  params?: TranslationParams,
  overrides?: TextOverrides,
): string {
  const result = overrides?.[text]?.[language] ?? defaultText(language, text)
  if (!params) return result
  return result.replace(/\{(\w+)\}/g, (match, key: string) => (key in params ? String(params[key]) : match))
}

/**
 * Marks a Russian string stored in data (menus, labels) as translatable, so `npm run i18n:check`
 * can find it. It returns the text unchanged; translate it with t() when rendering.
 */
export const tr = (text: string) => text
