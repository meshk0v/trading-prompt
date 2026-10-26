import { useMemo, useRef, useState } from 'react'
import { AFFILIATE_TERMS } from '../data/affiliate'


type PublicAffiliatePageProps = {
  onClose: () => void
  onSignUp: () => void
}

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" stroke="#B9AFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="m3 8 3 3 7-7" stroke="#8B7CFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function PublicAffiliatePage({ onClose, onSignUp }: PublicAffiliatePageProps) {
  const howItWorksRef = useRef<HTMLElement>(null)
  const benefitsRef = useRef<HTMLElement>(null)
  const calculatorRef = useRef<HTMLElement>(null)
  const [clients, setClients] = useState<number>(AFFILIATE_TERMS.defaultClients)
  const [averageDeposit, setAverageDeposit] = useState<number>(AFFILIATE_TERMS.defaultDeposit)

  const income = useMemo(
    () => clients * averageDeposit * AFFILIATE_TERMS.rewardRate,
    [clients, averageDeposit],
  )

  const stats = [
    { value: `${AFFILIATE_TERMS.rewardPercent}%`, label: 'с каждого пополнения' },
    { value: 'Мгновенно', label: 'выплата на кошелёк' },
    { value: `${AFFILIATE_TERMS.payoutCurrency} ${AFFILIATE_TERMS.payoutNetwork}`, label: 'валюта выплат' },
    { value: `${AFFILIATE_TERMS.payoutFeePercent}%`, label: 'комиссия за перевод' },
  ]

  const steps = [
    { title: 'Зарегистрируйтесь', text: 'Это занимает минуту, отдельной заявки не нужно' },
    { title: 'Укажите кошелёк', text: `Добавьте ${AFFILIATE_TERMS.payoutCurrency} ${AFFILIATE_TERMS.payoutNetwork} и скопируйте реферальную ссылку в кабинете` },
    { title: 'Приглашайте', text: 'Делитесь ссылкой с аудиторией, друзьями и подписчиками' },
    { title: 'Получайте', text: `${AFFILIATE_TERMS.rewardPercent}% от пополнения реферала приходят на ваш кошелёк сразу` },
  ]

  const benefits = [
    { title: 'Половина с каждого пополнения', text: 'Самая высокая доля, а не символический бонус' },
    { title: 'Деньги сразу', text: 'Никаких выплатных дней и ожидания' },
    { title: 'Доход с повторных пополнений', text: 'Реферал пополнил снова — вы получили снова' },
    { title: 'Напрямую на кошелёк', text: 'Без заявок и ручных выводов' },
    { title: 'Прозрачная статистика', text: 'Переходы, регистрации и начисления в кабинете' },
    { title: 'Поддержка', text: 'Отвечаем в Telegram @binum_support' },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="public-affiliate-header flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3 md:px-8 md:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-accent sm:size-10">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
              <circle cx="15" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
              <circle cx="10" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="m7.2 7.3 1.6 5M12.8 7.3l-1.6 5M7.5 6h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="truncate font-['Outfit'] text-base font-bold leading-tight sm:text-xl">Партнёрская программа</div>
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-[#777] sm:truncate sm:text-xs">Публичные условия для партнёров «Трейдинг Промпт»</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="grid size-8 shrink-0 place-items-center rounded-md border border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[#333] hover:bg-[var(--surface)] hover:text-[var(--text)] sm:size-9"
          aria-label="Закрыть страницу"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="m2 2 10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="scrollable flex-1 overflow-y-auto">
        <main>
          <section className="relative overflow-hidden border-b border-[var(--border)]">
            <div className="pointer-events-none absolute -right-28 -top-40 size-[420px] rounded-full bg-accent/8 blur-3xl" />
            <div className="public-affiliate-hero relative flex min-h-[560px] w-full items-center justify-center overflow-hidden px-5 py-10 md:min-h-[640px] md:px-8 md:py-24">
              <style>{`
                @keyframes affiliateHeroCopyIn {
                  from { opacity: 0; transform: translate3d(0, 22px, 0); }
                  to { opacity: 1; transform: translate3d(0, 0, 0); }
                }
                @keyframes affiliateHeroItemIn {
                  from { opacity: 0; transform: translateY(12px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                @keyframes affiliateHeroPulse {
                  0%, 100% { opacity: .45; transform: scale(.82); }
                  50% { opacity: 1; transform: scale(1.18); }
                }
                @keyframes affiliateHeroWave {
                  0%, 100% { transform: translate3d(-1.5%, 0, 0); }
                  50% { transform: translate3d(1.5%, -2%, 0); }
                }
                @keyframes affiliateHeroFlow {
                  from { stroke-dashoffset: 0; }
                  to { stroke-dashoffset: -160; }
                }
                .affiliate-hero-copy { animation: affiliateHeroCopyIn .7s cubic-bezier(.2,.8,.2,1) both; }
                .affiliate-hero-metrics > * { animation: affiliateHeroItemIn .55s cubic-bezier(.2,.8,.2,1) both; }
                .affiliate-hero-metrics > *:nth-child(1) { animation-delay: .24s; }
                .affiliate-hero-metrics > *:nth-child(2) { animation-delay: .32s; }
                .affiliate-hero-metrics > *:nth-child(3) { animation-delay: .4s; }
                .affiliate-hero-pulse { animation: affiliateHeroPulse 1.7s ease-in-out infinite; }
                .affiliate-hero-wave { animation: affiliateHeroWave 12s ease-in-out infinite; transform-origin: center; }
                .affiliate-hero-wave path { animation: affiliateHeroFlow 10s linear infinite; }
                @media (prefers-reduced-motion: reduce) {
                  .affiliate-hero-copy, .affiliate-hero-metrics > *, .affiliate-hero-pulse, .affiliate-hero-wave, .affiliate-hero-wave path {
                    animation: none !important;
                  }
                }
              `}</style>

              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.035] blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,10,10,.08)_0%,rgba(10,10,10,.34)_48%,rgba(10,10,10,.88)_100%)]" />
                <svg
                  className="affiliate-hero-wave absolute -inset-x-[12%] inset-y-0 h-full w-[124%] text-accent"
                  viewBox="0 0 1200 640"
                  fill="none"
                  preserveAspectRatio="xMidYMid slice"
                >
                  {Array.from({ length: 14 }, (_, index) => {
                    const offset = index - 6.5
                    const path = [
                      `M-100 ${560 + offset * 16}`,
                      `C20 ${590 + offset * 14} 110 ${548 + offset * 4} 190 ${505 + offset * 0.35}`,
                      `C315 ${415 + offset * 15} 430 ${165 + offset * 18} 650 ${286 + offset * 0.7}`,
                      `C770 ${352 + offset * 15} 910 ${470 + offset * 19} 1040 ${272 + offset * 0.25}`,
                      `C1115 ${158 + offset * 9} 1185 ${28 + offset * 14} 1300 ${-34 + offset * 17}`,
                    ].join('')

                    return (
                      <path
                        key={index}
                        d={path}
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="10 10"
                        opacity={0.13 + index * 0.012}
                        style={{ animationDelay: `${index * -0.45}s` }}
                      />
                    )
                  })}
                </svg>
              </div>

              <div className="affiliate-hero-copy relative z-[1] grid w-full max-w-6xl items-center gap-14 font-['Inter'] lg:grid-cols-[1.12fr_.88fr]">
                <div className="flex flex-col items-start text-left md:items-center md:text-center lg:items-start lg:text-left">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-[linear-gradient(90deg,rgba(139,124,255,.12),rgba(139,124,255,.035))] px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.13em] text-accent shadow-[inset_0_1px_0_rgba(255,255,255,.035)] md:mb-6 md:px-3.5 md:py-2 md:text-[9px] md:tracking-[0.15em]">
                  <span className="relative flex size-2 items-center justify-center">
                    <span className="affiliate-hero-pulse absolute size-2 rounded-full bg-accent/35" />
                    <span className="relative size-1.5 rounded-full bg-accent" />
                  </span>
                  Партнёрство без ожидания выплат
                </div>
                <h1 className="max-w-3xl font-['Inter'] text-[40px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[44px] md:text-[52px] md:font-bold md:leading-[1.08] md:tracking-[-0.035em]">
                  Получайте{' '}
                  <span className="relative inline-block bg-gradient-to-br from-[#D9D2FF] via-accent to-[#6FCFF5] bg-clip-text text-transparent">
                    {AFFILIATE_TERMS.rewardPercent}%
                  </span>{' '}
                  с каждого пополнения приглашённых Вами клиентов
                </h1>
                <p className="mt-6 max-w-xl text-sm leading-6 text-[#B8B4D0] md:max-w-2xl md:text-base">
                  Деньги приходят на ваш кошелёк <strong className="font-semibold text-[#CFCDE3]">мгновенно</strong>, в момент пополнения реферала.
                </p>
                  <div className="affiliate-hero-actions mt-8 flex w-full max-w-xl flex-col md:mt-9 md:items-center lg:items-start">
                  <button type="button" onClick={onSignUp} className="group inline-flex h-12 w-full shrink-0 items-center justify-center gap-3 rounded-none border border-accent bg-accent px-5 font-['Inter'] text-sm font-bold text-[var(--on-accent)] shadow-[0_14px_38px_rgba(139,124,255,.18)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] md:h-11 md:w-auto md:min-w-48 md:rounded-md md:px-6 md:text-[13px]">
                    Стать партнёром
                    <span className="transition-transform group-hover:translate-x-0.5">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </button>

                    <nav className="mt-4 w-full border-y border-white/10 md:mt-5" aria-label="Навигация по партнёрской программе">
                    {[
                      { label: 'Как это работает', action: () => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
                      { label: 'Преимущества', action: () => benefitsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
                      { label: 'Рассчитать доход', action: () => calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
                    ].map(item => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.action}
                        className="group flex h-11 w-full items-center justify-between border-0 border-b border-white/10 bg-transparent px-1 text-left font-['Inter'] text-xs font-medium text-[#D9D6E8] transition-colors last:border-b-0 hover:text-white md:px-3 md:text-[13px]"
                      >
                        <span>{item.label}</span>
                        <svg className="shrink-0 text-accent transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M6 3h7v7M13 3 4 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ))}
                    </nav>
                  </div>
                </div>

                <div className="relative hidden min-h-[430px] overflow-hidden rounded-3xl border border-accent/20 bg-[radial-gradient(circle_at_70%_20%,rgba(139,124,255,.2),transparent_42%),linear-gradient(145deg,rgba(25,25,38,.94),rgba(8,8,14,.9))] p-7 shadow-[0_40px_100px_rgba(0,0,0,.38),inset_0_1px_0_rgba(255,255,255,.04)] lg:flex lg:flex-col">
                  <div className="pointer-events-none absolute -right-24 -top-20 size-64 rounded-full border border-accent/15" aria-hidden="true">
                    <div className="absolute inset-8 rounded-full border border-accent/10" />
                    <div className="absolute inset-20 rounded-full bg-accent/[0.06]" />
                  </div>
                  <div className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Условия программы</div>
                  <div className="relative mt-5 font-['JetBrains_Mono'] text-8xl font-black leading-none tracking-[-0.09em] text-accent drop-shadow-[0_0_32px_rgba(139,124,255,.18)]">
                    {AFFILIATE_TERMS.rewardPercent}%
                  </div>
                  <div className="relative mt-2 max-w-xs text-sm leading-6 text-[#B8B4D0]">ваша доля с каждого пополнения приглашённого клиента</div>

                  <div className="relative mt-auto grid grid-cols-2 border-l border-t border-white/10">
                    {stats.slice(1).map(stat => (
                      <div key={stat.label} className="min-h-24 border-b border-r border-white/10 p-4">
                        <div className="font-['Inter'] text-base font-bold text-white">{stat.value}</div>
                        <div className="mt-1.5 text-[10px] uppercase leading-4 tracking-[0.08em] text-[#77738A]">{stat.label}</div>
                      </div>
                    ))}
                    <div className="min-h-24 border-b border-r border-white/10 p-4">
                      <div className="font-['Inter'] text-base font-bold text-white">Повторно</div>
                      <div className="mt-1.5 text-[10px] uppercase leading-4 tracking-[0.08em] text-[#77738A]">доход с новых пополнений</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section ref={howItWorksRef} className="scroll-mt-4 border-y border-[var(--border)] bg-[var(--card)]/40">
            <div className="public-affiliate-steps relative mx-auto max-w-6xl overflow-hidden px-4 py-10 md:px-8 md:py-16">
              <style>{`
                @keyframes affiliateRibbonStepIn {
                  from { opacity: 0; transform: translate3d(0, 34px, 0) scale(.97); }
                  to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
                }
                @keyframes affiliateStepHeaderIn {
                  from { opacity: 0; transform: translateY(-16px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                @keyframes affiliateRibbonGlow {
                  0%, 100% { opacity: .32; transform: translate3d(-2%, 0, 0) scale(.94); }
                  50% { opacity: .68; transform: translate3d(2%, -3%, 0) scale(1.06); }
                }
                @keyframes affiliateRibbonNumber {
                  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,.05), 0 12px 28px rgba(0,0,0,.28); }
                  50% { box-shadow: 0 0 0 7px rgba(139,124,255,.08), 0 16px 34px rgba(0,0,0,.34); }
                }
                .affiliate-steps-header { animation: affiliateStepHeaderIn .65s .12s cubic-bezier(.2,.8,.2,1) both; }
                .affiliate-ribbon-step { animation: affiliateRibbonStepIn .7s cubic-bezier(.2,.8,.2,1) both; }
                .affiliate-ribbon-step:nth-child(1) { animation-delay: .2s; }
                .affiliate-ribbon-step:nth-child(2) { animation-delay: .32s; }
                .affiliate-ribbon-step:nth-child(3) { animation-delay: .44s; }
                .affiliate-ribbon-step:nth-child(4) { animation-delay: .56s; }
                .affiliate-ribbon-step:nth-child(1) .affiliate-ribbon-face {
                  background: linear-gradient(145deg, #164C59 0%, #24375B 45%, #241A50 100%);
                }
                .affiliate-ribbon-step:nth-child(2) .affiliate-ribbon-face {
                  background: linear-gradient(145deg, #5A2E52 0%, #392553 48%, #211943 100%);
                }
                .affiliate-ribbon-step:nth-child(3) .affiliate-ribbon-face {
                  background: linear-gradient(145deg, #243D68 0%, #252854 50%, #17163B 100%);
                }
                .affiliate-ribbon-step:nth-child(4) .affiliate-ribbon-face {
                  background: linear-gradient(145deg, #18181D 0%, #0B0B10 48%, #020204 100%);
                }
                .affiliate-ribbon-step:nth-child(1) .affiliate-ribbon-glow {
                  background: rgba(76,201,240,.22);
                }
                .affiliate-ribbon-step:nth-child(2) .affiliate-ribbon-glow {
                  background: rgba(255,138,107,.2);
                }
                .affiliate-ribbon-step:nth-child(3) .affiliate-ribbon-glow {
                  background: rgba(139,124,255,.22);
                }
                .affiliate-ribbon-step:nth-child(4) .affiliate-ribbon-glow {
                  background: rgba(255,255,255,.08);
                }
                .affiliate-ribbon-step:nth-child(even) .affiliate-ribbon-glow { animation-delay: -2.4s; }
                .affiliate-ribbon-glow { animation: affiliateRibbonGlow 5.5s ease-in-out infinite; }
                .affiliate-ribbon-number { animation: affiliateRibbonNumber 4s ease-in-out infinite; }
                .affiliate-ribbon-step:nth-child(2) .affiliate-ribbon-number { animation-delay: -1s; }
                .affiliate-ribbon-step:nth-child(3) .affiliate-ribbon-number { animation-delay: -2s; }
                .affiliate-ribbon-step:nth-child(4) .affiliate-ribbon-number { animation-delay: -3s; }
                @media (prefers-reduced-motion: reduce) {
                  .affiliate-steps-header, .affiliate-ribbon-step, .affiliate-ribbon-glow, .affiliate-ribbon-number {
                    animation: none !important;
                  }
                }
              `}</style>

              <div className="pointer-events-none absolute -left-24 top-12 size-64 rounded-full bg-accent/[0.035] blur-3xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-28 bottom-20 size-72 rounded-full bg-accent/[0.04] blur-3xl" aria-hidden="true" />
              <div className="affiliate-steps-header relative mx-auto mb-8 max-w-2xl text-center md:mb-12">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-accent">
                  <span className="h-px w-4 bg-accent/70" />
                  Простой старт
                  <span className="h-px w-4 bg-accent/70" />
                </div>
                <h2 className="mt-3 font-['Outfit'] text-2xl font-bold uppercase tracking-[-0.02em] md:mt-4 md:text-4xl">Как это работает</h2>
                <p className="mx-auto mt-3 max-w-lg text-xs leading-5 text-[var(--muted)]">
                  От регистрации до первого вознаграждения — четыре понятных шага без заявок и ожидания.
                </p>
              </div>

              <div className="relative mx-auto max-w-2xl pb-5 md:pb-8">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className={`affiliate-ribbon-step relative ${index > 0 ? '-mt-5 md:-mt-7' : ''} ${index === 3 ? '[filter:drop-shadow(0_18px_22px_rgba(139,124,255,.2))]' : ''}`}
                    style={{ zIndex: steps.length - index }}
                  >
                    {index === 3 && (
                      <div
                        className="pointer-events-none absolute -inset-x-3 bottom-[-18px] h-28 bg-[radial-gradient(ellipse_at_center,rgba(139,124,255,.32),rgba(255,138,107,.1)_42%,transparent_72%)] blur-xl md:-inset-x-8 md:bottom-[-24px] md:h-36"
                        aria-hidden="true"
                      />
                    )}
                    <div
                      className="pointer-events-none absolute inset-x-2 top-3 bottom-[-8px] bg-black/55 opacity-80 blur-[1px] [clip-path:polygon(0_0,100%_0,100%_calc(100%_-_30px),50%_100%,0_calc(100%_-_30px))] md:inset-x-3 md:bottom-[-11px] md:[clip-path:polygon(0_0,100%_0,100%_calc(100%_-_42px),50%_100%,0_calc(100%_-_42px))]"
                      aria-hidden="true"
                    />
                    <div className="affiliate-ribbon-face group relative min-h-[142px] overflow-hidden px-5 pb-11 pt-5 [clip-path:polygon(0_0,100%_0,100%_calc(100%_-_30px),50%_100%,0_calc(100%_-_30px))] md:min-h-[178px] md:px-10 md:pb-16 md:pt-8 md:[clip-path:polygon(0_0,100%_0,100%_calc(100%_-_42px),50%_100%,0_calc(100%_-_42px))]">
                      <div className="affiliate-ribbon-glow pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-accent/20 blur-3xl md:size-64" aria-hidden="true" />
                      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle,rgba(255,255,255,.15)_1px,transparent_1px)] [background-size:20px_20px]" aria-hidden="true" />
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D9D2FF]/55 to-transparent" aria-hidden="true" />
                      <div className="pointer-events-none absolute bottom-7 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/25 to-transparent md:bottom-10" aria-hidden="true" />
                      <div className="pointer-events-none absolute left-3 top-3 size-5 border-l border-t border-white/30 md:left-5 md:top-5 md:size-7" aria-hidden="true" />
                      <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 md:right-5 md:top-5" aria-hidden="true">
                        <span className="size-1 rounded-full bg-white/65" />
                        <span className="size-1 rounded-full bg-white/35" />
                        <span className="h-px w-5 bg-white/25 md:w-8" />
                      </div>
                      <div className="pointer-events-none absolute bottom-9 right-[12%] size-6 rotate-45 border-b border-r border-white/15 md:bottom-12 md:size-8" aria-hidden="true" />

                      <div className="relative z-10 flex items-center gap-4 md:gap-7">
                        <div className="affiliate-ribbon-number grid size-12 shrink-0 place-items-center rounded-full border border-white/70 bg-[linear-gradient(145deg,#FFFFFF,#D9D2FF)] font-['JetBrains_Mono'] text-xl font-black text-[#171333] md:size-16 md:text-2xl">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="mb-1.5 font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-[0.18em] text-accent/75 md:text-[10px]">
                            Шаг {index + 1}
                          </div>
                          <h3 className="font-['Outfit'] text-base font-extrabold uppercase tracking-[0.035em] text-white md:text-xl">
                            {step.title}
                          </h3>
                          <p className="mt-1.5 max-w-lg text-[11px] leading-4 text-[#B8B4D0] md:mt-2 md:text-sm md:leading-5">
                            {step.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section ref={benefitsRef} className="public-affiliate-benefits relative mx-auto max-w-6xl scroll-mt-4 overflow-hidden px-4 py-10 md:px-8 md:py-16">
            <style>{`
              @keyframes affiliateBenefitHeaderIn {
                from { opacity: 0; transform: translate3d(-20px, 0, 0); }
                to { opacity: 1; transform: translate3d(0, 0, 0); }
              }
              @keyframes affiliateBenefitIn {
                from { opacity: 0; transform: translate3d(0, 24px, 0) scale(.97); }
                to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
              }
              @keyframes affiliateBenefitGlow {
                0%, 100% { opacity: .35; transform: scale(.9); }
                50% { opacity: .7; transform: scale(1.08); }
              }
              @keyframes affiliateBenefitIconFloat {
                0%, 100% { transform: translate3d(0, 3px, 0) rotate(-2deg); }
                50% { transform: translate3d(0, -7px, 0) rotate(2deg); }
              }
              @keyframes affiliateBenefitIconOrbit {
                to { transform: rotate(360deg); }
              }
              @keyframes affiliateBenefitIconPulse {
                0%, 100% { opacity: .4; transform: scale(.9); }
                50% { opacity: .9; transform: scale(1.08); }
              }
              .affiliate-benefits-header { animation: affiliateBenefitHeaderIn .65s .14s cubic-bezier(.2,.8,.2,1) both; }
              .affiliate-benefit-card { animation: affiliateBenefitIn .65s cubic-bezier(.2,.8,.2,1) both; }
              .affiliate-benefit-card:nth-child(1) { animation-delay: .28s; }
              .affiliate-benefit-card:nth-child(2) { animation-delay: .36s; }
              .affiliate-benefit-card:nth-child(3) { animation-delay: .44s; }
              .affiliate-benefit-card:nth-child(4) { animation-delay: .52s; }
              .affiliate-benefit-card:nth-child(5) { animation-delay: .6s; }
              .affiliate-benefit-card:nth-child(6) { animation-delay: .68s; }
              .affiliate-benefit-glow { animation: affiliateBenefitGlow 4.5s ease-in-out infinite; }
              .affiliate-benefit-icon { animation: affiliateBenefitIconFloat 4.8s ease-in-out infinite; }
              .affiliate-benefit-card:nth-child(even) .affiliate-benefit-icon { animation-delay: -2.4s; }
              .affiliate-benefit-icon-orbit { animation: affiliateBenefitIconOrbit 12s linear infinite; }
              .affiliate-benefit-card:nth-child(even) .affiliate-benefit-icon-orbit { animation-direction: reverse; animation-duration: 15s; }
              .affiliate-benefit-icon-pulse { animation: affiliateBenefitIconPulse 3.6s ease-in-out infinite; }
              .affiliate-benefits-carousel {
                scrollbar-width: none;
                -ms-overflow-style: none;
                scroll-padding-inline: 16px;
              }
              .affiliate-benefits-carousel::-webkit-scrollbar { display: none; }
              @media (min-width: 768px) {
                .affiliate-benefits-carousel { scroll-padding-inline: 32px; }
              }
              @media (prefers-reduced-motion: reduce) {
                .affiliate-benefits-header, .affiliate-benefit-card, .affiliate-benefit-glow, .affiliate-benefit-icon, .affiliate-benefit-icon-orbit, .affiliate-benefit-icon-pulse {
                  animation: none !important;
                }
              }
            `}</style>

            <div className="affiliate-benefit-glow pointer-events-none absolute -right-32 top-6 size-80 rounded-full bg-accent/[0.035] blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute left-8 right-8 top-[47%] hidden h-px bg-gradient-to-r from-transparent via-accent/[0.07] to-transparent lg:block" aria-hidden="true" />

            <div className="affiliate-benefits-header relative mb-6 flex flex-col justify-between gap-4 md:mb-10 md:flex-row md:items-end md:gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-accent">
                  <span className="size-1.5 rotate-45 border border-accent/70" />
                  Почему это выгодно
                </div>
                <h2 className="mt-3 font-['Outfit'] text-2xl font-bold tracking-[-0.02em] md:mt-4 md:text-4xl">Преимущества программы</h2>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-[#2E2E46] bg-[#121212] px-4 py-3">
                <span className="font-['JetBrains_Mono'] text-2xl font-bold text-accent">{benefits.length}</span>
                <span className="max-w-24 text-[10px] font-semibold uppercase leading-4 tracking-[0.1em] text-[#666]">причин начать</span>
              </div>
            </div>

            <div className="affiliate-benefits-carousel relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-5 md:-mx-8 md:gap-4 md:px-8">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.title}
                  className="affiliate-benefit-card group relative min-h-52 w-[84vw] max-w-[330px] shrink-0 snap-center overflow-hidden rounded-lg border border-[#2E2E46] bg-[linear-gradient(150deg,#181818_0%,#12121C_100%)] p-4 shadow-[0_18px_50px_rgba(0,0,0,.18)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_26px_70px_rgba(0,0,0,.3)] md:min-h-56 md:w-[360px] md:max-w-none md:rounded-xl md:p-5"
                >
                  <div className="pointer-events-none absolute -right-16 -top-20 size-40 rounded-full bg-accent/[0.055] blur-3xl opacity-50 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
                  <div className="pointer-events-none absolute inset-x-5 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-accent/80 via-accent/20 to-transparent transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />

                  <div className="relative flex h-full items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 self-stretch flex-col">
                      <span className="font-['JetBrains_Mono'] text-[9px] font-bold tracking-[0.16em] text-[#444]">0{index + 1}</span>
                      <div className="mt-5">
                        <h3 className="font-['Outfit'] text-[15px] font-bold leading-5 text-[#EDEBFA]">{benefit.title}</h3>
                        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{benefit.text}</p>
                      </div>
                      <div className="mt-auto flex items-center gap-2 pt-5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#4D4D4D]">
                        <span className="grid size-4 place-items-center rounded-full border border-accent/20 bg-accent/[0.06] text-accent">
                          <CheckIcon />
                        </span>
                        Включено
                      </div>
                    </div>

                    <div className="affiliate-benefit-icon relative grid size-16 shrink-0 place-items-center text-accent md:size-24" aria-hidden="true">
                      <div className="affiliate-benefit-icon-pulse absolute inset-2 rounded-full bg-accent/[0.08] blur-xl" />
                      <div className="affiliate-benefit-icon-orbit absolute inset-0 rounded-full border border-dashed border-accent/20">
                        <span className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_10px_rgba(139,124,255,.65)]" />
                      </div>
                      <div className="absolute inset-3 rounded-full border border-accent/10" />
                      <div className="relative grid size-16 place-items-center rounded-2xl border border-accent/25 bg-[linear-gradient(145deg,rgba(139,124,255,.16),rgba(139,124,255,.035))] shadow-[inset_0_1px_0_rgba(255,255,255,.045),0_14px_35px_rgba(0,0,0,.26)] transition-transform duration-300 group-hover:scale-110">
                        {index === 0 && (
                          <svg width="40" height="40" viewBox="0 0 22 22" fill="none">
                            <circle cx="6.5" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.25"/>
                            <circle cx="15.5" cy="15.5" r="3" stroke="currentColor" strokeWidth="1.25"/>
                            <path d="m5 17 12-12" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
                          </svg>
                        )}
                        {index === 1 && (
                          <svg width="40" height="40" viewBox="0 0 22 22" fill="none">
                            <path d="m12.5 2-7 9h5L9.5 20l7-9h-5l1-9Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {index === 2 && (
                          <svg width="40" height="40" viewBox="0 0 22 22" fill="none">
                            <path d="M18.5 8A8 8 0 0 0 4 6M3.5 3.5V7H7M3.5 14A8 8 0 0 0 18 16m.5 2.5V15H15" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {index === 3 && (
                          <svg width="40" height="40" viewBox="0 0 22 22" fill="none">
                            <rect x="2.5" y="5" width="17" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.25"/>
                            <path d="M2.5 9h17" stroke="currentColor" strokeWidth="1.25"/>
                            <path d="M15 13h2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                          </svg>
                        )}
                        {index === 4 && (
                          <svg width="40" height="40" viewBox="0 0 22 22" fill="none">
                            <path d="M3 18V9m5 9V4m5 14v-6m5 6V7M2 18.5h18" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                          </svg>
                        )}
                        {index === 5 && (
                          <svg width="40" height="40" viewBox="0 0 22 22" fill="none">
                            <path d="M4 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 3v-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
                            <path d="M7 9h8M7 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section ref={calculatorRef} className="public-affiliate-calculator relative mx-auto max-w-6xl scroll-mt-4 overflow-hidden px-3 py-6 md:px-8 md:py-16">
            <style>{`
              @keyframes affiliateCalculatorIn {
                from { opacity: 0; transform: translate3d(0, 28px, 0) scale(.98); }
                to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
              }
              @keyframes affiliateCalculatorCopyIn {
                from { opacity: 0; transform: translateX(-24px); }
                to { opacity: 1; transform: translateX(0); }
              }
              @keyframes affiliateCalculatorPanelIn {
                from { opacity: 0; transform: translateX(26px); }
                to { opacity: 1; transform: translateX(0); }
              }
              @keyframes affiliateCalculatorPulse {
                0%, 100% { opacity: .35; transform: scale(.92); }
                50% { opacity: .8; transform: scale(1.08); }
              }
              @keyframes affiliateCalculatorScan {
                from { transform: translateX(-120%); }
                to { transform: translateX(220%); }
              }
              .affiliate-calculator-shell { animation: affiliateCalculatorIn .75s .12s cubic-bezier(.2,.8,.2,1) both; }
              .affiliate-calculator-copy { animation: affiliateCalculatorCopyIn .7s .26s cubic-bezier(.2,.8,.2,1) both; }
              .affiliate-calculator-panel { animation: affiliateCalculatorPanelIn .7s .36s cubic-bezier(.2,.8,.2,1) both; }
              .affiliate-calculator-pulse { animation: affiliateCalculatorPulse 4s ease-in-out infinite; }
              .affiliate-calculator-scan { animation: affiliateCalculatorScan 4.5s 1.1s ease-in-out infinite; }
              @media (prefers-reduced-motion: reduce) {
                .affiliate-calculator-shell, .affiliate-calculator-copy, .affiliate-calculator-panel, .affiliate-calculator-pulse, .affiliate-calculator-scan {
                  animation: none !important;
                }
              }
            `}</style>

            <div className="affiliate-calculator-shell relative overflow-hidden rounded-xl border border-[var(--coral-border)] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(139,124,255,.22),transparent_70%),radial-gradient(45%_55%_at_100%_100%,rgba(255,138,107,.10),transparent_70%),linear-gradient(135deg,#12121C_0%,#0B0B12_100%)] shadow-[0_32px_100px_rgba(0,0,0,.38)] md:rounded-2xl">
              <div className="affiliate-calculator-pulse pointer-events-none absolute -left-28 -top-36 size-96 rounded-full bg-accent/[0.075] blur-3xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-48 right-0 size-[420px] rounded-full bg-accent/[0.035] blur-3xl" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" style={{ backgroundImage: 'linear-gradient(rgba(139,124,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,124,255,.04) 1px, transparent 1px)', backgroundSize: '38px 38px', maskImage: 'linear-gradient(110deg, black, transparent 68%)' }} />
              <div className="affiliate-calculator-scan pointer-events-none absolute inset-y-0 left-0 w-32 -skew-x-12 bg-gradient-to-r from-transparent via-accent/[0.035] to-transparent" aria-hidden="true" />

              <div className="affiliate-calculator-layout relative mx-auto w-full max-w-[420px] px-4 py-7 font-['Inter'] md:px-2 md:py-10 lg:grid lg:max-w-5xl lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16 lg:px-10 lg:py-14">
                <style>{`
                  .affiliate-minimal-range {
                    appearance: none;
                    -webkit-appearance: none;
                    height: 5px;
                    border-radius: 999px;
                    outline: none;
                    cursor: pointer;
                  }
                  .affiliate-minimal-range::-webkit-slider-thumb {
                    appearance: none;
                    -webkit-appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 999px;
                    background: #fff;
                    border: 5px solid #9A7CFF;
                    box-shadow: 0 0 0 4px rgba(154,124,255,.13), 0 2px 8px rgba(0,0,0,.55);
                  }
                  .affiliate-minimal-range::-moz-range-thumb {
                    width: 10px;
                    height: 10px;
                    border-radius: 999px;
                    background: #fff;
                    border: 5px solid #9A7CFF;
                    box-shadow: 0 0 0 4px rgba(154,124,255,.13), 0 2px 8px rgba(0,0,0,.55);
                  }
                `}</style>

                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#B5A5FF]">
                    <span className="size-1.5 rounded-full bg-[#9A7CFF] shadow-[0_0_12px_#9A7CFF]" />
                    Калькулятор дохода
                  </div>
                  <h2 className="mt-4 text-[28px] font-bold leading-[1.08] tracking-[-0.035em] text-[#F0EDF8] md:text-[32px] lg:text-[42px]">
                    Сколько вы можете<br />зарабатывать?
                  </h2>
                  <p className="mt-2 max-w-[380px] text-[13px] leading-5 text-[#9290A2] lg:mt-4">
                    Передвигайте ползунки — доход обновится автоматически. Ваша комиссия составляет {AFFILIATE_TERMS.rewardPercent}% от пополнений.
                  </p>

                  <div className="mt-8 grid gap-7 lg:mt-10" aria-label="Настройки расчёта">
                    <div>
                      <div className="mb-3 flex items-baseline justify-between gap-3">
                        <label htmlFor="affiliate-clients-range" className="text-[13px] font-semibold text-[#D2CEDD]">Приглашённые клиенты</label>
                        <output htmlFor="affiliate-clients-range" className="text-xl font-bold tracking-[-0.025em] text-white">{clients.toLocaleString('en-US')}</output>
                      </div>
                      <input
                        id="affiliate-clients-range"
                        type="range"
                        min={AFFILIATE_TERMS.minClients}
                        max={AFFILIATE_TERMS.maxClients}
                        step={1}
                        value={clients}
                        onChange={event => setClients(Number(event.target.value))}
                        className="affiliate-minimal-range block w-full"
                        style={{ background: `linear-gradient(to right, #9A7CFF 0%, #7654F6 ${((clients - AFFILIATE_TERMS.minClients) / (AFFILIATE_TERMS.maxClients - AFFILIATE_TERMS.minClients)) * 100}%, #302B3C ${((clients - AFFILIATE_TERMS.minClients) / (AFFILIATE_TERMS.maxClients - AFFILIATE_TERMS.minClients)) * 100}%, #302B3C 100%)` }}
                      />
                      <div className="mt-2.5 flex justify-between text-[10px] text-[#696678]">
                        <span>{AFFILIATE_TERMS.minClients} клиент</span>
                        <span>{AFFILIATE_TERMS.maxClients} клиентов</span>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-baseline justify-between gap-3">
                        <label htmlFor="affiliate-deposit-range" className="text-[13px] font-semibold text-[#D2CEDD]">Среднее пополнение</label>
                        <output htmlFor="affiliate-deposit-range" className="text-xl font-bold tracking-[-0.025em] text-white">${averageDeposit.toLocaleString('en-US')}</output>
                      </div>
                      <input
                        id="affiliate-deposit-range"
                        type="range"
                        min={AFFILIATE_TERMS.minDeposit}
                        max={1000}
                        step={1}
                        value={averageDeposit}
                        onChange={event => setAverageDeposit(Number(event.target.value))}
                        className="affiliate-minimal-range block w-full"
                        style={{ background: `linear-gradient(to right, #9A7CFF 0%, #7654F6 ${((averageDeposit - AFFILIATE_TERMS.minDeposit) / (1000 - AFFILIATE_TERMS.minDeposit)) * 100}%, #302B3C ${((averageDeposit - AFFILIATE_TERMS.minDeposit) / (1000 - AFFILIATE_TERMS.minDeposit)) * 100}%, #302B3C 100%)` }}
                      />
                      <div className="mt-2.5 flex justify-between text-[10px] text-[#696678]">
                        <span>${AFFILIATE_TERMS.minDeposit}</span>
                        <span>$1,000</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-9 lg:mt-0 lg:rounded-2xl lg:border lg:border-accent/15 lg:bg-black/20 lg:p-8 lg:shadow-[inset_0_1px_0_rgba(255,255,255,.03)]">
                  <div className="border-t border-[#292634] pt-5 lg:border-t-0 lg:pt-0" aria-live="polite">
                    <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#A99AFF]">Ваш потенциальный доход</div>
                    <div className="mt-2 flex items-end justify-between gap-3 lg:block">
                      <div className="text-[46px] font-extrabold leading-none tracking-[-0.055em] text-[#A38AFF] drop-shadow-[0_0_32px_rgba(139,105,255,.13)] md:text-[58px] lg:mt-4 lg:text-[64px]">
                        ${income.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </div>
                      <div className="pb-1 text-xs whitespace-nowrap text-[#8F8A9F] lg:mt-2">за пополнения</div>
                    </div>
                    <p className="mt-4 text-xs leading-[1.5] text-[#858093]">
                      <strong className="font-semibold text-[#E5DFFF]">{clients.toLocaleString('en-US')} клиентов</strong>
                      {' '}× <strong className="font-semibold text-[#E5DFFF]">${averageDeposit.toLocaleString('en-US')}</strong>
                      {' '}× <strong className="font-semibold text-[#E5DFFF]">{AFFILIATE_TERMS.rewardPercent}% комиссии</strong>
                    </p>
                  </div>

                  <div className="mt-5 flex items-center gap-2.5 border-y border-[#292634] py-3.5 lg:mt-7">
                    <div className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#211A35] text-[#B5A3FF]">
                      <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path d="M6 4h8v8M14 4 4 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="text-[11px] leading-4 text-[#8F8A9F]">
                      <strong className="mb-0.5 block text-xs font-semibold text-[#E7E1F5]">Каждое пополнение приносит вам {AFFILIATE_TERMS.rewardPercent}%</strong>
                      Например, с пополнения ${averageDeposit.toLocaleString('en-US')} ваша комиссия — ${(averageDeposit * AFFILIATE_TERMS.rewardRate).toLocaleString('en-US', { maximumFractionDigits: 2 })}.
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] leading-[1.5] text-[#686577]">
                    Расчёт ориентировочный и не гарантирует доход. Фактический результат зависит от пополнений приглашённых клиентов.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="public-affiliate-cta mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
            <div className="affiliate-cta-card relative grid overflow-hidden rounded-xl border border-[#342800] bg-[linear-gradient(135deg,#181400,#12121C_65%)] p-4 md:p-8 lg:grid-cols-[1fr_0.72fr] lg:items-center lg:gap-10">
              <style>{`
                @keyframes affiliateCtaIllustrationIn {
                  from { opacity: 0; transform: translate3d(28px, 18px, 0) scale(.96); }
                  to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
                }
                @keyframes affiliateCtaOrbit {
                  to { transform: rotate(360deg); }
                }
                @keyframes affiliateCtaFlow {
                  to { stroke-dashoffset: -72; }
                }
                @keyframes affiliateCtaCoin {
                  0%, 100% { transform: translateY(3px) scale(.98); }
                  50% { transform: translateY(-5px) scale(1.03); }
                }
                @keyframes affiliateCtaNode {
                  0%, 100% { opacity: .72; transform: scale(.96); }
                  50% { opacity: 1; transform: scale(1.06); }
                }
                .affiliate-cta-illustration { animation: affiliateCtaIllustrationIn .8s .18s cubic-bezier(.2,.8,.2,1) both; }
                .affiliate-cta-orbit { animation: affiliateCtaOrbit 18s linear infinite; transform-box: fill-box; transform-origin: center; }
                .affiliate-cta-flow { animation: affiliateCtaFlow 3.8s linear infinite; }
                .affiliate-cta-coin { animation: affiliateCtaCoin 5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
                .affiliate-cta-node { animation: affiliateCtaNode 3.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
                .affiliate-cta-node:nth-of-type(2) { animation-delay: -1.2s; }
                .affiliate-cta-node:nth-of-type(3) { animation-delay: -2.4s; }
                @media (prefers-reduced-motion: reduce) {
                  .affiliate-cta-illustration, .affiliate-cta-orbit, .affiliate-cta-flow, .affiliate-cta-coin, .affiliate-cta-node {
                    animation: none !important;
                  }
                }
              `}</style>
              <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-56 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl sm:left-1/4 sm:h-40 sm:w-80" />
              <div className="relative px-1 py-7 text-center lg:px-5 lg:text-left">
                <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-coral sm:text-[10px]">Готовы начать?</div>
                <h2 className="mx-auto mt-3 max-w-md font-['Outfit'] text-2xl font-bold leading-tight sm:text-3xl lg:mx-0">Начните зарабатывать с первого пополнения</h2>
                <p className="mx-auto mt-3 max-w-sm text-xs leading-5 text-[var(--muted)] sm:mt-4 lg:mx-0">Зарегистрируйтесь и получите персональную партнёрскую ссылку.</p>
                <button type="button" onClick={onSignUp} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-coral bg-coral px-6 font-['Outfit'] text-sm font-bold text-[#2A0E06] transition-transform hover:-translate-y-0.5 hover:bg-[#FF9F85] sm:mt-7 sm:w-auto">
                  Стать партнёром
                  <ArrowIcon />
                </button>
              </div>
              <img
                className="affiliate-cta-illustration relative mx-auto mt-2 max-h-56 w-full rounded-xl object-contain [filter:hue-rotate(205deg)_saturate(.9)_brightness(1.08)] sm:max-h-72 lg:mt-0 lg:max-h-none"
                src={`${import.meta.env.BASE_URL}images/affiliate-partnership.png`}
                alt="Партнёры заключают соглашение на фоне элементов торговой аналитики"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="mx-auto mt-6 max-w-3xl px-2 text-center text-[10px] leading-4 text-[#555] sm:mt-8 sm:px-0 sm:text-[11px] sm:leading-5">
              «Трейдинг Промпт» не является инвестиционным советом. Сервис создаёт промпты и не гарантирует прибыль от торговли.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
