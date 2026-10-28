import { GREETINGS } from '../data/greetings'
import { LEGAL_DOCUMENTS } from '../data/legal'
import { en } from './en'

/** Pairs Russian and English texts that are stored side by side as `{ ru: [...], en: [...] }`. */
function pairTexts(ru: string[], english: string[]): Record<string, string> {
  return Object.fromEntries(ru.map((text, index) => [text, english[index] ?? text]))
}

function legalTexts(language: 'ru' | 'en'): string[] {
  return LEGAL_DOCUMENTS[language].flatMap(document => [
    document.title,
    ...document.sections.flatMap(section => [section.heading, section.text]),
  ])
}

/** Long texts kept in data files rather than in `en.ts`, in the order they appear on the site. */
export const LONG_TEXTS = {
  greetings: GREETINGS.ru,
  legal: legalTexts('ru'),
}

/** Every Russian text of the site with its English version. */
export const DICTIONARY: Record<string, string> = {
  ...pairTexts(GREETINGS.ru, GREETINGS.en),
  ...pairTexts(legalTexts('ru'), legalTexts('en')),
  ...en,
}
