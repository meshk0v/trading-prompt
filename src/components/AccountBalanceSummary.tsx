export default function AccountBalanceSummary({ remaining, className }: { remaining: number; className?: string }) {
  const balance = (remaining * 0.1).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  return (
    <div
      className={['account-balance-summary', className].filter(Boolean).join(' ')}
      role="status"
      aria-label={`Текущий баланс ${balance}, доступно промптов ${remaining}`}
    >
      <div className="account-balance-icon" aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M1.5 7h13" stroke="currentColor" strokeWidth="1.3"/>
          <circle cx="5" cy="10" r="1" fill="currentColor"/>
        </svg>
      </div>
      <div className="account-balance-stat">
        <span>Баланс</span>
        <strong>{balance}</strong>
      </div>
      <span className="account-balance-divider" aria-hidden="true" />
      <div className="account-balance-stat">
        <span>Промпты</span>
        <strong>{remaining}</strong>
      </div>
    </div>
  )
}
