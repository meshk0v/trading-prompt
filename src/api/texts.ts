import type { TermName } from '../data/affiliate'
import type { TextOverrides } from '../i18n/translate'
import { post, request } from './auth'

type SiteText = { key: string; ru: string | null; en: string | null }

export type SiteContent = {
  /** Texts changed by administrators, keyed by the Russian text in the code. */
  texts: TextOverrides
  /** Affiliate terms changed by administrators (values as the server stores them). */
  terms: Record<string, string>
}

export async function fetchSiteContent(): Promise<SiteContent> {
  const { texts, terms } = await request<{ texts: SiteText[]; terms?: Record<string, string> }>('texts')
  return { texts: Object.fromEntries(texts.map(({ key, ru, en }) => [key, { ru, en }])), terms: terms ?? {} }
}

/** Saves a changed text (administrators only). Empty values bring back the text from the code. */
export async function saveText(key: string, ru: string | null, en: string | null): Promise<SiteText> {
  return (await post<{ text: SiteText }>('texts-save', { key, ru, en })).text
}

/** Saves an affiliate term (administrators only). An empty value brings back the default; returns the stored value. */
export async function saveTerm(name: TermName, value: string): Promise<string | null> {
  return (await post<{ value: string | null }>('terms-save', { name, value })).value
}
