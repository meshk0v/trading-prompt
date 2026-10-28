import type { TextOverrides } from '../i18n/translate'
import { post, request } from './auth'

type SiteText = { key: string; ru: string | null; en: string | null }

/** Texts changed by administrators, keyed by the Russian text in the code. */
export async function fetchTexts(): Promise<TextOverrides> {
  const { texts } = await request<{ texts: SiteText[] }>('texts')
  return Object.fromEntries(texts.map(({ key, ru, en }) => [key, { ru, en }]))
}

/** Saves a changed text (administrators only). Empty values bring back the text from the code. */
export async function saveText(key: string, ru: string | null, en: string | null): Promise<SiteText> {
  return (await post<{ text: SiteText }>('texts-save', { key, ru, en })).text
}
