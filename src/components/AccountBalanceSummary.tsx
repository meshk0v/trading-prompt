import { useI18n } from '../i18n/context'
import { WalletIcon } from './icons'
import './AccountBalanceSummary.css'

const PROMPT_PRICE_USD = 0.1

/** Balance card shown at the top of the signed-in menu. */
export default function AccountBalanceSummary({ remaining }: { remaining: number }) {
  const { t } = useI18n()
  const balance = (remaining * PROMPT_PRICE_USD).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  return (
    <div
      className="balance-summary"
      role="status"
      aria-label={t('Текущий баланс {balance}, доступно промптов {remaining}', { balance, remaining })}
    >
      <div className="balance-summary__icon" aria-hidden="true">
        <WalletIcon />
      </div>
      <div className="balance-summary__stat">
        <span>{t('Баланс')}</span>
        <strong>{balance}</strong>
      </div>
      <span className="balance-summary__divider" aria-hidden="true" />
      <div className="balance-summary__stat balance-summary__stat--accent">
        <span>{t('Промпты')}</span>
        <strong>{remaining}</strong>
      </div>
    </div>
  )
}
