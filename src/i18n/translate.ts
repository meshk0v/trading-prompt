import { en } from './en'

export type Language = 'ru' | 'en'
export type TranslationParams = Record<string, string | number>

/**
 * Russian is the source language: UI code passes Russian text, and English comes from `en.ts`.
 * Placeholders like `{count}` are filled from `params`.
 */
export function translate(language: Language, text: string, params?: TranslationParams): string {
  let result = text
  if (language === 'en') {
    if (text in en) result = en[text]
    else if (import.meta.env.DEV) console.warn(`[i18n] Missing English translation: "${text}"`)
  }
  if (!params) return result
  return result.replace(/\{(\w+)\}/g, (match, key: string) => (key in params ? String(params[key]) : match))
}

/**
 * Marks a Russian string stored in data (menus, labels) as translatable, so `npm run i18n:check`
 * can find it. It returns the text unchanged; translate it with t() when rendering.
 */
export const tr = (text: string) => text
