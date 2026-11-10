import { post } from './auth'

/** A simulated credit purchase. No payment system is connected yet, so nothing is charged. */
export type Purchase = {
  id: string
  /** ISO date-time. */
  date: string
  credits: number
  amountUsd: number
}

const key = (userId: number) => `tp-demo-purchases-${userId}`

export function loadPurchases(userId: number): Purchase[] {
  try {
    const list = JSON.parse(localStorage.getItem(key(userId)) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function savePurchases(userId: number, purchases: Purchase[]): void {
  try {
    localStorage.setItem(key(userId), JSON.stringify(purchases))
  } catch {
    // Private mode or blocked storage: the purchases then only live until the page is reloaded.
  }
}

/** Tells the server about the test payment so the referral program can be tried. The server ignores it unless demo payments are switched on. */
export async function reportDemoPayment(amountUsd: number): Promise<void> {
  await post('payment-demo', { amount: amountUsd }).catch(() => undefined)
}
