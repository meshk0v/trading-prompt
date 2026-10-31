import { tr } from '../i18n/translate'

/** Affiliate program terms that administrators can change in the editor; the rest stay in the code. */
export type AffiliateTerms = {
  rewardPercent: number
  payoutFeePercent: number
  payoutCurrency: string
  payoutNetwork: string
  maxClients: number
  maxDeposit: number
}

export type TermName = keyof AffiliateTerms

/** Values used until an administrator changes them. */
export const DEFAULT_TERMS: AffiliateTerms = {
  rewardPercent: 50,
  payoutFeePercent: 0,
  payoutCurrency: 'USDT',
  payoutNetwork: 'TRC-20',
  maxClients: 500,
  maxDeposit: 1000,
}

/** Fixed calculator values; they are not editable. */
export const AFFILIATE_TERMS = {
  minClients: 1,
  defaultClients: 10,
  minDeposit: 1,
  defaultDeposit: 20,
} as const

type TermField =
  | { name: TermName; label: string; hint: string; kind: 'number' | 'integer'; min: number; max: number }
  | { name: TermName; label: string; hint: string; kind: 'word' }

/** The editor lists these; limits match terms-save.php. A term is written in a text as {name}. */
export const TERM_FIELDS: TermField[] = [
  {
    name: 'rewardPercent',
    label: tr('Вознаграждение партнёра, %'),
    hint: tr('Доля от каждого пополнения реферала. Используется в калькуляторе дохода.'),
    kind: 'number',
    min: 1,
    max: 100,
  },
  {
    name: 'payoutFeePercent',
    label: tr('Комиссия сервиса за перевод, %'),
    hint: tr('Показывается в условиях программы и в вопросах и ответах.'),
    kind: 'number',
    min: 0,
    max: 100,
  },
  {
    name: 'payoutCurrency',
    label: tr('Валюта выплат'),
    hint: tr('Например, USDT.'),
    kind: 'word',
  },
  {
    name: 'payoutNetwork',
    label: tr('Сеть выплат'),
    hint: tr('Например, TRC-20.'),
    kind: 'word',
  },
  {
    name: 'maxClients',
    label: tr('Калькулятор: максимум приглашённых клиентов'),
    hint: tr('Правый край ползунка «Приглашённые клиенты».'),
    kind: 'integer',
    min: 2,
    max: 100000,
  },
  {
    name: 'maxDeposit',
    label: tr('Калькулятор: максимальное пополнение, $'),
    hint: tr('Правый край ползунка «Среднее пополнение».'),
    kind: 'integer',
    min: 2,
    max: 1000000,
  },
]

/** Terms from the server (strings) on top of the defaults; a value out of range falls back to the default. */
export function mergeTerms(stored: Record<string, string>): AffiliateTerms {
  const terms: Record<string, string | number> = { ...DEFAULT_TERMS }
  for (const field of TERM_FIELDS) {
    const value = stored[field.name]
    if (value === undefined) continue
    if (field.kind === 'word') {
      terms[field.name] = value
    } else {
      const number = Number(value)
      if (Number.isFinite(number) && number >= field.min && number <= field.max) terms[field.name] = number
    }
  }
  return terms as AffiliateTerms
}
