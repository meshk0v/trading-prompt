import { useMemo, useState } from 'react'

type ReviewsPageProps = {
  onClose: () => void
  user: object | null
  onSignUp: () => void
}

const REVIEW_CATEGORIES = ['Все', 'Форекс', 'Крипто'] as const

const REVIEWS = [
  {
    id: 1,
    name: 'А. М.',
    role: 'Трейдер',
    category: 'Форекс',
    market: 'EUR/USD · M5',
    date: '18 октября 2026',
    text: 'Пишу отзыв вроде пропускают отзывы, начал юзать ИИ , столкнулся с проблемой собирать инфу для отправки в ГПТ тут намного проще, собрал данные одной кнопкой и закинул в чат - тот выдает прогноз, я не верю на чистую всегда сравниваю со своей стратегией, проходимость стала выше.',
    featured: true,
  },
  {
    id: 2,
    name: 'Шредер.Ш.',
    role: 'Трейдер',
    category: 'Крипто',
    market: 'BTC/USDT · M1',
    date: '12 октября 2026',
    text: 'Всем привет! Я думал это сервис сигналов обычный, ну лоховозка как сейчас делают ии сигналы а там 50% сигналы а тут сигналов нет есть как щас говорят промпт с собраными показателями. пока пробую не чего сказать не могу только что удобно.',
  },
  {
    id: 3,
    name: 'Volkov V.',
    role: 'Трейдер',
    category: 'Форекс',
    market: 'EUR/USD · M1',
    date: '4 октября 2026',
    text: 'Увидел у одного блогера этот сайт тестирую на бинарках все норм, круто придумали, я бы еще много что добавил и убрал лишее, мало активов, нет ОТС.',
  },
  {
    id: 4,
    name: 'Елена М.',
    role: 'Трейдер',
    category: 'Форекс',
    market: 'GBP/JPY · M5',
    date: '27 сентября 2026',
    text: 'Трудно разобраться по началу, потом разобрался, ушел день. В целом зачет, не обычно конечно, но оно работает как хоелось бы...',
  },
  {
    id: 5,
    name: '@Нига.',
    role: 'Трейдер',
    category: 'Крипто',
    market: 'ETH/USDT · M5',
    date: '19 сентября 2026',
    text: 'Нормальный.',
  },
  {
    id: 6,
    name: 'Шарапат И.',
    role: 'Трейдер',
    category: 'Форекс',
    market: 'USD/JPY · M1',
    date: '8 сентября 2026',
    text: 'Асамугалейкум торгую на покет, за любой отзыв плохо или хороший сечас начисляют промты. Можно можно тратит на сборку промта.Оставляю хороший отзыв мне нравица.',
  },
  {
    id: 7,
    name: 'Клин А.',
    role: 'Трейдер',
    category: 'Форекс',
    market: 'XAU/USD · M15',
    date: '2 сентября 2026',
    text: 'По золоту часто бывают резкие скочки, поэтому полезно видеть уровни и общую картину . Сервис собирает всё достаточно быстро. Пока пользуюсь, всё устраивает.',
  },
] as const

function Stars() {
  return (
    <div className="flex gap-0.5 text-amber" aria-label="Оценка 5 из 5">
      {[0, 1, 2, 3, 4].map(star => (
        <svg key={star} width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="m8 1.4 1.86 3.77 4.16.6-3.01 2.94.71 4.14L8 10.9l-3.72 1.95.71-4.14-3.01-2.94 4.16-.6L8 1.4Z"/>
        </svg>
      ))}
    </div>
  )
}

