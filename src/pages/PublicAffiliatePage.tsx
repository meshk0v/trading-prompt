import { useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { AFFILIATE_TERMS } from '../data/affiliate'
import { useI18n } from '../i18n/context'
import { tr } from '../i18n/translate'
import './PublicAffiliatePage.css'

type PublicAffiliatePageProps = {
  onClose: () => void
  onSignUp: () => void
}

const MAX_DEPOSIT = 1000
const { rewardPercent, payoutCurrency, payoutNetwork } = AFFILIATE_TERMS

const BENEFITS = [
  { title: tr('Половина с каждого пополнения'), text: tr('Самая высокая доля, а не символический бонус') },
  { title: tr('Деньги сразу'), text: tr('Никаких выплатных дней и ожидания') },
  { title: tr('Доход с повторных пополнений'), text: tr('Реферал пополнил снова — вы получили снова') },
  { title: tr('Напрямую на кошелёк'), text: tr('Без заявок и ручных выводов') },
  { title: tr('Прозрачная статистика'), text: tr('Переходы, регистрации и начисления в кабинете') },
  { title: tr('Поддержка'), text: tr('Отвечаем в Telegram @binum_support') },
]

const BENEFIT_ICONS: ReactNode[] = [
  <>
    <circle cx="6.5" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.25" />
    <circle cx="15.5" cy="15.5" r="3" stroke="currentColor" strokeWidth="1.25" />
    <path d="m5 17 12-12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
  </>,
  <path d="m12.5 2-7 9h5L9.5 20l7-9h-5l1-9Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />,
  <path d="M18.5 8A8 8 0 0 0 4 6M3.5 3.5V7H7M3.5 14A8 8 0 0 0 18 16m.5 2.5V15H15" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />,
  <>
    <rect x="2.5" y="5" width="17" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M2.5 9h17" stroke="currentColor" strokeWidth="1.25" />
    <path d="M15 13h2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </>,
  <path d="M3 18V9m5 9V4m5 14v-6m5 6V7M2 18.5h18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />,
  <>
    <path d="M4 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 3v-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    <path d="M7 9h8M7 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </>,
]

/** Dashed curves drawn behind the hero text. */
function heroWavePath(index: number) {
  const offset = index - 6.5
  return [
    `M-100 ${560 + offset * 16}`,
    `C20 ${590 + offset * 14} 110 ${548 + offset * 4} 190 ${505 + offset * 0.35}`,
    `C315 ${415 + offset * 15} 430 ${165 + offset * 18} 650 ${286 + offset * 0.7}`,
    `C770 ${352 + offset * 15} 910 ${470 + offset * 19} 1040 ${272 + offset * 0.25}`,
    `C1115 ${158 + offset * 9} 1185 ${28 + offset * 14} 1300 ${-34 + offset * 17}`,
  ].join('')
}

const formatNumber = (value: number, maximumFractionDigits = 0) => value.toLocaleString('en-US', { maximumFractionDigits })

/** Public affiliate program page for guests: terms, steps, benefits and an income calculator. */
export default function PublicAffiliatePage({ onClose, onSignUp }: PublicAffiliatePageProps) {
  const { t } = useI18n()
  const howItWorksRef = useRef<HTMLElement>(null)
  const benefitsRef = useRef<HTMLElement>(null)
  const calculatorRef = useRef<HTMLElement>(null)
  const [clients, setClients] = useState<number>(AFFILIATE_TERMS.defaultClients)
  const [averageDeposit, setAverageDeposit] = useState<number>(AFFILIATE_TERMS.defaultDeposit)
  const income = useMemo(() => clients * averageDeposit * AFFILIATE_TERMS.rewardRate, [clients, averageDeposit])

  const scrollTo = (ref: RefObject<HTMLElement | null>) => () => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const termTiles = [
    { value: t('Мгновенно'), label: t('выплата на кошелёк') },
    { value: `${payoutCurrency} ${payoutNetwork}`, label: t('валюта выплат') },
    { value: `${AFFILIATE_TERMS.payoutFeePercent}%`, label: t('комиссия за перевод') },
    { value: t('Повторно'), label: t('доход с новых пополнений') },
  ]

  const steps = [
    { title: t('Зарегистрируйтесь'), text: t('Это занимает минуту, отдельной заявки не нужно') },
    {
      title: t('Укажите кошелёк'),
      text: t('Добавьте {currency} {network} и скопируйте реферальную ссылку в кабинете', { currency: payoutCurrency, network: payoutNetwork }),
    },
    { title: t('Приглашайте'), text: t('Делитесь ссылкой с аудиторией, друзьями и подписчиками') },
    { title: t('Получайте'), text: t('{percent}% от пополнения реферала приходят на ваш кошелёк сразу', { percent: rewardPercent }) },
  ]

  const ranges = [
    {
      id: 'affiliate-clients-range',
      label: t('Приглашённые клиенты'),
      output: formatNumber(clients),
      value: clients,
      min: AFFILIATE_TERMS.minClients,
      max: AFFILIATE_TERMS.maxClients,
      onChange: setClients,
      scale: [t('{count} клиент', { count: AFFILIATE_TERMS.minClients }), t('{count} клиентов', { count: AFFILIATE_TERMS.maxClients })],
    },
    {
      id: 'affiliate-deposit-range',
      label: t('Среднее пополнение'),
      output: `$${formatNumber(averageDeposit)}`,
      value: averageDeposit,
      min: AFFILIATE_TERMS.minDeposit,
      max: MAX_DEPOSIT,
      onChange: setAverageDeposit,
      scale: [`$${AFFILIATE_TERMS.minDeposit}`, `$${formatNumber(MAX_DEPOSIT)}`],
    },
  ]

  return (
    <div className="public-affiliate">
      <div className="public-affiliate__header">
        <div className="public-affiliate__heading">
          <div className="public-affiliate__header-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="15" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="10" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="m7.2 7.3 1.6 5M12.8 7.3l-1.6 5M7.5 6h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="public-affiliate__heading-text">
            <div className="public-affiliate__title">{t('Партнёрская программа')}</div>
            <p className="public-affiliate__subtitle">{t('Публичные условия для партнёров «Трейдинг Промпт»')}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="public-affiliate__close" aria-label={t('Закрыть страницу')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="m2 2 10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="public-affiliate__scroll scrollable">
        <main>
          {/* ── Hero ── */}
          <section className="pa-hero">
            <div className="pa-hero__corner-glow" />
            <div className="pa-hero__inner">
              <div className="pa-hero__backdrop" aria-hidden="true">
                <div className="pa-hero__center-glow" />
                <div className="pa-hero__vignette" />
                <svg className="pa-hero__waves" viewBox="0 0 1200 640" fill="none" preserveAspectRatio="xMidYMid slice">
                  {Array.from({ length: 14 }, (_, index) => (
                    <path
                      key={index}
                      d={heroWavePath(index)}
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="10 10"
                      opacity={0.13 + index * 0.012}
                      style={{ animationDelay: `${index * -0.45}s` }}
                    />
                  ))}
                </svg>
              </div>

              <div className="pa-hero__grid">
                <div className="pa-hero__copy">
                  <div className="pa-hero__badge">
                    <span className="pa-hero__badge-dot">
                      <span className="pa-hero__badge-pulse" />
                      <span className="pa-hero__badge-core" />
                    </span>
                    {t('Партнёрство без ожидания выплат')}
                  </div>
                  <h1 className="pa-hero__title">
                    {t('Получайте')} <span className="pa-hero__percent">{rewardPercent}%</span> {t('с каждого пополнения приглашённых Вами клиентов')}
                  </h1>
                  <p className="pa-hero__lead">
                    {t('Деньги приходят на ваш кошелёк')} <strong>{t('мгновенно')}</strong>
                    {t(', в момент пополнения реферала.')}
                  </p>
                  <div className="pa-hero__actions">
                    <button type="button" onClick={onSignUp} className="pa-hero__cta">
                      {t('Стать партнёром')}
                      <span className="pa-hero__cta-arrow">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>

                    <nav className="pa-hero__nav" aria-label={t('Навигация по партнёрской программе')}>
                      {[
                        { label: t('Как это работает'), ref: howItWorksRef },
                        { label: t('Преимущества'), ref: benefitsRef },
                        { label: t('Рассчитать доход'), ref: calculatorRef },
                      ].map(item => (
                        <button key={item.label} type="button" onClick={scrollTo(item.ref)} className="pa-hero__nav-link">
                          <span>{item.label}</span>
                          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M6 3h7v7M13 3 4 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>

                <div className="pa-terms">
                  <div className="pa-terms__rings" aria-hidden="true">
                    <div className="pa-terms__ring-inner" />
                    <div className="pa-terms__ring-core" />
                  </div>
                  <div className="pa-terms__label">{t('Условия программы')}</div>
                  <div className="pa-terms__percent">{rewardPercent}%</div>
                  <div className="pa-terms__caption">{t('ваша доля с каждого пополнения приглашённого клиента')}</div>
                  <div className="pa-terms__tiles">
                    {termTiles.map(tile => (
                      <div key={tile.label} className="pa-terms__tile">
                        <div className="pa-terms__tile-value">{tile.value}</div>
                        <div className="pa-terms__tile-label">{tile.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── How it works ── */}
          <section ref={howItWorksRef} className="pa-steps">
            <div className="pa-steps__inner">
              <div className="pa-steps__glow pa-steps__glow--left" aria-hidden="true" />
              <div className="pa-steps__glow pa-steps__glow--right" aria-hidden="true" />
              <div className="pa-steps__header">
                <div className="pa-pill">
                  <span className="pa-pill__line" />
                  {t('Простой старт')}
                  <span className="pa-pill__line" />
                </div>
                <h2 className="pa-section-title pa-section-title--upper">{t('Как это работает')}</h2>
                <p className="pa-steps__text">{t('От регистрации до первого вознаграждения — четыре понятных шага без заявок и ожидания.')}</p>
              </div>

              <div className="pa-ribbons">
                {steps.map((step, index) => (
                  <div key={step.title} className="pa-ribbon" style={{ zIndex: steps.length - index }}>
                    {index === steps.length - 1 && <div className="pa-ribbon__last-glow" aria-hidden="true" />}
                    <div className="pa-ribbon__shadow" aria-hidden="true" />
                    <div className="pa-ribbon__face">
                      <div className="pa-ribbon__glow" aria-hidden="true" />
                      <div className="pa-ribbon__dots" aria-hidden="true" />
                      <div className="pa-ribbon__top-line" aria-hidden="true" />
                      <div className="pa-ribbon__bottom-line" aria-hidden="true" />
                      <div className="pa-ribbon__corner" aria-hidden="true" />
                      <div className="pa-ribbon__marks" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className="pa-ribbon__chevron" aria-hidden="true" />

                      <div className="pa-ribbon__content">
                        <div className="pa-ribbon__number">{index + 1}</div>
                        <div className="pa-ribbon__body">
                          <div className="pa-ribbon__step">{t('Шаг {number}', { number: index + 1 })}</div>
                          <h3 className="pa-ribbon__title">{step.title}</h3>
                          <p className="pa-ribbon__text">{step.text}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Benefits ── */}
          <section ref={benefitsRef} className="pa-benefits">
            <div className="pa-benefits__glow" aria-hidden="true" />
            <div className="pa-benefits__line" aria-hidden="true" />

            <div className="pa-benefits__header">
              <div>
                <div className="pa-pill">
                  <span className="pa-pill__diamond" />
                  {t('Почему это выгодно')}
                </div>
                <h2 className="pa-section-title">{t('Преимущества программы')}</h2>
              </div>
              <div className="pa-benefits__count">
                <span className="pa-benefits__count-value">{BENEFITS.length}</span>
                <span className="pa-benefits__count-label">{t('причин начать')}</span>
              </div>
            </div>

            <div className="pa-benefits__carousel">
              {BENEFITS.map((benefit, index) => (
                <div key={benefit.title} className="pa-benefit">
                  <div className="pa-benefit__glow" aria-hidden="true" />
                  <div className="pa-benefit__underline" aria-hidden="true" />

                  <div className="pa-benefit__layout">
                    <div className="pa-benefit__copy">
                      <span className="pa-benefit__index">0{index + 1}</span>
                      <div className="pa-benefit__text-block">
                        <h3 className="pa-benefit__title">{t(benefit.title)}</h3>
                        <p className="pa-benefit__text">{t(benefit.text)}</p>
                      </div>
                      <div className="pa-benefit__included">
                        <span className="pa-benefit__check">
                          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {t('Включено')}
                      </div>
                    </div>

                    <div className="pa-benefit__visual" aria-hidden="true">
                      <div className="pa-benefit__pulse" />
                      <div className="pa-benefit__orbit">
                        <span />
                      </div>
                      <div className="pa-benefit__ring" />
                      <div className="pa-benefit__icon">
                        <svg width="40" height="40" viewBox="0 0 22 22" fill="none">
                          {BENEFIT_ICONS[index]}
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Income calculator ── */}
          <section ref={calculatorRef} className="pa-calculator">
            <div className="pa-calculator__shell">
              <div className="pa-calculator__pulse" aria-hidden="true" />
              <div className="pa-calculator__glow" aria-hidden="true" />
              <div className="pa-calculator__grid" aria-hidden="true" />
              <div className="pa-calculator__scan" aria-hidden="true" />

              <div className="pa-calculator__layout">
                <div>
                  <div className="pa-calculator__kicker">
                    <span />
                    {t('Калькулятор дохода')}
                  </div>
                  <h2 className="pa-calculator__title">
                    {t('Сколько вы можете')}
                    <br />
                    {t('зарабатывать?')}
                  </h2>
                  <p className="pa-calculator__text">
                    {t('Передвигайте ползунки — доход обновится автоматически. Ваша комиссия составляет {percent}% от пополнений.', {
                      percent: rewardPercent,
                    })}
                  </p>

                  <div className="pa-calculator__ranges" aria-label={t('Настройки расчёта')}>
                    {ranges.map(range => (
                      <div key={range.id}>
                        <div className="pa-range__header">
                          <label htmlFor={range.id}>{range.label}</label>
                          <output htmlFor={range.id}>{range.output}</output>
                        </div>
                        <input
                          id={range.id}
                          type="range"
                          min={range.min}
                          max={range.max}
                          step={1}
                          value={range.value}
                          onChange={event => range.onChange(Number(event.target.value))}
                          className="pa-range"
                        />
                        <div className="pa-range__scale">
                          <span>{range.scale[0]}</span>
                          <span>{range.scale[1]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pa-result">
                  <div className="pa-result__income" aria-live="polite">
                    <div className="pa-result__label">{t('Ваш потенциальный доход')}</div>
                    <div className="pa-result__row">
                      <div className="pa-result__value">${formatNumber(income, 2)}</div>
                      <div className="pa-result__note">{t('за пополнения')}</div>
                    </div>
                    <p className="pa-result__formula">
                      <strong>{t('{count} клиентов', { count: formatNumber(clients) })}</strong> × <strong>${formatNumber(averageDeposit)}</strong> ×{' '}
                      <strong>{t('{percent}% комиссии', { percent: rewardPercent })}</strong>
                    </p>
                  </div>

                  <div className="pa-result__example">
                    <div className="pa-result__example-icon">
                      <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path d="M6 4h8v8M14 4 4 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="pa-result__example-text">
                      <strong>{t('Каждое пополнение приносит вам {percent}%', { percent: rewardPercent })}</strong>
                      {t('Например, с пополнения ${deposit} ваша комиссия — ${commission}.', {
                        deposit: formatNumber(averageDeposit),
                        commission: formatNumber(averageDeposit * AFFILIATE_TERMS.rewardRate, 2),
                      })}
                    </div>
                  </div>
                  <p className="pa-result__disclaimer">
                    {t('Расчёт ориентировочный и не гарантирует доход. Фактический результат зависит от пополнений приглашённых клиентов.')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Call to action ── */}
          <section className="pa-cta">
            <div className="pa-cta__card">
              <div className="pa-cta__glow" />
              <div className="pa-cta__copy">
                <div className="pa-cta__kicker">{t('Готовы начать?')}</div>
                <h2 className="pa-cta__title">{t('Начните зарабатывать с первого пополнения')}</h2>
                <p className="pa-cta__text">{t('Зарегистрируйтесь и получите персональную партнёрскую ссылку.')}</p>
                <button type="button" onClick={onSignUp} className="pa-cta__button">
                  {t('Стать партнёром')}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" stroke="#B9AFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <img
                className="pa-cta__image"
                src={`${import.meta.env.BASE_URL}images/affiliate-partnership.png`}
                alt={t('Партнёры заключают соглашение на фоне элементов торговой аналитики')}
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="pa-cta__disclaimer">
              {t('«Трейдинг Промпт» не является инвестиционным советом. Сервис создаёт промпты и не гарантирует прибыль от торговли.')}
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
