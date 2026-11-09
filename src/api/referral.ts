import { post, request } from './auth'

export type ReferralLink = {
  id: number
  code: string
  name: string
  isDefault: boolean
  deleted: boolean
  clients: number
  payingClients: number
  earnedCents: number
}

export type ReferralPartner = {
  id: number
  name: string
  email: string
  /** Registration time, "YYYY-MM-DD HH:MM:SS" in UTC. */
  date: string
  linkId: number
  /** `active` has paid at least once; `pending` has only registered. */
  status: 'active' | 'pending'
  depositedCents: number
  earnedCents: number
}

export type PayoutRequest = {
  id: number
  date: string
  amountCents: number
  feeCents: number
  netCents: number
  wallet: string
  network: string
  status: 'processing' | 'completed' | 'rejected'
}

export type ReferralTerms = {
  rewardPercent: number
  /** Share of the network fee charged to the partner. */
  feeSharePercent: number
  networks: { id: string; feeCents: number; partnerFeeCents: number }[]
}

export type ReferralData = {
  links: ReferralLink[]
  partners: ReferralPartner[]
  withdrawals: PayoutRequest[]
  wallet: { address: string; network: string } | null
  availableCents: number
  terms: ReferralTerms
}

const REF_STORAGE_KEY = 'trading-prompt-ref'

/** Remembers the referral code from the visited link (`?ref=code`) until the visitor registers. */
export function rememberReferralFromUrl(): void {
  try {
    const code = new URLSearchParams(window.location.search).get('ref')
    if (code && /^[a-z0-9]{4,16}$/.test(code)) localStorage.setItem(REF_STORAGE_KEY, code)
  } catch {
    // Storage can be unavailable; the visitor then registers without a partner.
  }
}

export function storedReferral(): string | undefined {
  try {
    return localStorage.getItem(REF_STORAGE_KEY) ?? undefined
  } catch {
    return undefined
  }
}

export function fetchReferral(): Promise<ReferralData> {
  return request<ReferralData & { ok: true }>('referral')
}

export async function createReferralLink(name: string): Promise<void> {
  await post('referral-link', { action: 'create', name })
}

export async function deleteReferralLink(id: number): Promise<void> {
  await post('referral-link', { action: 'delete', id })
}

export async function saveWallet(address: string, network: string): Promise<void> {
  await post('referral-wallet', { address, network })
}

export function requestPayout(): Promise<{ amountCents: number; feeCents: number; netCents: number }> {
  return post('payout-request')
}