function MissingImageAvatar({ name }: { name: string }) {
  return (
    <div
      className="grid size-10 shrink-0 place-items-center rounded-full border border-accent/25 bg-accent/[0.08] text-accent"
      role="img"
      aria-label={`Изображение пользователя ${name} не установлено`}
      title="Изображение не установлено"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1.45"/>
        <circle cx="9" cy="9.5" r="2" stroke="currentColor" strokeWidth="1.35"/>
        <path d="m5.8 17 4.1-4 2.9 2.6 2.2-2.1 3.2 3.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 20 20 5" stroke="var(--surface)" strokeWidth="4" strokeLinecap="round"/>
        <path d="M5 20 20 5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

export default function ReviewsPage({ onClose, user, onSignUp }: ReviewsPageProps) {
  const [category, setCategory] = useState<(typeof REVIEW_CATEGORIES)[number]>('Все')
  const [reviewName, setReviewName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [reviewPhoto, setReviewPhoto] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const reviews = useMemo(
    () => category === 'Все' ? REVIEWS : REVIEWS.filter(review => review.category === category),
    [category],
  )

  const handlePhotoChange = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setReviewPhoto(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  const handleReviewSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reviewName.trim() || !reviewText.trim()) return
    setReviewSubmitted(true)
    setReviewName('')
    setReviewText('')
    setReviewPhoto('')
  }

  const reviewForm = (
    <form onSubmit={handleReviewSubmit} className="review-card-decor relative flex min-h-72 flex-col overflow-hidden rounded-xl border border-accent/35 bg-[linear-gradient(145deg,var(--card),color-mix(in_srgb,var(--accent)_10%,var(--bg)))] p-5">
      <div className="pointer-events-none absolute -right-16 -top-20 size-44 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-accent">Ваш опыт</div>
          <h2 className="mt-1 font-['Outfit'] text-lg font-bold">Добавить отзыв</h2>
        </div>
        <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {reviewSubmitted && (
        <div className="relative mt-4 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2.5 text-xs leading-5 text-[var(--cyan-text)]" role="status">
          Спасибо! Отзыв принят для предпросмотра и не будет сохранён после обновления страницы.
        </div>
      )}

      <div className="relative mt-4 flex gap-3">
        <label className="grid size-14 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-accent/40 bg-[var(--input-bg)] text-accent transition-colors hover:border-accent" aria-label="Загрузить фотографию">
          {reviewPhoto ? (
            <img src={reviewPhoto} alt="Предпросмотр фотографии" className="size-full object-cover" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="2.5" y="3.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.4"/>
              <circle cx="7.5" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.3"/>
              <path d="m4.5 16 4.2-4 3.1 2.7 2.5-2.4 3.2 3.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          <input type="file" accept="image/*" className="sr-only" onChange={event => handlePhotoChange(event.target.files?.[0])} />
        </label>
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Ваше имя</span>
          <input
            type="text"
            required
            maxLength={60}
            value={reviewName}
            onChange={event => { setReviewName(event.target.value); setReviewSubmitted(false) }}
            placeholder="Как к вам обращаться"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text)] outline-none transition-colors placeholder:text-[var(--muted3)] focus:border-accent"
          />
        </label>
      </div>

      <label className="relative mt-3 flex flex-1 flex-col">
        <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Текст отзыва</span>
        <textarea
          required
          maxLength={600}
          value={reviewText}
          onChange={event => { setReviewText(event.target.value); setReviewSubmitted(false) }}
          placeholder="Расскажите, как вы используете Trading Prompt"
          className="min-h-28 flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--input-bg)] p-3 text-xs leading-5 text-[var(--text)] outline-none transition-colors placeholder:text-[var(--muted3)] focus:border-accent"
        />
        <span className="mt-1.5 text-right font-['JetBrains_Mono'] text-[8px] text-[var(--muted3)]">{reviewText.length}/600</span>
      </label>

      <button type="submit" className="relative mt-3 h-10 rounded-lg bg-accent text-xs font-bold text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)]">
        Отправить отзыв
      </button>
    </form>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <style>{`
        @keyframes reviewsAmbientDrift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(.94); opacity: .28; }
          50% { transform: translate3d(18px, -24px, 0) scale(1.06); opacity: .5; }
        }
        @keyframes reviewsOrbitTurn {
          to { transform: rotate(360deg); }
        }
        @keyframes reviewsParticlePulse {
          0%, 100% { opacity: .22; transform: scale(.75); }
          50% { opacity: .72; transform: scale(1.15); }
        }
        @keyframes reviewsStarRise {
          0% {
            opacity: 0;
            transform: translate3d(-80px, 160px, 0) rotate(-55deg) scaleX(.35);
          }
          12% { opacity: .82; }
          72% { opacity: .58; }
          100% {
            opacity: 0;
            transform: translate3d(420px, -760px, 0) rotate(-55deg) scaleX(1);
          }
        }
        .reviews-ambient-glow { animation: reviewsAmbientDrift 12s ease-in-out infinite; }
        .reviews-ambient-glow:nth-child(2) { animation-delay: -4s; animation-duration: 15s; }
        .reviews-ambient-glow:nth-child(3) { animation-delay: -8s; animation-duration: 18s; }
        .reviews-orbit { animation: reviewsOrbitTurn 26s linear infinite; }
        .reviews-particle { animation: reviewsParticlePulse 4.5s ease-in-out infinite; }
        .reviews-particle:nth-child(2) { animation-delay: -1.5s; }
        .reviews-particle:nth-child(3) { animation-delay: -3s; }
        .reviews-rising-star {
          position: absolute;
          height: 1px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(185,175,255,.3) 45%, rgba(255,255,255,.95));
          box-shadow: 20px 0 10px rgba(139,124,255,.42);
          opacity: 0;
          transform-origin: right center;
          animation: reviewsStarRise linear infinite;
          will-change: transform, opacity;
        }
        .reviews-rising-star::after {
          content: '';
          position: absolute;
          right: -2px;
          top: 50%;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 7px 2px rgba(185,175,255,.8);
          transform: translateY(-50%);
        }
        .review-card-decor::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: .22;
          background-image: radial-gradient(circle, rgba(139,124,255,.2) 1px, transparent 1px);
          background-size: 22px 22px;
          mask-image: linear-gradient(135deg, black, transparent 62%);
        }
        .review-card-decor::after {
          content: '';
          position: absolute;
          left: 20px;
          right: 20px;
          top: 0;
          height: 1px;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(139,124,255,.55), transparent);
        }
        @media (prefers-reduced-motion: reduce) {
          .reviews-ambient-glow, .reviews-orbit, .reviews-particle, .reviews-rising-star { animation: none !important; }
        }
      `}</style>
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] px-5 py-4 md:px-8">
        <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]" aria-label="Вернуться назад">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m10 3-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="grid size-10 place-items-center rounded-md border border-accent/25 bg-accent/10 text-accent">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 17H4.5A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v9a1.5 1.5 0 0 1-1.5 1.5H11l-4 3v-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div className="font-['Outfit'] text-xl font-bold">Отзывы</div>
          <div className="mt-0.5 text-xs text-[var(--muted)]">Опыт пользователей Trading Prompt</div>
        </div>
      </div>

      <div className="page-body scrollable relative flex-1 overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="reviews-ambient-glow absolute -left-32 top-[8%] size-80 rounded-full bg-accent/[0.055] blur-3xl" />
          <div className="reviews-ambient-glow absolute -right-40 top-[42%] size-96 rounded-full bg-cyan/[0.035] blur-3xl" />
          <div className="reviews-ambient-glow absolute bottom-[4%] left-[28%] size-72 rounded-full bg-coral/[0.035] blur-3xl" />
          <svg className="reviews-orbit absolute right-[4%] top-[16%] size-52 text-accent opacity-[0.08]" viewBox="0 0 220 220" fill="none">
            <circle cx="110" cy="110" r="82" stroke="currentColor" strokeWidth="1" strokeDasharray="5 9"/>
            <circle cx="110" cy="110" r="55" stroke="currentColor" strokeWidth="1"/>
            <circle cx="110" cy="28" r="4" fill="currentColor"/>
          </svg>
        </div>

        <main className="relative isolate mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
          {!user && (
            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-screen -translate-x-1/2 overflow-hidden opacity-50" aria-hidden="true">
              {Array.from({ length: 36 }, (_, index) => (
                <span
                  key={index}
                  className="reviews-rising-star"
                  style={{
                    left: `${(index * 29) % 104 - 4}%`,
                    top: `${(index * 37) % 108}%`,
                    width: 48 + (index % 5) * 16,
                    animationDuration: `${5.2 + (index % 7) * 0.45}s`,
                    animationDelay: `${-0.8 - (index % 9) * 0.7}s`,
                  }}
                />
              ))}
            </div>
          )}
          <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[linear-gradient(145deg,var(--card),color-mix(in_srgb,var(--accent)_9%,var(--bg)))] px-5 py-10 md:px-10 md:py-14">
            <div className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full bg-accent/15 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(139,124,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,124,255,.05)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:linear-gradient(115deg,black,transparent_72%)]" />
            <div className="pointer-events-none absolute right-7 top-7 hidden items-center gap-2 text-accent/40 md:flex" aria-hidden="true">
              <span className="reviews-particle size-1.5 rounded-full bg-current" />
              <span className="reviews-particle size-1 rounded-full bg-current" />
              <span className="reviews-particle size-2 rounded-full bg-current" />
              <span className="h-px w-10 bg-gradient-to-r from-current to-transparent" />
            </div>
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.17em] text-accent">Отзывы трейдеров</div>
                <h1 className="mt-3 max-w-3xl font-['Outfit'] text-4xl font-bold tracking-[-0.04em] md:text-5xl">Промпты, которые помогают видеть рынок яснее</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Истории пользователей, которые собирают технический контекст, проверяют торговые идеи и экономят время на подготовке анализа.</p>
                <div className="mt-6 flex w-fit items-center gap-4 rounded-xl border border-accent/20 bg-[var(--bg)]/70 p-4 backdrop-blur">
                  <div className="font-['JetBrains_Mono'] text-4xl font-bold text-accent">4.9</div>
                  <div>
                    <Stars />
                    <div className="mt-1 text-[10px] text-[var(--muted)]">по оценкам пользователей</div>
                  </div>
                </div>
              </div>
              <div className="group relative">
                <div className="pointer-events-none absolute bottom-4 left-1/2 h-16 w-2/3 -translate-x-1/2 rounded-full bg-coral/15 blur-2xl" />
                <img
                  src="/images/reviews-hero.png"
                  alt="Смартфон с отзывами пользователей, звёздами и жестом одобрения"
                  className="relative aspect-[3/2] w-full object-contain drop-shadow-[0_18px_24px_rgba(255,138,107,.16)] transition-transform duration-700 group-hover:scale-[1.025]"
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-coral/25 bg-black/55 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-coral backdrop-blur-md">
                  <span className="reviews-particle size-1.5 rounded-full bg-coral" />
                  Оценки сообщества
                </div>
              </div>
            </div>
            <div className="relative mt-8 grid grid-cols-3 border-t border-[var(--border)] pt-6">
              {[
                ['2 400+', 'собранных промптов'],
                ['94%', 'рекомендуют сервис'],
                ['2 СЕК', 'среднее время сборки'],
              ].map(([value, label], index) => (
                <div key={label} className={`px-2 text-center ${index > 0 ? 'border-l border-[var(--border)]' : ''}`}>
                  <div className="font-['JetBrains_Mono'] text-lg font-bold text-[var(--text)] md:text-2xl">{value}</div>
                  <div className="mt-1 text-[9px] leading-4 text-[var(--muted)] md:text-[10px]">{label}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            {REVIEW_CATEGORIES.map(item => (
              <button key={item} type="button" onClick={() => setCategory(item)} className={`h-9 shrink-0 rounded-full border px-4 text-xs font-bold transition-colors ${category === item ? 'border-accent bg-accent text-[var(--on-accent)]' : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-accent/40 hover:text-accent'}`}>
                {item}
              </button>
            ))}
          </div>

          <section className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Отзывы пользователей">
            {reviews.map((review, index) => (
              <div key={review.id} className="contents">
              {category === 'Все' && index === 5 && reviewForm}
              <article className={`review-card-decor group relative flex min-h-72 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-accent/35 ${'featured' in review && review.featured && category === 'Все' ? 'md:col-span-2 lg:col-span-2' : ''}`}>
                <div className="pointer-events-none absolute -right-16 -top-20 size-40 rounded-full bg-accent/[0.055] blur-3xl transition-opacity group-hover:opacity-100" />
                <div className="pointer-events-none absolute -right-1 top-7 font-serif text-7xl leading-none text-accent/[0.045]" aria-hidden="true">“</div>
                <div className="relative flex items-center justify-between gap-3">
                  <Stars />
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-['JetBrains_Mono'] text-[9px] text-[var(--muted)]">{review.market}</span>
                </div>
                <blockquote className={`relative mt-5 flex-1 font-['Outfit'] leading-7 text-[var(--text2)] ${'featured' in review && review.featured && category === 'Все' ? 'text-lg md:text-xl' : 'text-base'}`}>
                  “{review.text}”
                </blockquote>
                <div className="relative mt-6 flex items-center gap-3 border-t border-[var(--border)] pt-4">
                  <MissingImageAvatar name={review.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-[var(--text)]">{review.name}</div>
                    <div className="truncate text-[10px] text-[var(--muted)]">{review.role}</div>
                  </div>
                  <time className="text-right text-[9px] leading-4 text-[var(--muted3)]">{review.date}</time>
                </div>
              </article>
              </div>
            ))}
          </section>

          <section className="relative mt-10 overflow-hidden rounded-2xl border border-accent/25 bg-[linear-gradient(135deg,var(--card),color-mix(in_srgb,var(--accent)_12%,var(--bg)))] px-5 py-9 text-center md:px-10 md:text-left">
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(139,124,255,.2)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(circle_at_center,black,transparent_76%)]" />
            <div className="reviews-orbit pointer-events-none absolute -left-16 -top-20 size-48 rounded-full border border-dashed border-accent/15" aria-hidden="true">
              <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/50" />
            </div>
            <div className="reviews-orbit pointer-events-none absolute -bottom-24 -right-10 size-56 rounded-full border border-dashed border-cyan/10 [animation-direction:reverse]" aria-hidden="true">
              <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/40" />
            </div>
            <div className="relative grid items-center gap-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-10">
              <div>
                <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.07] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-accent md:mx-0">
                  <span className="size-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
                  Реальные данные · структурированный результат
                </div>
                <div className="mx-auto grid size-11 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent md:mx-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <h2 className="mt-4 font-['Outfit'] text-2xl font-bold">{user ? 'Соберите следующий промпт' : 'Попробуйте Trading Prompt'}</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)] md:mx-0">{user ? 'Вернитесь в чат и подготовьте новый анализ на реальных рыночных данных.' : 'Зарегистрируйтесь и соберите первые промпты бесплатно.'}</p>
                <div className="mx-auto mt-5 flex max-w-xl flex-wrap justify-center gap-2 text-[9px] font-semibold text-[var(--muted)] md:mx-0 md:justify-start">
                  {['Уровни и индикаторы', 'Несколько таймфреймов', 'Экспорт TP1'].map(item => (
                    <span key={item} className="rounded-full border border-[var(--border)] bg-[var(--bg)]/55 px-3 py-1.5">{item}</span>
                  ))}
                </div>
                <button type="button" onClick={user ? onClose : onSignUp} className="mt-6 h-11 rounded-md bg-accent px-6 text-sm font-bold text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)]">
                  {user ? 'Перейти в чат' : 'Попробовать бесплатно'}
                </button>
              </div>
              <div className="group relative">
                <div className="pointer-events-none absolute bottom-5 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-coral/15 blur-2xl" />
                <img
                  src="/images/reviews-cta-trading.png"
                  alt="Торговый график с индикаторами, таймфреймами и экспортом TP1"
                  className="relative aspect-[3/2] w-full object-contain drop-shadow-[0_18px_28px_rgba(255,107,55,.18)] transition-transform duration-700 group-hover:scale-[1.025]"
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
