import { useState } from 'react'
import { useI18n } from '../../i18n/context'
import { tr } from '../../i18n/translate'
import './CreditsSettings.css'

const MIN_CREDITS = 100
const MAX_CREDITS = 10000
const CREDIT_STEP = 100
const QUICK_AMOUNTS = [100, 500, 1000, 3000, 5000, 10000]

// Demo purchase history until payments are connected.
const PURCHASES = [
  { date: '01.07.2026', description: tr('Пополнение баланса'), credits: '+3 000', amount: '$300', status: tr('Оплачено') },
  { date: '01.04.2026', description: tr('Пополнение баланса'), credits: '+1 000', amount: '$100', status: tr('Оплачено') },
  { date: '01.01.2026', description: tr('Пополнение баланса'), credits: '+100', amount: '$10', status: tr('Оплачено') },
]

/** Credit top-up with a slider and the purchase history (payments are not connected yet). */
export default function CreditsSettings() {
  const { t } = useI18n()
  const [credits, setCredits] = useState(1000)
  const [activeTab, setActiveTab] = useState<'credits' | 'history'>('credits')
  const price = credits / 10
  const tabs = [
    {
      id: 'credits' as const,
      label: t('Кредиты'),
      icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 7h13" stroke="currentColor" strokeWidth="1.3"/><circle cx="5" cy="10" r="1" fill="currentColor"/></svg>,
    },
    {
      id: 'history' as const,
      label: t('История'),
      icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5V1.8M2.5 1.8H5.2M2.5 1.8l2.1 2.1A5.5 5.5 0 1 1 2 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 5v3.3l2.2 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
  ]

  return (
    <div className="credits-shell">
      <div className="credits-mobile-tabs">
        {tabs.map(tab => (
          <button
            type="button"
            key={tab.id}
            className={activeTab === tab.id ? 'credits-tab active' : 'credits-tab'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="credits-layout">
        <aside className="credits-sidebar">
          <nav>
            {tabs.map(tab => (
              <button
                type="button"
                key={tab.id}
                className={activeTab === tab.id ? 'credits-tab active' : 'credits-tab'}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>
        <div className="credits-page scrollable">
          <div className="credits-page-inner">
            {activeTab === 'credits' && (
              <>
        <div className="credits-hero">
          <div className="credits-hero-glow" />
          <div className="credits-eyebrow">
            <span />
            {t('Без подписки')}
          </div>
          <div className="credits-hero-copy">
            <div className="credits-title">{t('Пополните баланс кредитов')}</div>
            <div className="credits-description">
              {t('Выберите нужный объём — от 100 до 10 000 кредитов. Один кредит используется для создания одного готового промпта, а остаток не сгорает.')}
            </div>
          </div>
          <div className="credits-rate">
            <div className="credits-rate-label">{t('Стоимость одного промпта')}</div>
            <div className="credits-rate-value">0,10 $</div>
            <div className="credits-rate-caption">{t('1 промпт = 1 кредит')}</div>
          </div>
        </div>

        <div className="credits-purchase-grid">
          <div className="credits-builder">
            <div className="credits-builder-header">
              <div>
                <div className="credits-section-kicker">{t('Объём покупки')}</div>
                <div className="credits-selected-value">{credits.toLocaleString('ru-RU')}</div>
                <div className="credits-selected-caption">{t('кредитов')}</div>
              </div>
              <div className="credits-selected-price">
                <span>${price.toLocaleString('en-US')}</span>
                <small>{t('к оплате')}</small>
              </div>
            </div>

            <div className="credits-slider-wrap">
              <input
                className="credits-slider"
                type="range"
                min={MIN_CREDITS}
                max={MAX_CREDITS}
                step={CREDIT_STEP}
                value={credits}
                aria-label={t('Количество кредитов')}
                aria-valuetext={t('{credits} кредитов за {price} долларов', { credits, price })}
                onChange={event => setCredits(Number(event.target.value))}
              />
              <div className="credits-slider-scale">
                <span><strong>100</strong><small>$10</small></span>
                <span><strong>10 000</strong><small>$1 000</small></span>
              </div>
            </div>

            <div className="credits-quick-label">{t('Быстрый выбор')}</div>
            <div className="credits-quick-grid">
              {QUICK_AMOUNTS.map(amount => (
                <button
                  type="button"
                  key={amount}
                  className={credits === amount ? 'credits-quick-button active' : 'credits-quick-button'}
                  onClick={() => setCredits(amount)}
                >
                  {amount.toLocaleString('ru-RU')}
                </button>
              ))}
            </div>
          </div>

          <div className="credits-summary">
            <div className="credits-summary-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2.5" y="5" width="19" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2.5 9h19" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="credits-summary-title">{t('Ваш заказ')}</div>
            <div className="credits-summary-row">
              <span>{t('Кредиты')}</span>
              <strong>{credits.toLocaleString('ru-RU')}</strong>
            </div>
            <div className="credits-summary-row">
              <span>{t('Стоимость кредита')}</span>
              <strong>$0.10</strong>
            </div>
            <div className="credits-summary-divider" />
            <div className="credits-summary-total">
              <span>{t('Итого')}</span>
              <strong>${price.toLocaleString('en-US')}</strong>
            </div>
            <button type="button" className="credits-buy-button">
              {t('Купить {count} кредитов', { count: credits.toLocaleString('ru-RU') })}
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="credits-payment-note">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 6V4a4 4 0 0 1 8 0v2M2 6h10v7H2V6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              {t('Безопасная оплата')}
            </div>
          </div>
        </div>

        <div className="credits-benefits">
          {[
            {
              title: tr('Без срока действия'),
              text: tr('Кредиты остаются на балансе, пока вы их не используете.'),
              icon: <path d="M8 3v5l3 2M8 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>,
            },
            {
              title: tr('Прозрачная стоимость'),
              text: tr('Один готовый промпт списывает ровно один кредит.'),
              icon: <><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M8 4v8M10.5 5.5H6.8a1.7 1.7 0 0 0 0 3.4h2.4a1.7 1.7 0 0 1 0 3.4H5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>,
            },
            {
              title: tr('Мгновенное зачисление'),
              text: tr('Баланс обновляется автоматически сразу после оплаты.'),
              icon: <path d="m9.5 1-6 8h5l-1 6 6-8h-5l1-6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>,
            },
          ].map(item => (
            <div className="credits-benefit" key={item.title}>
              <div className="credits-benefit-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none">{item.icon}</svg></div>
              <div>
                <div className="credits-benefit-title">{t(item.title)}</div>
                <div className="credits-benefit-text">{t(item.text)}</div>
              </div>
            </div>
          ))}
        </div>
              </>
            )}

            {activeTab === 'history' && (
        <div className="credits-history">
          <div className="credits-history-heading">
            <div>
              <div className="credits-history-title">{t('История пополнений')}</div>
              <div className="credits-history-caption">{t('Последние операции с вашим балансом')}</div>
            </div>
            <div className="credits-history-count">{t('{count} операции', { count: PURCHASES.length })}</div>
          </div>
          <div className="credits-history-list">
            {PURCHASES.map(purchase => (
              <div className="credits-history-row" key={purchase.date}>
                <span>{purchase.date}</span>
                <span>{t(purchase.description)}</span>
                <strong>{purchase.credits}</strong>
                <span>{purchase.amount}</span>
                <span>{t(purchase.status)}</span>
              </div>
            ))}
          </div>
        </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
