// @refresh reset
import { useEffect, useState } from 'react'
import { login, register, type AuthUser } from './authApi'
import AccountSettings from './components/AccountSettings'
import Binum_LOGO from './components/BinumLogo'
import CustomSelect from './components/CustomSelect'
import PairFlag from './components/PairFlag'
const PageHeader = ({ icon, title, description, onClose }: {
  icon: React.ReactNode
  title: string
  description?: React.ReactNode
  onClose?: () => void
}) => (
  <div className="page-hdr" style={{
    background: 'var(--bg)', borderBottom: '1px solid var(--border)',
    padding: '20px 32px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexShrink: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '5px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        color: 'var(--muted)',
      }}>
        {icon}
      </div>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text)', letterSpacing: '-0.2px' }}>
          {title}
        </h1>
        {description && (
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7C7A98', fontFamily: 'Inter, sans-serif' }}>
            {description}
          </p>
        )}
      </div>
    </div>
    {onClose && (
      <button onClick={onClose} style={{
        width: 36, height: 36, borderRadius: '5px',
        background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer',
        color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = '#2E2E46'; e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    )}
  </div>
)

type IndicatorDatum = {
  id: number
  category: 'oscillator' | 'trend' | 'volatility' | 'volume'
  name: string
  param: string
  value: string
  signal: 'BUY' | 'SELL' | 'NEUTRAL'
}

type VolumeDatum = {
  id: number
  exchange: string
  instrument: string
  volume: string
  change: string
  signal: 'BUY' | 'SELL' | 'NEUTRAL'
}

type FundamentalDatum = {
  id: number
  country: string
  flag: string
  name: string
  period: string
  actual: string
  forecast: string
  previous: string
  signal: 'BUY' | 'SELL' | 'NEUTRAL'
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  prompt?: string
  chart?: {
    pair: string
    timeframe: string
  }
}

const ALL_INSTRUMENTS: Record<string, string[]> = {
  'Мажорные':    ['EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','USD/CAD','NZD/USD','EUR/JPY','GBP/JPY','EUR/GBP','EUR/CHF','AUD/JPY','GBP/CHF','NZD/JPY','AUD/NZD','CHF/JPY','EUR/AUD','GBP/AUD','EUR/CAD','GBP/CAD'],
  'Минорные':    ['AUD/CAD','AUD/CHF','CAD/CHF','CAD/JPY','EUR/DKK','EUR/NOK','EUR/NZD','EUR/PLN','EUR/SEK','GBP/NZD','NZD/CAD','NZD/CHF','AUD/SGD','CAD/SGD','EUR/CZK','EUR/HUF','EUR/RON','GBP/DKK','GBP/NOK','GBP/PLN','GBP/SEK','GBP/SGD','NZD/SGD','SGD/JPY','USD/CNH'],
  'Экзотические':['USD/TRY','USD/ZAR','USD/MXN','USD/SGD','USD/HKD','EUR/TRY','USD/BRL','USD/PLN','USD/NOK','USD/SEK','USD/DKK','EUR/NOK','USD/THB','USD/IDR','USD/INR','USD/PHP','USD/KRW','USD/CZK','USD/HUF','USD/RON','USD/ILS','USD/AED','USD/SAR','USD/QAR','USD/EGP','EUR/ZAR','GBP/ZAR','EUR/MXN'],
  'Крипто':      ['BTC/USD','ETH/USD','BNB/USD','XRP/USD','SOL/USD','ADA/USD','AVAX/USD','DOT/USD','MATIC/USD','LINK/USD','LTC/USD','ATOM/USD','DOGE/USD','TRX/USD'],
  'Товары':      ['XAU/USD','XAG/USD','OIL/USD','BRENT/USD','GAS/USD','COPPER/USD','WHEAT/USD','CORN/USD','PLATINUM/USD'],
  'Индексы':     ['SPX500','NDX100','DAX40','FTSE100','NKY225','HK50','CAC40','ASX200','DJ30'],
}

const DEFAULT_WATCHLIST = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'AUD/USD', 'USD/CHF', 'GBP/JPY', 'NZD/USD', 'USD/CAD', 'EUR/GBP', 'EUR/JPY', 'OIL/USD', 'USD/TRY', 'EUR/CHF', 'AUD/CAD', 'USD/ZAR', 'USD/NOK', 'GBP/CHF', 'EUR/AUD', 'XAG/USD']

const PAIR_CATEGORIES = {
  Crypto:  ALL_INSTRUMENTS['Крипто'],
  Major:   ALL_INSTRUMENTS['Мажорные'],
  Minor:   ALL_INSTRUMENTS['Минорные'],
  Exotic:  ALL_INSTRUMENTS['Экзотические'],
  Товары:  ALL_INSTRUMENTS['Товары'],
  Индексы: ALL_INSTRUMENTS['Индексы'],
}
const CURRENCY_PAIRS = Object.values(PAIR_CATEGORIES).flat()
const TIMEFRAME_OPTIONS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M10', 'M12', 'M15', 'M20', 'M30', 'H1', 'H2', 'H3', 'H4', 'H6', 'H8', 'H12', 'D1', 'W1', 'MN']
  .map(period => ({ label: period, value: period }))

const GREETINGS = [
  `Добро пожаловать в Trading Prompt

Trading Prompt собирает актуальные рыночные данные и формирует структурированный промпт для анализа с помощью AI.

Как начать:

1. Выберите торговый инструмент.
2. Укажите таймфрейм.
3. Выберите необходимые данные для анализа.
4. Добавьте свой вопрос или задачу для AI.
5. Нажмите «Создать промпт».
6. Скопируйте готовый промпт и отправьте его в ChatGPT, Claude, Gemini, DeepSeek или другой AI.

В зависимости от выбранных параметров промпт может включать цену, свечи, индикаторы, тренды, уровни, волатильность и другие рыночные данные.

Начните с выбора торгового инструмента.`,
  `Добро пожаловать в Trading Prompt

Подготовьте данные для AI-анализа рынка в несколько шагов.

Шаг 1 — Инструмент
Выберите валютную пару, криптовалюту, индекс, акцию или другой интересующий актив.

Шаг 2 — Период
Выберите таймфрейм и необходимую глубину исторических данных.

Шаг 3 — Данные
Настройте набор информации: свечи, индикаторы, тренды, уровни, волатильность и другие параметры.

Шаг 4 — Запрос
Добавьте собственную задачу или используйте готовый шаблон.

Шаг 5 — Trading Prompt
Система объединит выбранные параметры и рыночные данные в единый структурированный запрос.

Шаг 6 — AI-анализ
Скопируйте промпт и передайте его выбранной AI-модели для дальнейшего анализа.

Trading Prompt не принимает торговые решения за пользователя. Он помогает подготовить данные и сформировать качественный запрос для AI.`,
  `Добро пожаловать в Trading Prompt

Trading Prompt — это среда для автоматической подготовки структурированных запросов на основе рыночных данных.

Сервис объединяет выбранный вами торговый инструмент, таймфрейм, исторические данные, технические показатели и дополнительные параметры анализа в единый формат, подготовленный для передачи AI.

Для начала:

1. Выберите инструмент
Укажите актив, который необходимо проанализировать.

2. Определите таймфрейм
Выберите период свечей и глубину исторических данных.

3. Настройте набор данных
Определите, какие показатели и параметры должны быть включены в анализ.

4. Сформулируйте задачу
Введите собственный вопрос или выберите готовый шаблон промпта.

5. Сформируйте запрос
Trading Prompt соберёт выбранную информацию в единый структурированный промпт.

6. Используйте его в AI
Передайте готовый запрос в ChatGPT, Claude, Gemini, DeepSeek или другую совместимую AI-модель.

Таким образом, вместо ручного сбора информации вы получаете подготовленный контекст для дальнейшего AI-анализа рынка.

Выберите инструмент, чтобы начать.`,
]

function formatTime(date: Date) {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function makeRng(seed: number) {
  let s = seed | 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0
    return (s >>> 0) / 4294967296
  }
}

function generateIndicators(direction: 'BUY' | 'SELL' | 'WAIT', pair: string): IndicatorDatum[] {
  const pairSeed = pair.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)
  const rng = makeRng((Date.now() & 0xfffff) ^ pairSeed)

  const bias = direction === 'BUY'  ? 0.70 + rng() * 0.20
             : direction === 'SELL' ? 0.08 + rng() * 0.20
             :                        0.40 + rng() * 0.20

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const rv = (spread: number) => (rng() - 0.5) * 2 * spread
  const fmt = (n: number, dec = 2) => n.toFixed(dec)

  const BASE_PRICES: Record<string, number> = {
    'EUR/USD': 1.0820, 'GBP/USD': 1.2650, 'USD/JPY': 149.50, 'XAU/USD': 2320,
    'AUD/USD': 0.6580, 'USD/CHF': 0.9050, 'GBP/JPY': 189.20, 'NZD/USD': 0.6020,
    'USD/CAD': 1.3650, 'EUR/GBP': 0.8550, 'EUR/JPY': 161.80, 'OIL/USD': 82.50,
    'USD/TRY': 32.20, 'EUR/CHF': 0.9780, 'AUD/CAD': 0.8970, 'USD/ZAR': 18.60,
    'USD/NOK': 10.85, 'GBP/CHF': 1.1440, 'EUR/AUD': 1.6420, 'XAG/USD': 27.40,
  }
  const bp = BASE_PRICES[pair] ?? 1.0000
  const fmtP = (n: number) => n >= 100 ? n.toFixed(2) : n.toFixed(4)
  const fmtK = (n: number) => {
    const a = Math.abs(n)
    if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'
    if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'
    if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'
    return n.toFixed(0)
  }

  const sig = (v: number, buyThr: number, sellThr: number, inv = false): 'BUY' | 'SELL' | 'NEUTRAL' => {
    if (!inv) { if (v >= buyThr) return 'BUY'; if (v <= sellThr) return 'SELL' }
    else      { if (v <= sellThr) return 'BUY'; if (v >= buyThr) return 'SELL' }
    return 'NEUTRAL'
  }
  const bsig = (thr = 0.60): 'BUY' | 'SELL' | 'NEUTRAL' => {
    if (bias > thr) return 'BUY'; if (bias < 1 - thr) return 'SELL'; return 'NEUTRAL'
  }

  const mo = direction === 'BUY' ? 0.015 : direction === 'SELL' ? -0.015 : 0.002

  // — Oscillator values —
  const rsi      = lerp(22, 78, bias) + rv(4)
  const stochK   = Math.max(0, Math.min(100, lerp(5, 95, bias) + rv(5)))
  const stochD   = Math.max(0, Math.min(100, stochK + rv(3) - 1.5))
  const wpr      = Math.max(-100, Math.min(0, lerp(-100, 0, bias) + rv(5)))
  const cci      = lerp(-220, 220, bias) + rv(15)
  const mfiOsc   = Math.max(0, Math.min(100, lerp(15, 85, bias) + rv(5)))
  const roc      = lerp(-12, 12, bias) + rv(1)
  const mtm      = lerp(-300, 300, bias) + rv(20)
  const uo       = Math.max(0, Math.min(100, lerp(20, 80, bias) + rv(5)))
  const ao       = lerp(-400, 400, bias) + rv(30)
  const ac       = lerp(-200, 200, bias) + rv(20)
  const trix     = lerp(-4, 4, bias) + rv(0.3)
  const ppo      = lerp(-12, 12, bias) + rv(1)
  const kst      = lerp(-400, 400, bias) + rv(30)
  const dpo      = lerp(-400, 400, bias) + rv(30)
  const fisher   = lerp(-4.5, 4.5, bias) + rv(0.3)
  const crsi     = Math.max(0, Math.min(100, lerp(5, 95, bias) + rv(5)))
  const cmo      = lerp(-90, 90, bias) + rv(8)
  const rviOsc   = lerp(-1.8, 1.8, bias) + rv(0.1)
  const stochRsi = Math.max(0, Math.min(100, lerp(5, 95, bias) + rv(5)))
  const tsi1     = lerp(-80, 80, bias) + rv(8)
  const tsi2     = lerp(-80, 80, bias) + rv(8)
  const bop      = lerp(-0.9, 0.9, bias) + rv(0.05)
  const bbp      = lerp(-400, 400, bias) + rv(30)
  const elderRay = lerp(-400, 400, bias) + rv(30)
  const qstick   = lerp(-80, 80, bias) + rv(8)

  // — Trend/MA values —
  const adx      = Math.max(8, Math.min(100, lerp(10, 58, 0.3 + Math.abs(bias - 0.5)) + rv(4)))
  const plusDi   = Math.max(0, Math.min(60, lerp(5, 55, bias) + rv(4)))
  const minusDi  = Math.max(0, Math.min(60, lerp(55, 5, bias) + rv(4)))
  const aroonUp  = Math.max(0, Math.min(100, lerp(0, 100, bias) + rv(8)))
  const aroonDn  = Math.max(0, Math.min(100, lerp(100, 0, bias) + rv(8)))
  const aroonOsc = aroonUp - aroonDn
  const viPlus   = lerp(0.8, 1.8, bias) + rv(0.1)
  const viMinus  = lerp(1.8, 0.8, bias) + rv(0.1)
  const chop     = Math.max(20, Math.min(95, lerp(65, 38, Math.abs(bias - 0.5) * 2) + rv(5)))
  const supert   = direction === 'BUY' ? 'BUY' : direction === 'SELL' ? 'SELL' : 'NEUTRAL'
  const psar     = direction === 'BUY' ? 'BUY' : direction === 'SELL' ? 'SELL' : 'NEUTRAL'
  const ichi     = direction === 'BUY' ? 'Bullish' : direction === 'SELL' ? 'Bearish' : 'Neutral'

  const ma = (pct: number) => fmtP(bp * (1 + mo * pct + rv(0.003)))

  // — Volatility values —
  const atr     = bp * (0.003 + rng() * 0.007)
  const atrPct  = atr / bp * 100
  const bbU     = bp * (1.015 + rng() * 0.01)
  const bbL     = bp * (0.985 - rng() * 0.01)
  const bbW     = (bbU - bbL) / bp * 100
  const bbPctB  = Math.max(-0.5, Math.min(1.5, lerp(-0.1, 1.1, bias) + rv(0.05)))
  const mi      = 24 + rng() * 8
  const ui      = 2 + rng() * 12

  // — Volume values —
  const vol     = Math.round(1000000 * (0.5 + rng() * 2))
  const volSma  = Math.round(1000000 * (0.5 + rng() * 2))
  const obv     = Math.round((rng() - 0.5) * 200000000)
  const cmfV    = Math.max(-1, Math.min(1, lerp(-0.45, 0.45, bias) + rv(0.03)))
  const coV     = Math.round((rng() - 0.5) * 800000)
  const emvV    = lerp(-80, 80, bias) + rv(8)
  const mfiVolV = Math.max(0, Math.min(100, lerp(15, 85, bias) + rv(5)))
  const rvol    = 0.4 + rng() * 3.0
  const vwmaDiff = lerp(-8, 8, bias) + rv(1)
  const pvr     = Math.max(0, Math.min(100, lerp(20, 80, bias) + rv(8)))
  const voV     = lerp(-80, 80, bias) + rv(8)
  const asi     = lerp(-3000, 3000, bias) + rv(200)
  const siV     = lerp(-80, 80, bias) + rv(8)
  const di100   = lerp(-4, 4, bias) + rv(0.3)

  return [
    // ── 1–25 Oscillators ──
    { id:1,  category:'oscillator', name:'RSI',                 param:'RSI 14',       value:fmt(Math.max(0,Math.min(100,rsi))),                       signal:sig(rsi,65,35) },
    { id:2,  category:'oscillator', name:'Stochastic',          param:'%K / %D',      value:`${fmt(stochK)} / ${fmt(stochD)}`,                        signal:sig(stochK,70,30) },
    { id:3,  category:'oscillator', name:'Williams %R',         param:'%R',           value:fmt(wpr),                                                  signal:sig(wpr,-20,-80,true) },
    { id:4,  category:'oscillator', name:'CCI',                 param:'CCI 20',       value:fmt(cci,1),                                                signal:sig(cci,100,-100) },
    { id:5,  category:'oscillator', name:'MFI',                 param:'MFI 14',       value:fmt(mfiOsc),                                               signal:sig(mfiOsc,60,40) },
    { id:6,  category:'oscillator', name:'ROC',                 param:'ROC 12',       value:fmt(roc,2)+'%',                                            signal:sig(roc,3,-3) },
    { id:7,  category:'oscillator', name:'Momentum',            param:'MTM 10',       value:fmt(mtm,1),                                                signal:sig(mtm,50,-50) },
    { id:8,  category:'oscillator', name:'Ultimate Oscillator', param:'UO 7/14/28',   value:fmt(uo),                                                   signal:sig(uo,60,40) },
    { id:9,  category:'oscillator', name:'Awesome Oscillator',  param:'AO',           value:fmt(ao,1),                                                 signal:sig(ao,50,-50) },
    { id:10, category:'oscillator', name:'Accelerator Osc.',    param:'AC',           value:fmt(ac,1),                                                 signal:sig(ac,30,-30) },
    { id:11, category:'oscillator', name:'TRIX',                param:'TRIX 15',      value:fmt(trix,3)+'%',                                           signal:sig(trix,1,-1) },
    { id:12, category:'oscillator', name:'PPO',                 param:'PPO',          value:fmt(ppo,2)+'%',                                            signal:sig(ppo,3,-3) },
    { id:13, category:'oscillator', name:'KST',                 param:'KST',          value:fmt(kst,1),                                                signal:sig(kst,50,-50) },
    { id:14, category:'oscillator', name:'DPO',                 param:'DPO 20',       value:fmt(dpo,1),                                                signal:sig(dpo,50,-50) },
    { id:15, category:'oscillator', name:'Fisher Transform',    param:'Fisher',       value:fmt(fisher,2),                                             signal:sig(fisher,2,-2) },
    { id:16, category:'oscillator', name:'Connors RSI',         param:'CRSI',         value:fmt(crsi),                                                 signal:sig(crsi,65,35) },
    { id:17, category:'oscillator', name:'Chande MO',           param:'CMO',          value:fmt(cmo,1),                                                signal:sig(cmo,30,-30) },
    { id:18, category:'oscillator', name:'Relative Vigor',      param:'RVI',          value:fmt(rviOsc,3),                                             signal:sig(rviOsc,0.5,-0.5) },
    { id:19, category:'oscillator', name:'Stochastic RSI',      param:'Stoch RSI',    value:fmt(stochRsi),                                             signal:sig(stochRsi,70,30) },
    { id:20, category:'oscillator', name:'TSI',                 param:'TSI',          value:fmt(tsi1,1),                                               signal:sig(tsi1,20,-20) },
    { id:21, category:'oscillator', name:'True Strength Index', param:'TSI 2',        value:fmt(tsi2,1),                                               signal:sig(tsi2,20,-20) },
    { id:22, category:'oscillator', name:'Balance of Power',    param:'BOP',          value:fmt(bop,3),                                                signal:sig(bop,0.3,-0.3) },
    { id:23, category:'oscillator', name:'Bull Bear Power',     param:'BBP',          value:fmt(bbp,1),                                                signal:sig(bbp,50,-50) },
    { id:24, category:'oscillator', name:'Elder Ray Index',     param:'Bull/Bear',    value:fmt(elderRay,1),                                           signal:sig(elderRay,50,-50) },
    { id:25, category:'oscillator', name:'Qstick',              param:'Qstick',       value:fmt(qstick,1),                                             signal:sig(qstick,20,-20) },
    // ── 26–50 Trend / MA ──
    { id:26, category:'trend', name:'SMA 20',            param:'SMA 20',      value:ma(0.3),   signal:bsig() },
    { id:27, category:'trend', name:'SMA 50',            param:'SMA 50',      value:ma(0.6),   signal:bsig() },
    { id:28, category:'trend', name:'SMA 100',           param:'SMA 100',     value:ma(0.9),   signal:bsig() },
    { id:29, category:'trend', name:'SMA 200',           param:'SMA 200',     value:ma(1.2),   signal:bsig() },
    { id:30, category:'trend', name:'EMA 9',             param:'EMA 9',       value:ma(0.15),  signal:bsig() },
    { id:31, category:'trend', name:'EMA 21',            param:'EMA 21',      value:ma(0.25),  signal:bsig() },
    { id:32, category:'trend', name:'EMA 50',            param:'EMA 50',      value:ma(0.55),  signal:bsig() },
    { id:33, category:'trend', name:'EMA 200',           param:'EMA 200',     value:ma(1.1),   signal:bsig() },
    { id:34, category:'trend', name:'WMA 20',            param:'WMA 20',      value:ma(0.28),  signal:bsig() },
    { id:35, category:'trend', name:'VWMA 20',           param:'VWMA 20',     value:ma(0.26),  signal:bsig() },
    { id:36, category:'trend', name:'HMA 20',            param:'HMA 20',      value:ma(0.24),  signal:bsig() },
    { id:37, category:'trend', name:'DEMA 20',           param:'DEMA 20',     value:ma(0.22),  signal:bsig() },
    { id:38, category:'trend', name:'TEMA 20',           param:'TEMA 20',     value:ma(0.20),  signal:bsig() },
    { id:39, category:'trend', name:'McGinley Dynamic',  param:'MD 14',       value:ma(0.35),  signal:bsig() },
    { id:40, category:'trend', name:'ALMA 20',           param:'ALMA 20',     value:ma(0.27),  signal:bsig() },
    { id:41, category:'trend', name:'Ichimoku Cloud',    param:'Tenkan/Kijun',value:ichi,      signal:direction==='BUY'?'BUY':direction==='SELL'?'SELL':'NEUTRAL' },
    { id:42, category:'trend', name:'Supertrend',        param:'ST 10/3',     value:supert,    signal:direction==='BUY'?'BUY':direction==='SELL'?'SELL':'NEUTRAL' },
    { id:43, category:'trend', name:'Parabolic SAR',     param:'SAR',         value:psar,      signal:direction==='BUY'?'BUY':direction==='SELL'?'SELL':'NEUTRAL' },
    { id:44, category:'trend', name:'ADX',               param:'ADX 14',      value:fmt(adx),  signal:adx>25?bsig():'NEUTRAL' },
    { id:45, category:'trend', name:'+DI',               param:'DI 14',       value:fmt(plusDi), signal:sig(plusDi,28,15) },
    { id:46, category:'trend', name:'-DI',               param:'DI 14',       value:fmt(minusDi),signal:sig(minusDi,28,15,true) },
    { id:47, category:'trend', name:'Aroon',             param:'Up / Down',   value:`${fmt(aroonUp)} / ${fmt(aroonDn)}`, signal:sig(aroonOsc,30,-30) },
    { id:48, category:'trend', name:'Aroon Oscillator',  param:'Aroon Osc',   value:fmt(aroonOsc), signal:sig(aroonOsc,30,-30) },
    { id:49, category:'trend', name:'Vortex Indicator',  param:'VI+ / VI-',   value:`${fmt(viPlus,2)} / ${fmt(viMinus,2)}`, signal:sig(viPlus-viMinus,0.1,-0.1) },
    { id:50, category:'trend', name:'Choppiness Index',  param:'CHOP 14',     value:fmt(chop), signal:chop<50?bsig():'NEUTRAL' },
    // ── 51–75 Volatility ──
    { id:51, category:'volatility', name:'ATR',                  param:'ATR 14',     value:fmtP(atr),                    signal:'NEUTRAL' },
    { id:52, category:'volatility', name:'ATR%',                 param:'ATR %',      value:fmt(atrPct,2)+'%',             signal:'NEUTRAL' },
    { id:53, category:'volatility', name:'Bollinger Bands',      param:'BB 20/2',    value:`${fmtP(bbU)} / ${fmtP(bbL)}`,signal:bsig(0.65) },
    { id:54, category:'volatility', name:'BB Width',             param:'BB Width',   value:fmt(bbW,2)+'%',                signal:'NEUTRAL' },
    { id:55, category:'volatility', name:'Bollinger %B',         param:'%B',         value:fmt(bbPctB,2),                 signal:sig(bbPctB,0.65,0.35) },
    { id:56, category:'volatility', name:'Keltner Channels',     param:'KC 20/2',    value:fmtP(bp*(1+mo*0.3+rv(0.005))), signal:bsig(0.65) },
    { id:57, category:'volatility', name:'Donchian Channels',    param:'DC 20',      value:fmtP(bp*(1+mo*0.4+rv(0.007))), signal:bsig(0.65) },
    { id:58, category:'volatility', name:'StdDev',               param:'StdDev 20',  value:fmt(0.5+rng()*8,2)+'%',        signal:'NEUTRAL' },
    { id:59, category:'volatility', name:'Historical Volatility',param:'HV 20',      value:fmt(10+rng()*40,1)+'%',        signal:'NEUTRAL' },
    { id:60, category:'volatility', name:'Chaikin Volatility',   param:'CV',         value:fmt(-20+rng()*60,1)+'%',       signal:'NEUTRAL' },
    { id:61, category:'volatility', name:'Mass Index',           param:'MI 25',      value:fmt(mi,2),                     signal:mi>27?'SELL':'NEUTRAL' },
    { id:62, category:'volatility', name:'Ulcer Index',          param:'UI 14',      value:fmt(ui,2),                     signal:'NEUTRAL' },
    { id:63, category:'volatility', name:'Volatility Stop',      param:'VSTOP',      value:fmtP(bp*(1+mo*0.25+rv(0.004))),signal:bsig() },
    { id:64, category:'volatility', name:'Projection Oscillator',param:'PO',         value:fmt(Math.max(0,Math.min(100,lerp(20,80,bias)+rv(5)))), signal:bsig() },
    { id:65, category:'volatility', name:'Relative Volatility',  param:'RVI',        value:fmt(Math.max(0,Math.min(100,lerp(30,70,bias)+rv(5)))), signal:bsig() },
    { id:66, category:'volatility', name:'ATR Bands',            param:'ATR Bands',  value:fmtP(bp*(1+mo*0.2+rv(0.004))), signal:bsig() },
    { id:67, category:'volatility', name:'SE Bands',             param:'SE Bands',   value:fmtP(bp*(1+mo*0.18+rv(0.004))),signal:bsig() },
    { id:68, category:'volatility', name:'FRAMA',                param:'FRAMA',      value:ma(0.3),                       signal:bsig() },
    { id:69, category:'volatility', name:'HV Percentile',        param:'HV %ile',    value:fmt(20+rng()*60,0)+'%',        signal:'NEUTRAL' },
    { id:70, category:'volatility', name:'Volatility Ratio',     param:'VR',         value:fmt(0.4+rng()*2.5,2),          signal:'NEUTRAL' },
    { id:71, category:'volatility', name:'Norm. ATR',            param:'NATR',       value:fmt(0.5+rng()*8,2)+'%',        signal:'NEUTRAL' },
    { id:72, category:'volatility', name:'True Range',           param:'TR',         value:fmt(0.1+rng()*1.5,3)+'%',      signal:'NEUTRAL' },
    { id:73, category:'volatility', name:'Parkinson Vol.',       param:'PV',         value:fmt(5+rng()*40,1)+'%',         signal:'NEUTRAL' },
    { id:74, category:'volatility', name:'Garman-Klass',         param:'GK',         value:fmt(5+rng()*40,1)+'%',         signal:'NEUTRAL' },
    { id:75, category:'volatility', name:'Rogers-Satchell',      param:'RS',         value:fmt(5+rng()*40,1)+'%',         signal:'NEUTRAL' },
    // ── 76–100 Volume / Money Flow ──
    { id:76,  category:'volume', name:'Volume',              param:'Volume',      value:fmtK(vol),                                                      signal:bsig() },
    { id:77,  category:'volume', name:'Volume SMA',          param:'VMA 20',      value:fmtK(volSma),                                                   signal:bsig() },
    { id:78,  category:'volume', name:'OBV',                 param:'OBV',         value:fmtK(obv),                                                      signal:bsig() },
    { id:79,  category:'volume', name:'VWAP',                param:'VWAP',        value:fmtP(bp*(1+(rng()-0.5)*0.01)),                                  signal:bsig() },
    { id:80,  category:'volume', name:'Anchored VWAP',       param:'AVWAP',       value:fmtP(bp*(1+(rng()-0.5)*0.015)),                                 signal:bsig() },
    { id:81,  category:'volume', name:'Money Flow Index',    param:'MFI 14',      value:fmt(mfiVolV),                                                   signal:sig(mfiVolV,60,40) },
    { id:82,  category:'volume', name:'Chaikin MF',          param:'CMF 20',      value:fmt(cmfV,3),                                                    signal:sig(cmfV,0.1,-0.1) },
    { id:83,  category:'volume', name:'Chaikin Oscillator',  param:'CO',          value:fmtK(coV),                                                      signal:sig(coV,50000,-50000) },
    { id:84,  category:'volume', name:'Accum/Distribution',  param:'A/D',         value:fmtK(Math.round((rng()-0.5)*1e9)),                               signal:bsig() },
    { id:85,  category:'volume', name:'Force Index',         param:'FI 13',       value:fmtK(Math.round((rng()-0.5)*1.5e9)),                             signal:sig(Math.round((rng()-0.5)*1.5e9),1e8,-1e8) },
    { id:86,  category:'volume', name:'Ease of Movement',    param:'EMV 14',      value:fmt(emvV,1),                                                    signal:sig(emvV,20,-20) },
    { id:87,  category:'volume', name:'Volume Price Trend',  param:'VPT',         value:fmtK(Math.round((rng()-0.5)*8e8)),                               signal:bsig() },
    { id:88,  category:'volume', name:'Neg. Volume Index',   param:'NVI',         value:fmtK(12000+rng()*5000),                                         signal:bsig() },
    { id:89,  category:'volume', name:'Pos. Volume Index',   param:'PVI',         value:fmtK(12000+rng()*5000),                                         signal:bsig() },
    { id:90,  category:'volume', name:'Klinger Oscillator',  param:'KO',          value:fmtK(Math.round((rng()-0.5)*8e5)),                               signal:sig(Math.round((rng()-0.5)*8e5),50000,-50000) },
    { id:91,  category:'volume', name:'Money Flow',          param:'MF',          value:fmtK(Math.round((rng()-0.5)*8e5)),                               signal:bsig() },
    { id:92,  category:'volume', name:'VWMA Diff',           param:'VWMA Diff',   value:fmt(vwmaDiff,2)+'%',                                            signal:sig(vwmaDiff,2,-2) },
    { id:93,  category:'volume', name:'Price Volume Rank',   param:'PVR',         value:fmt(pvr,0),                                                     signal:bsig() },
    { id:94,  category:'volume', name:'Volume Oscillator',   param:'VO',          value:fmt(voV,1)+'%',                                                 signal:sig(voV,20,-20) },
    { id:95,  category:'volume', name:'Relative Volume',     param:'RVOL',        value:fmt(rvol,2)+'x',                                                signal:rvol>1.5?bsig():'NEUTRAL' },
    { id:96,  category:'volume', name:'Accum Swing Index',   param:'ASI',         value:fmt(asi,0),                                                     signal:sig(asi,500,-500) },
    { id:97,  category:'volume', name:'Swing Index',         param:'SI',          value:fmt(siV,1),                                                     signal:sig(siV,20,-20) },
    { id:98,  category:'volume', name:'Elder Force Index',   param:'EFI',         value:fmtK(Math.round((rng()-0.5)*1.5e9)),                             signal:bsig() },
    { id:99,  category:'volume', name:'Market Facilitation', param:'MFI',         value:fmt(0.5+rng()*8,3),                                             signal:bsig() },
    { id:100, category:'volume', name:'Demand Index',        param:'DI',          value:fmt(di100,2),                                                   signal:sig(di100,1,-1) },
  ]
}

const PAIR_FLAGS: Record<string, [string, string, string, string]> = {
  'EUR/USD': ['EU', 'eu', 'US', 'us'], 'GBP/USD': ['UK', 'gb', 'US', 'us'],
  'USD/JPY': ['US', 'us', 'JP', 'jp'], 'XAU/USD': ['Gold', 'xf', 'US', 'us'],
  'AUD/USD': ['AU', 'au', 'US', 'us'], 'USD/CHF': ['US', 'us', 'CH', 'ch'],
  'GBP/JPY': ['UK', 'gb', 'JP', 'jp'], 'NZD/USD': ['NZ', 'nz', 'US', 'us'],
  'USD/CAD': ['US', 'us', 'CA', 'ca'], 'EUR/GBP': ['EU', 'eu', 'UK', 'gb'],
  'EUR/JPY': ['EU', 'eu', 'JP', 'jp'], 'OIL/USD': ['Oil', 'xf', 'US', 'us'],
  'USD/TRY': ['US', 'us', 'TR', 'tr'], 'EUR/CHF': ['EU', 'eu', 'CH', 'ch'],
  'AUD/CAD': ['AU', 'au', 'CA', 'ca'], 'USD/ZAR': ['US', 'us', 'ZA', 'za'],
  'USD/NOK': ['US', 'us', 'NO', 'no'], 'GBP/CHF': ['UK', 'gb', 'CH', 'ch'],
  'EUR/AUD': ['EU', 'eu', 'AU', 'au'], 'XAG/USD': ['Silver', 'xf', 'US', 'us'],
}

const FUND_TEMPLATES: Array<{ cat: string; name: string; unit: string; baseBuy: number; baseSell: number; baseNeutral: number; spread: number; fmt: (n: number) => string }> = [
  { cat: 'macro',      name: 'GDP Growth (YoY)',        unit: '%',  baseBuy: 3.2,   baseSell: 0.4,   baseNeutral: 1.8,  spread: 0.5,  fmt: n => n.toFixed(1) + '%' },
  { cat: 'macro',      name: 'GDP Growth (QoQ)',        unit: '%',  baseBuy: 0.9,   baseSell: -0.2,  baseNeutral: 0.3,  spread: 0.2,  fmt: n => n.toFixed(1) + '%' },
  { cat: 'inflation',  name: 'CPI (YoY)',               unit: '%',  baseBuy: 2.5,   baseSell: 6.8,   baseNeutral: 3.2,  spread: 0.3,  fmt: n => n.toFixed(1) + '%' },
  { cat: 'inflation',  name: 'CPI (MoM)',               unit: '%',  baseBuy: 0.3,   baseSell: 0.7,   baseNeutral: 0.2,  spread: 0.1,  fmt: n => n.toFixed(2) + '%' },
  { cat: 'inflation',  name: 'Core CPI (YoY)',          unit: '%',  baseBuy: 2.3,   baseSell: 5.4,   baseNeutral: 3.1,  spread: 0.3,  fmt: n => n.toFixed(1) + '%' },
  { cat: 'rates',      name: 'Central Bank Rate',       unit: '%',  baseBuy: 4.75,  baseSell: 2.25,  baseNeutral: 3.50, spread: 0.25, fmt: n => n.toFixed(2) + '%' },
  { cat: 'rates',      name: 'Government Bond 10Y',     unit: '%',  baseBuy: 4.85,  baseSell: 3.10,  baseNeutral: 3.95, spread: 0.2,  fmt: n => n.toFixed(2) + '%' },
  { cat: 'employment', name: 'Unemployment Rate',       unit: '%',  baseBuy: 3.6,   baseSell: 7.2,   baseNeutral: 4.8,  spread: 0.3,  fmt: n => n.toFixed(1) + '%' },
  { cat: 'employment', name: 'Employment Change',       unit: 'K',  baseBuy: 220,   baseSell: -45,   baseNeutral: 80,   spread: 30,   fmt: n => (n > 0 ? '+' : '') + Math.round(n) + 'K' },
  { cat: 'employment', name: 'Labor Force Part. Rate',  unit: '%',  baseBuy: 63.5,  baseSell: 58.2,  baseNeutral: 61.0, spread: 0.5,  fmt: n => n.toFixed(1) + '%' },
  { cat: 'sentiment',  name: 'PMI Manufacturing',       unit: '',   baseBuy: 54.2,  baseSell: 46.8,  baseNeutral: 50.1, spread: 1.2,  fmt: n => n.toFixed(1) },
  { cat: 'sentiment',  name: 'PMI Services',            unit: '',   baseBuy: 56.1,  baseSell: 47.3,  baseNeutral: 51.4, spread: 1.5,  fmt: n => n.toFixed(1) },
  { cat: 'sentiment',  name: 'PMI Composite',           unit: '',   baseBuy: 55.4,  baseSell: 47.1,  baseNeutral: 51.0, spread: 1.3,  fmt: n => n.toFixed(1) },
  { cat: 'sentiment',  name: 'Consumer Confidence',     unit: '',   baseBuy: 108.5, baseSell: 82.4,  baseNeutral: 96.0, spread: 3.5,  fmt: n => n.toFixed(1) },
  { cat: 'sentiment',  name: 'Business Confidence',     unit: '',   baseBuy: 104.2, baseSell: 88.5,  baseNeutral: 97.3, spread: 2.8,  fmt: n => n.toFixed(1) },
  { cat: 'trade',      name: 'Trade Balance',           unit: 'B',  baseBuy: 8.4,   baseSell: -22.6, baseNeutral: -5.1, spread: 2.5,  fmt: n => (n > 0 ? '+' : '') + n.toFixed(1) + 'B' },
  { cat: 'trade',      name: 'Current Account (GDP)',   unit: '%',  baseBuy: 3.2,   baseSell: -4.8,  baseNeutral: 0.5,  spread: 0.5,  fmt: n => (n > 0 ? '+' : '') + n.toFixed(1) + '%' },
  { cat: 'trade',      name: 'Export Growth (YoY)',     unit: '%',  baseBuy: 6.8,   baseSell: -3.2,  baseNeutral: 1.5,  spread: 1.2,  fmt: n => (n > 0 ? '+' : '') + n.toFixed(1) + '%' },
  { cat: 'macro',      name: 'Retail Sales (MoM)',      unit: '%',  baseBuy: 0.8,   baseSell: -0.5,  baseNeutral: 0.1,  spread: 0.2,  fmt: n => (n > 0 ? '+' : '') + n.toFixed(2) + '%' },
  { cat: 'macro',      name: 'Industrial Production',   unit: '%',  baseBuy: 2.4,   baseSell: -1.8,  baseNeutral: 0.3,  spread: 0.4,  fmt: n => (n > 0 ? '+' : '') + n.toFixed(1) + '%' },
  { cat: 'inflation',  name: 'PPI (YoY)',               unit: '%',  baseBuy: 2.1,   baseSell: 8.4,   baseNeutral: 3.6,  spread: 0.5,  fmt: n => n.toFixed(1) + '%' },
  { cat: 'macro',      name: 'Housing Starts',          unit: 'K',  baseBuy: 1580,  baseSell: 890,   baseNeutral: 1220, spread: 80,   fmt: n => Math.round(n) + 'K' },
  { cat: 'rates',      name: 'M2 Money Supply (YoY)',   unit: '%',  baseBuy: 5.4,   baseSell: 12.8,  baseNeutral: 7.2,  spread: 0.8,  fmt: n => n.toFixed(1) + '%' },
  { cat: 'macro',      name: 'Durable Goods Orders',    unit: '%',  baseBuy: 1.8,   baseSell: -2.4,  baseNeutral: 0.2,  spread: 0.4,  fmt: n => (n > 0 ? '+' : '') + n.toFixed(1) + '%' },
  { cat: 'sentiment',  name: 'Economic Surprise Index', unit: '',   baseBuy: 42.6,  baseSell: -38.4, baseNeutral: 5.2,  spread: 6.0,  fmt: n => (n > 0 ? '+' : '') + n.toFixed(1) },
  { cat: 'macro',      name: 'Government Debt/GDP',     unit: '%',  baseBuy: 68.4,  baseSell: 115.2, baseNeutral: 88.5, spread: 3.0,  fmt: n => n.toFixed(1) + '%' },
  { cat: 'trade',      name: 'FDI (Net)',                unit: 'B',  baseBuy: 12.4,  baseSell: -6.8,  baseNeutral: 3.2,  spread: 2.0,  fmt: n => (n > 0 ? '+' : '') + n.toFixed(1) + 'B' },
  { cat: 'rates',      name: 'Real Interest Rate',      unit: '%',  baseBuy: 2.8,   baseSell: -1.4,  baseNeutral: 0.5,  spread: 0.3,  fmt: n => (n > 0 ? '+' : '') + n.toFixed(2) + '%' },
  { cat: 'sentiment',  name: 'Inflation Expectations',  unit: '%',  baseBuy: 2.2,   baseSell: 5.6,   baseNeutral: 3.1,  spread: 0.3,  fmt: n => n.toFixed(1) + '%' },
  { cat: 'macro',      name: 'GDP Deflator',            unit: '%',  baseBuy: 2.3,   baseSell: 5.9,   baseNeutral: 3.5,  spread: 0.4,  fmt: n => n.toFixed(1) + '%' },
]

const PERIODS = ['Q2 2026', 'Q1 2026', 'Jun 2026', 'May 2026', 'Jul 2026', 'Q2 2026', 'Jun 2026']

function generateFundamentals(direction: 'BUY' | 'SELL' | 'WAIT', pair: string): FundamentalDatum[] {
  const pairSeed = pair.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)
  const rng = makeRng(((Date.now() >> 1) & 0xfffff) ^ pairSeed ^ 0xabcd)

  const bias = direction === 'BUY'  ? 0.72 + rng() * 0.18
             : direction === 'SELL' ? 0.08 + rng() * 0.20
             :                        0.40 + rng() * 0.20

  const info = PAIR_FLAGS[pair] ?? ['Base', 'eu', 'Quote', 'us']
  const [baseName, baseFlag, quoteName, quoteFlag] = info

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const rv = (s: number) => (rng() - 0.5) * 2 * s

  const result: FundamentalDatum[] = []
  let id = 1

  // For each template, produce one row for base currency and one for quote
  for (const tpl of FUND_TEMPLATES) {
    const isQuoteCurrency = id % 2 === 0
    const country = isQuoteCurrency ? quoteName : baseName
    const flag    = isQuoteCurrency ? quoteFlag : baseFlag
    // Base currency BUY = favorable for base → positive bias
    // Quote currency BUY = unfavorable for quote (base still goes up)
    const itemBias = isQuoteCurrency ? 1 - bias : bias

    const actual   = lerp(tpl.baseSell, tpl.baseBuy, itemBias) + rv(tpl.spread * 0.4)
    const forecast = actual + rv(tpl.spread * 0.35)
    const previous = lerp(tpl.baseSell, tpl.baseBuy, itemBias + rv(0.15)) + rv(tpl.spread * 0.3)

    const vsForecaast = actual - forecast
    const indSig: 'BUY' | 'SELL' | 'NEUTRAL' =
      Math.abs(vsForecaast) < tpl.spread * 0.2 ? 'NEUTRAL'
      : (vsForecaast > 0) === !isQuoteCurrency ? 'BUY' : 'SELL'

    result.push({
      id,
      country,
      flag,
      name:     tpl.name,
      period:   PERIODS[id % PERIODS.length],
      actual:   tpl.fmt(actual),
      forecast: tpl.fmt(forecast),
      previous: tpl.fmt(previous),
      signal:   indSig,
    })

    id++
    if (id > 30) break
  }

  return result
}

const VOLUME_TEMPLATES: Array<{ exchange: string; instrument: (pair: string) => string; baseVol: number; unit: string }> = [
  { exchange: 'CME Group',        instrument: p => `${p} Futures`,           baseVol: 145000,  unit: 'lots' },
  { exchange: 'CME Group',        instrument: p => `${p} Open Interest`,      baseVol: 680000,  unit: 'lots' },
  { exchange: 'CME Group',        instrument: p => `${p} Options`,            baseVol: 38000,   unit: 'contracts' },
  { exchange: 'ICE Futures',      instrument: p => `${p} Futures`,            baseVol: 92000,   unit: 'lots' },
  { exchange: 'ICE Futures',      instrument: p => `${p} Open Interest`,      baseVol: 420000,  unit: 'lots' },
  { exchange: 'Euronext',         instrument: p => `${p} Spot`,               baseVol: 54000,   unit: 'M USD' },
  { exchange: 'EBS Platform',     instrument: p => `${p} 24h Volume`,         baseVol: 8400,    unit: 'M USD' },
  { exchange: 'Reuters Matching', instrument: p => `${p} 24h Volume`,         baseVol: 6200,    unit: 'M USD' },
  { exchange: 'LMAX Exchange',    instrument: p => `${p} Volume`,             baseVol: 3100,    unit: 'M USD' },
  { exchange: 'Hotspot FX',       instrument: p => `${p} Volume`,             baseVol: 2800,    unit: 'M USD' },
  { exchange: 'Currenex',         instrument: p => `${p} Volume`,             baseVol: 2400,    unit: 'M USD' },
  { exchange: 'FXall',            instrument: p => `${p} Volume`,             baseVol: 1900,    unit: 'M USD' },
  { exchange: 'Bloomberg FX',     instrument: p => `${p} Volume`,             baseVol: 3600,    unit: 'M USD' },
  { exchange: 'CME Group',        instrument: _ => 'Net Speculative Pos.',    baseVol: 42000,   unit: 'contracts' },
  { exchange: 'COT Report',       instrument: _ => 'Non-Commercial Long',     baseVol: 185000,  unit: 'contracts' },
  { exchange: 'COT Report',       instrument: _ => 'Non-Commercial Short',    baseVol: 140000,  unit: 'contracts' },
  { exchange: 'COT Report',       instrument: _ => 'Commercial Hedgers Net',  baseVol: -28000,  unit: 'contracts' },
  { exchange: 'Dark Pool',        instrument: p => `${p} Dark Volume`,        baseVol: 1200,    unit: 'M USD' },
  { exchange: 'Dark Pool',        instrument: _ => 'Dark Pool Share %',       baseVol: 18,      unit: '%' },
  { exchange: 'OTC Market',       instrument: p => `${p} OTC Volume`,         baseVol: 12000,   unit: 'M USD' },
  { exchange: 'Retail Brokers',   instrument: _ => 'Retail Long Positions',   baseVol: 62,      unit: '%' },
  { exchange: 'Retail Brokers',   instrument: _ => 'Retail Short Positions',  baseVol: 38,      unit: '%' },
  { exchange: 'NYSE',             instrument: p => `${p} Block Trades`,       baseVol: 480,     unit: 'trades' },
  { exchange: 'Institutional',    instrument: _ => 'Inst. Buy Volume',        baseVol: 4800,    unit: 'M USD' },
  { exchange: 'Institutional',    instrument: _ => 'Inst. Sell Volume',       baseVol: 4200,    unit: 'M USD' },
  { exchange: 'CME Group',        instrument: p => `${p} Buy/Sell Ratio`,     baseVol: 1.18,    unit: 'x' },
  { exchange: 'CBOE',             instrument: p => `${p} Options P/C Ratio`,  baseVol: 0.72,    unit: 'x' },
  { exchange: 'DTCC',             instrument: p => `${p} Settlement Vol.`,    baseVol: 38000,   unit: 'M USD' },
]

function generateVolumeData(direction: 'BUY' | 'SELL' | 'WAIT', pair: string): VolumeDatum[] {
  const pairSeed = pair.split('').reduce((a, c) => (a * 37 + c.charCodeAt(0)) | 0, 0)
  const rng = makeRng(((Date.now() >> 2) & 0xfffff) ^ pairSeed ^ 0x1234)

  const bias = direction === 'BUY'  ? 0.70 + rng() * 0.20
             : direction === 'SELL' ? 0.08 + rng() * 0.20
             :                        0.40 + rng() * 0.20

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const rv = (s: number) => (rng() - 0.5) * 2 * s

  const fmtVol = (v: number, unit: string) => {
    if (unit === '%' || unit === 'x') return v.toFixed(unit === 'x' ? 2 : 1) + unit
    const abs = Math.abs(v)
    if (abs >= 1000000) return (v / 1000000).toFixed(2) + 'M'
    if (abs >= 1000)    return (v / 1000).toFixed(1) + 'K'
    return Math.round(v).toString()
  }

  return VOLUME_TEMPLATES.map((tpl, idx) => {
    const volBias = idx % 3 === 2 ? 1 - bias : bias
    const vol    = tpl.baseVol * (0.7 + lerp(0.3, 1.5, volBias) + rv(0.2))
    const chgPct = lerp(-8, 18, bias) + rv(4)
    const chgStr = (chgPct >= 0 ? '+' : '') + chgPct.toFixed(1) + '%'

    const isNeutral = Math.abs(chgPct) < 3
    const signal: 'BUY' | 'SELL' | 'NEUTRAL' = isNeutral ? 'NEUTRAL' : chgPct > 0 ? 'BUY' : 'SELL'

    return {
      id:         idx + 1,
      exchange:   tpl.exchange,
      instrument: tpl.instrument(pair),
      volume:     fmtVol(vol, tpl.unit),
      change:     chgStr,
      signal,
    }
  })
}

function mkRng(seed: number) {
  let s = (seed * 1664525 + 1013904223) & 0x7fffffff
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff }
}

interface Candle { o: number; h: number; l: number; c: number }

function buildCandles(direction: 'BUY' | 'SELL' | 'WAIT', seed: number): Candle[] {
  const rng = mkRng(seed)
  const N = 30
  const candles: Candle[] = []
  let price = 100
  for (let i = 0; i < N; i++) {
    const trend = i >= N - 6
      ? (direction === 'BUY' ? 0.55 : direction === 'SELL' ? -0.55 : 0)
      : (rng() - 0.5) * 0.2
    const open = price
    const move = (rng() - 0.48 + trend) * 2.8
    const close = open + move
    const wick = rng() * 1.4
    const high = Math.max(open, close) + wick
    const low  = Math.min(open, close) - rng() * 1.2
    candles.push({ o: open, h: high, l: low, c: close })
    price = close
  }
  return candles
}

const TV_SYMBOL: Record<string, string> = {
  'BTC/USD': 'BINANCE:BTCUSDT', 'ETH/USD': 'BINANCE:ETHUSDT',
  'BNB/USD': 'BINANCE:BNBUSDT', 'XRP/USD': 'BINANCE:XRPUSDT',
  'SOL/USD': 'BINANCE:SOLUSDT', 'ADA/USD': 'BINANCE:ADAUSDT',
  'AVAX/USD': 'BINANCE:AVAXUSDT', 'DOT/USD': 'BINANCE:DOTUSDT',
  'MATIC/USD': 'BINANCE:MATICUSDT', 'LINK/USD': 'BINANCE:LINKUSDT',
  'LTC/USD': 'BINANCE:LTCUSDT', 'ATOM/USD': 'BINANCE:ATOMUSDT',
  'DOGE/USD': 'BINANCE:DOGEUSDT', 'TRX/USD': 'BINANCE:TRXUSDT',
  'EUR/USD': 'FX:EURUSD', 'GBP/USD': 'FX:GBPUSD', 'USD/JPY': 'FX:USDJPY',
  'XAU/USD': 'TVC:GOLD',  'AUD/USD': 'FX:AUDUSD', 'USD/CHF': 'FX:USDCHF',
  'GBP/JPY': 'FX:GBPJPY', 'NZD/USD': 'FX:NZDUSD', 'USD/CAD': 'FX:USDCAD',
  'EUR/GBP': 'FX:EURGBP', 'EUR/JPY': 'FX:EURJPY', 'OIL/USD': 'TVC:USOIL',
  'USD/TRY': 'FX:USDTRY', 'EUR/CHF': 'FX:EURCHF', 'AUD/CAD': 'FX:AUDCAD',
  'USD/ZAR': 'FX:USDZAR', 'USD/NOK': 'FX:USDNOK', 'GBP/CHF': 'FX:GBPCHF',
  'EUR/AUD': 'FX:EURAUD', 'XAG/USD': 'TVC:SILVER',
}

const TV_INTERVAL: Record<string, string> = {
  M1: '1',
  M2: '2',
  M3: '3',
  M4: '4',
  M5: '5',
  M10: '10',
  M12: '12',
  M15: '15',
  M20: '20',
  M30: '30',
  H1: '60',
  H2: '120',
  H3: '180',
  H4: '240',
  H6: '360',
  H8: '480',
  H12: '720',
  D1: 'D',
  W1: 'W',
  MN: 'M',
}

function TradingViewWidget({ pair, timeframe = 'D1' }: { pair: string; timeframe?: string }) {
  const symbol = TV_SYMBOL[pair] ?? `FX:${pair.replace('/', '')}`
  const encoded = encodeURIComponent(symbol)
  const interval = TV_INTERVAL[timeframe] ?? 'D'
  const src = `https://s.tradingview.com/widgetembed/?symbol=${encoded}&interval=${interval}&hidesidetoolbar=1&hidetoptoolbar=0&locale=ru&theme=dark&style=1&timezone=Etc%2FUTC&hide_legend=0&hide_volume=0&allow_symbol_change=1&save_image=0&studies=%5B%5D&show_popup_button=0`

  return (
    <iframe
      src={src}
      style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      scrolling="no"
      allowFullScreen={true}
      title={`TradingView ${pair}`}
    />
  )
}

function PromptTradingView({ pair, timeframe }: { pair: string; timeframe: string }) {
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!fullscreen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [fullscreen])

  return (
    <>
      <div className="prompt-chart">
        <TradingViewWidget pair={pair} timeframe={timeframe} />
        <button
          type="button"
          className="prompt-chart-open"
          onClick={() => setFullscreen(true)}
          aria-label={`Открыть график ${pair} на всю страницу`}
          title="Открыть график на всю страницу"
        >
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {fullscreen && (
        <div className="prompt-chart-fullscreen" role="dialog" aria-modal="true" aria-label={`График TradingView ${pair}`}>
          <div className="prompt-chart-fullscreen-header">
            <div className="prompt-chart-fullscreen-title">
              <PairFlag pair={pair} size={18} />
              <span>{pair}</span>
              <span className="prompt-chart-timeframe">{timeframe}</span>
            </div>
            <button
              type="button"
              className="prompt-chart-close"
              onClick={() => setFullscreen(false)}
              aria-label="Закрыть полноэкранный график"
              title="Свернуть график"
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 6h4V2M14 6h-4V2M2 10h4v4M14 10h-4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="prompt-chart-fullscreen-body">
            <TradingViewWidget pair={pair} timeframe={timeframe} />
          </div>
        </div>
      )}
    </>
  )
}

const AUTH_PALETTE = {
  background: '#0B0B12',
  accent: '#8B7CFF',
  accentHover: '#A194FF',
  accentText: '#B9AFFF',
  cyanText: '#8EDDF7',
  onAccent: '#0D0A24',
  accentSoft: 'rgba(139,124,255,0.16)',
  accentBorder: 'rgba(139,124,255,0.35)',
  card: '#12121C',
  text: '#EDEBFA',
  muted: '#9A98B5',
  border: '#242436',
} as const

function AuthModal({ onClose, onAuth, onOpenLegal, initialTab = 'login' }: { onClose: () => void; onAuth: (user: AuthUser) => void; onOpenLegal?: () => void; initialTab?: 'login' | 'register' }) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [telegram, setTelegram] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (tab === 'register' && password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }
    if (tab === 'register' && !telegram.trim()) {
      setError('Укажите ваш Telegram в формате @username')
      return
    }
    if (tab === 'register' && !/^@[a-zA-Z0-9_]{3,}$/.test(telegram.trim())) {
      setError('Telegram должен быть в формате @username (минимум 3 символа)')
      return
    }
    if (tab === 'register' && !termsAccepted) {
      setError('Необходимо принять условия платформы')
      return
    }
    setLoading(true)
    try {
      const user = tab === 'register'
        ? await register({ name: name.trim(), email: email.trim(), telegram: telegram.trim(), password, termsAccepted })
        : await login(email.trim(), password)
      onAuth(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сервера')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    background: AUTH_PALETTE.background,
    border: `1px solid ${AUTH_PALETTE.border}`,
    borderRadius: '7px',
    padding: '0 14px',
    color: AUTH_PALETTE.text,
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  }

  const isDisabled = loading || (tab === 'register' && !termsAccepted)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100dvh',
        padding: '16px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="message-fade auth-modal"
        style={{
          width: '100%', maxWidth: 420,
          background: AUTH_PALETTE.card,
          border: `1px solid ${AUTH_PALETTE.border}`,
          borderRadius: '12px',
          maxHeight: 'calc(100dvh - 32px)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          boxSizing: 'border-box',
          boxShadow: '0 32px 90px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(139, 124, 255, 0.05)',
        }}
      >
        {/* Modal header */}
        <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <Binum_LOGO size={26} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '17px', color: AUTH_PALETTE.text, letterSpacing: '-0.2px' }}>Trading Prompt</span>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid transparent', cursor: 'pointer',
            color: AUTH_PALETTE.muted, width: 30, height: 30, borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s, border-color 0.15s, color 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = AUTH_PALETTE.background; e.currentTarget.style.borderColor = AUTH_PALETTE.border; e.currentTarget.style.color = AUTH_PALETTE.text }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = AUTH_PALETTE.muted }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ margin: '18px 20px 0', padding: '3px', display: 'flex', gap: '3px', background: AUTH_PALETTE.background, border: `1px solid ${AUTH_PALETTE.border}`, borderRadius: '8px' }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{
              flex: 1, height: 38,
              background: tab === t ? AUTH_PALETTE.accentSoft : 'transparent',
              border: `1px solid ${tab === t ? AUTH_PALETTE.accentBorder : 'transparent'}`,
              borderRadius: '6px',
              color: tab === t ? AUTH_PALETTE.accentText : AUTH_PALETTE.muted,
              fontSize: '13px', fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.15s',
              letterSpacing: '0.01em',
              position: 'relative',
            }}>
              {t === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {tab === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: AUTH_PALETTE.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Имя</label>
              <input
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = AUTH_PALETTE.accent; e.target.style.boxShadow = 'none' }}
                onBlur={e => { e.target.style.borderColor = AUTH_PALETTE.border; e.target.style.boxShadow = 'none' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: AUTH_PALETTE.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = AUTH_PALETTE.accent; e.target.style.boxShadow = 'none' }}
              onBlur={e => { e.target.style.borderColor = AUTH_PALETTE.border; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: AUTH_PALETTE.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Пароль</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ ...inputStyle, paddingRight: '38px' }}
                onFocus={e => { e.target.style.borderColor = AUTH_PALETTE.accent; e.target.style.boxShadow = 'none' }}
                onBlur={e => { e.target.style.borderColor = AUTH_PALETTE.border; e.target.style.boxShadow = 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 3, top: 0, bottom: 0, width: 36, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showPassword ? AUTH_PALETTE.accent : AUTH_PALETTE.muted, transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = AUTH_PALETTE.accent }}
                onMouseLeave={e => { e.currentTarget.style.color = showPassword ? AUTH_PALETTE.accent : AUTH_PALETTE.muted }}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
                )}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: AUTH_PALETTE.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Повторите пароль</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: '38px' }}
                  onFocus={e => { e.target.style.borderColor = AUTH_PALETTE.accent; e.target.style.boxShadow = 'none' }}
                  onBlur={e => { e.target.style.borderColor = AUTH_PALETTE.border; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  style={{ position: 'absolute', right: 3, top: 0, bottom: 0, width: 36, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showConfirmPassword ? AUTH_PALETTE.accent : AUTH_PALETTE.muted, transition: 'color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = AUTH_PALETTE.accent }}
                  onMouseLeave={e => { e.currentTarget.style.color = showConfirmPassword ? AUTH_PALETTE.accent : AUTH_PALETTE.muted }}
                >
                  {showConfirmPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: AUTH_PALETTE.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                Telegram
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="@username"
                  value={telegram}
                  onChange={e => {
                    let v = e.target.value
                    if (v && !v.startsWith('@')) v = '@' + v
                    setTelegram(v)
                  }}
                  required
                  style={{ ...inputStyle, paddingLeft: '36px' }}
                  onFocus={e => { e.target.style.borderColor = AUTH_PALETTE.accent; e.target.style.boxShadow = 'none' }}
                  onBlur={e => { e.target.style.borderColor = AUTH_PALETTE.border; e.target.style.boxShadow = 'none' }}
                />
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M21.8 3.3L2.3 10.8c-1.3.5-1.3 1.3-.2 1.6l4.8 1.5 1.8 5.6c.2.6.5.9 1 .9.4 0 .6-.2.9-.5l2.1-2.1 4.4 3.2c.8.4 1.4.2 1.6-.7l2.9-13.8c.3-1.2-.5-1.7-1-1.2z" fill={AUTH_PALETTE.muted} stroke={AUTH_PALETTE.muted}/></svg>
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div
              onClick={() => setTermsAccepted(v => !v)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 12px',
                background: AUTH_PALETTE.background,
                border: `1px solid ${termsAccepted ? AUTH_PALETTE.accent : AUTH_PALETTE.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
                userSelect: 'none',
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                border: `1.5px solid ${termsAccepted ? AUTH_PALETTE.accent : AUTH_PALETTE.muted}`,
                background: termsAccepted ? AUTH_PALETTE.accent : AUTH_PALETTE.background,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {termsAccepted && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2 2L7.5 2" stroke={AUTH_PALETTE.onAccent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: '12px', color: AUTH_PALETTE.muted, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                Я принимаю{' '}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onClose(); onOpenLegal?.() }}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: AUTH_PALETTE.cyanText, cursor: 'pointer', fontSize: '12px',
                    fontFamily: 'Inter, sans-serif', textDecoration: 'underline',
                    textDecorationColor: 'rgba(139, 124, 255, 0.45)',
                    transition: 'color 0.13s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = AUTH_PALETTE.text }}
                  onMouseLeave={e => { e.currentTarget.style.color = AUTH_PALETTE.cyanText }}
                >
                  условия платформы
                </button>
                {', включая Пользовательское соглашение и Политику конфиденциальности'}
              </span>
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 14px',
              background: AUTH_PALETTE.background, border: `1px solid ${AUTH_PALETTE.accent}`,
              borderRadius: '6px', fontSize: '13px', color: AUTH_PALETTE.text,
              fontFamily: 'Inter, sans-serif',
            }}>{error}</div>
          )}

          <button type="submit" disabled={isDisabled} style={{
            marginTop: '2px',
            height: 40,
            background: isDisabled ? '#191926' : AUTH_PALETTE.accent,
            border: `1px solid ${isDisabled ? '#191926' : AUTH_PALETTE.accent}`,
            borderRadius: '6px',
            color: isDisabled ? '#676582' : AUTH_PALETTE.onAccent,
            fontSize: '14px', fontWeight: 700,
            fontFamily: 'Outfit, sans-serif',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            letterSpacing: '0.02em',
          }}
            onMouseEnter={e => { if (!isDisabled) { e.currentTarget.style.background = AUTH_PALETTE.accentHover; e.currentTarget.style.borderColor = AUTH_PALETTE.accentHover } }}
            onMouseLeave={e => { if (!isDisabled) { e.currentTarget.style.background = AUTH_PALETTE.accent; e.currentTarget.style.borderColor = AUTH_PALETTE.accent } }}
          >
            {loading ? (
              <><div style={{ width: 16, height: 16, border: '2px solid rgba(11, 15, 20, 0.3)', borderTopColor: AUTH_PALETTE.background, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Подождите...</>
            ) : tab === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>

          <p style={{ fontSize: '12px', color: AUTH_PALETTE.muted, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
            {tab === 'login' ? (
              <>Нет аккаунта?{' '}
                <button type="button" onClick={() => { setTab('register'); setError('') }}
                  style={{ background: 'none', border: 'none', color: AUTH_PALETTE.cyanText, cursor: 'pointer', fontSize: '12px', padding: 0, fontFamily: 'inherit', transition: 'color 0.13s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = AUTH_PALETTE.text }}
                  onMouseLeave={e => { e.currentTarget.style.color = AUTH_PALETTE.cyanText }}
                >
                  Зарегистрироваться
                </button></>
            ) : (
              <>Уже есть аккаунт?{' '}
                <button type="button" onClick={() => { setTab('login'); setError('') }}
                  style={{ background: 'none', border: 'none', color: AUTH_PALETTE.cyanText, cursor: 'pointer', fontSize: '12px', padding: 0, fontFamily: 'inherit', transition: 'color 0.13s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = AUTH_PALETTE.text }}
                  onMouseLeave={e => { e.currentTarget.style.color = AUTH_PALETTE.cyanText }}
                >
                  Войти
                </button></>
            )}
          </p>
        </form>
      </div>
    </div>
  )
}

const MOCK_PARTNERS = [
  { id: 'p1', name: 'Александр К.', email: 'ale***@gmail.com', date: '12.07.2026', status: 'active', earned: '$8.50', plan: 'Premium 3м' },
  { id: 'p2', name: 'Мария Т.', email: 'mar***@mail.ru', date: '18.07.2026', status: 'active', earned: '$3.20', plan: 'Premium 1м' },
  { id: 'p3', name: 'Дмитрий Р.', email: 'dmi***@yandex.ru', date: '22.07.2026', status: 'pending', earned: '$0.00', plan: 'Ожидает оплаты' },
  { id: 'p4', name: 'Светлана М.', email: 'sve***@gmail.com', date: '25.07.2026', status: 'active', earned: '$19.00', plan: 'Premium 1г' },
  { id: 'p5', name: 'Игорь Л.', email: 'igo***@proton.me', date: '01.08.2026', status: 'active', earned: '$3.20', plan: 'Premium 1м' },
  { id: 'p6', name: 'Анна С.', email: 'ann***@mail.ru', date: '03.08.2026', status: 'inactive', earned: '$0.00', plan: 'Отменён' },
]

const MOCK_WITHDRAWALS = [
  { id: 'w1', date: '28.07.2026', amount: '$11.70', wallet: 'TRX···xQ8F', status: 'completed' },
  { id: 'w2', date: '04.08.2026', amount: '$8.50', wallet: 'TRX···xQ8F', status: 'processing' },
]

function PageFooter({ onNavigate, onOpenSettings }: { onNavigate?: (id: string) => void; onOpenSettings?: (sec: string) => void }) {
  const navLinks = [
    { label: 'Аккаунт',              action: () => onOpenSettings?.('account') },
    { label: 'Кредиты',              action: () => onOpenSettings?.('subscription') },
    { label: 'Настройки промпта',    action: () => onOpenSettings?.('prompt-settings') },
    { label: 'Партнёрская программа',action: () => onNavigate?.('affiliate') },
    { label: 'Поддержка и контакты', action: () => onNavigate?.('support') },
    { label: 'Вопросы и ответы',     action: () => onNavigate?.('faq') },
    { label: 'Правовая информация',  action: () => onNavigate?.('legal') },
  ]
  return (
    <footer className="authenticated-page-footer" style={{ position: 'absolute', right: 0, bottom: 0, left: 0, zIndex: 40, height: 64, borderTop: '1px solid var(--border)', background: 'var(--bg)', padding: '10px 20px', boxSizing: 'border-box' }}>
      <div style={{ width: 'min(1024px, 100%)', height: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600 }}>
          <Binum_LOGO size={20} opacity={0.72} />
          Trading Prompt
        </div>
        <nav aria-label="Навигация в подвале" style={{ display: 'flex', minWidth: 0, overflowX: 'auto', flexWrap: 'nowrap', justifyContent: 'flex-end', gap: '4px 14px', scrollbarWidth: 'none' }}>
          {navLinks.map(link => (
            <button
              key={link.label}
              type="button"
              onClick={link.action}
              style={{ flexShrink: 0, padding: '4px 0', border: 0, background: 'transparent', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontSize: '11px', cursor: 'pointer', transition: 'color 0.15s', whiteSpace: 'nowrap' }}
              onMouseEnter={event => { event.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={event => { event.currentTarget.style.color = 'var(--muted)' }}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  )
}

function EconomicCalendarPage({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted2)', padding: '4px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="var(--muted2)" strokeWidth="1.3"/>
            <path d="M5 1v3M11 1v3M1.5 6.5h13" stroke="var(--muted2)" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M4.5 10h2M4.5 12.5h2M9.5 10h2M9.5 12.5h2" stroke="var(--muted2)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>Экономический календарь</span>
        </div>
      </div>
      {/* Full-height TradingView economic calendar widget */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <iframe
          src="https://s.tradingview.com/embed-widget/events/?locale=ru#%7B%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Afalse%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22importanceFilter%22%3A%22-1%2C0%2C1%22%2C%22countryFilter%22%3A%22ar%2Cau%2Cbr%2Cca%2Ccn%2Cfr%2Cde%2Cin%2Cid%2Cit%2Cjp%2Ckr%2Cmx%2Cru%2Csa%2Cza%2Ctr%2Cgb%2Cus%2Ceu%22%7D"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          scrolling="yes"
          title="Economic Calendar"
        />
      </div>
    </div>
  )
}

type AffiliateLinkDemo = {
  id: string
  name: string
  url: string
  partnerIds: string[]
  activePartners: number
  earned: number
  pendingPayout: number
  removable: boolean
}

function AffiliatePage({ onClose, footer }: { onClose: () => void; footer?: React.ReactNode }) {
  const [section, setSection] = useState<'partners' | 'funds'>('partners')
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  const [selectedLinkId, setSelectedLinkId] = useState('all')
  const [addingLink, setAddingLink] = useState(false)
  const [newLinkName, setNewLinkName] = useState('')
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLinkDemo[]>([
    {
      id: 'standard',
      name: 'Стандартная ссылка',
      url: 'https://binum.ai/ref/USR-48291',
      partnerIds: MOCK_PARTNERS.map(partner => partner.id),
      activePartners: MOCK_PARTNERS.filter(partner => partner.status === 'active').length,
      earned: 34.90,
      pendingPayout: 22.70,
      removable: false,
    },
  ])
  const [wallet, setWallet] = useState('')
  const [walletNetwork, setWalletNetwork] = useState('TRC20')
  const [walletSaved, setWalletSaved] = useState(false)
  const selectedLink = affiliateLinks.find(link => link.id === selectedLinkId)
  const visiblePartners = selectedLink
    ? MOCK_PARTNERS.filter(partner => selectedLink.partnerIds.includes(partner.id))
    : MOCK_PARTNERS

  const handleCopy = (link: AffiliateLinkDemo) => {
    navigator.clipboard.writeText(link.url).catch(() => {})
    setCopiedLinkId(link.id)
    setTimeout(() => setCopiedLinkId(current => current === link.id ? null : current), 2000)
  }

  const handleCreateLink = () => {
    const name = newLinkName.trim()
    if (!name) return
    const id = `custom-${Date.now()}`
    setAffiliateLinks(current => [
      ...current,
      {
        id,
        name,
        url: `https://binum.ai/ref/USR-48291-${current.length + 1}`,
        partnerIds: [],
        activePartners: 0,
        earned: 0,
        pendingPayout: 0,
        removable: true,
      },
    ])
    setNewLinkName('')
    setAddingLink(false)
  }

  const handleDeleteLink = (id: string) => {
    setAffiliateLinks(current => current.filter(link => link.id !== id || !link.removable))
    setSelectedLinkId(current => current === id ? 'all' : current)
    setCopiedLinkId(current => current === id ? null : current)
  }

  const handleSaveWallet = () => {
    if (!wallet.trim()) return
    setWallet(wallet.trim())
    setWalletSaved(true)
  }

  const totalEarned = selectedLink
    ? selectedLink.earned
    : affiliateLinks.reduce((total, link) => total + link.earned, 0)
  const pendingPayout = selectedLink
    ? selectedLink.pendingPayout
    : affiliateLinks.reduce((total, link) => total + link.pendingPayout, 0)
  const activePartners = selectedLink
    ? selectedLink.activePartners
    : affiliateLinks.reduce((total, link) => total + link.activePartners, 0)

  const menuItems = [
    {
      id: 'partners' as const,
      label: 'Партнёры',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
          <circle cx="10.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M1 14c0-2.5 2-4.5 4.5-4.5M15 14c0-2.5-2-4.5-4.5-4.5M7 14c0-2.5 1.3-4 3-4s3 1.5 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'funds' as const,
      label: 'Средства',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="4" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M1 7h14" stroke="currentColor" strokeWidth="1.3"/>
          <circle cx="4.5" cy="10" r="1" fill="currentColor"/>
        </svg>
      ),
    },
  ]

  // ── Midnight Violet palette ───────────────────────────────
  const P = {
    bg:       '#0B0B12',
    surface:  '#12121C',
    card:     '#12121C',
    surface2: '#0F0F19',
    panel:    '#191926',
    text:     '#EDEBFA',
    muted:    '#9A98B5',
    mutedDim: '#676582',
    border:   '#191926',
    border2:  '#0F0F19',
    accent:   '#8B7CFF',
    accentHov:'#A194FF',
    accentDim:'#191926',
    accentBrd:'rgba(139,124,255,0.38)',
    positive: '#CFCDE3',
    shadow:   'rgba(0,0,0,0.4)',
    // button defaults
    btnBg:    '#8B7CFF',
    btnText:  '#0D0A24',
    btnBord:  '#8B7CFF',
    btnHovBg: '#A194FF',
    btnHovBord: '#A194FF',
  } as const

  return (
    <div className="message-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: P.bg }}>

      {/* Header */}
      <PageHeader
        icon={<svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 7L9.5 5M6.5 9L9.5 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>}
        title="Партнёрская программа"
        description="Приглашайте друзей и получайте 20% от их оплаты"
        onClose={onClose}
      />

      {/* Mobile tab bar */}
      <div className="affiliate-mobile-tabs" style={{ display: 'none', borderBottom: `1px solid ${P.border}`, background: P.surface, padding: '8px 16px', gap: '8px' }}>
        {menuItems.map(item => {
          const active = section === item.id
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              style={{
                flex: 1, height: 38,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                background: active ? P.btnBg : 'transparent',
                border: `1px solid ${P.btnBord}`,
                borderRadius: '6px',
                color: active ? P.btnText : P.btnBg,
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px', fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar — desktop only */}
        <div className="affiliate-sidebar" style={{
          width: 210, flexShrink: 0,
          background: P.surface,
          borderRight: `1px solid ${P.border}`,
          display: 'flex', flexDirection: 'column',
        }}>
          <nav style={{ padding: '10px 8px', flex: 1 }}>
            {menuItems.map(item => {
              const active = section === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  style={{
                    width: '100%', height: 40,
                    display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '0 11px',
                    background: active ? P.btnBg : 'transparent',
                    border: `1px solid ${active ? P.btnBord : 'transparent'}`,
                    borderRadius: '6px',
                    color: active ? P.btnText : P.muted,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px', fontWeight: active ? 600 : 500,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s', marginBottom: '3px',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#0F0F19'; e.currentTarget.style.color = P.btnBg } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = P.muted } }}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="page-body scrollable" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', boxSizing: 'border-box', minWidth: 0 }}>

          {/* PARTNERS */}
          {section === 'partners' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Referral links */}
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: P.text }}>Реферальные ссылки</div>
                    <div style={{ marginTop: '3px', fontSize: '11px', color: P.mutedDim, fontFamily: 'Inter, sans-serif' }}>Создавайте отдельную ссылку для каждого источника трафика</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddingLink(value => !value)}
                    style={{ height: 34, padding: '0 12px', border: `1px solid ${P.accentBrd}`, borderRadius: '6px', background: 'rgba(139,124,255,0.12)', color: P.accent, fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    Добавить ссылку
                  </button>
                </div>

                {addingLink && (
                  <div className="affiliate-link-create-form" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '10px', marginTop: '14px' }}>
                    <input
                      type="text"
                      value={newLinkName}
                      onChange={event => setNewLinkName(event.target.value)}
                      onKeyDown={event => { if (event.key === 'Enter') handleCreateLink() }}
                      placeholder="Введите имя, например Telegram или YouTube"
                      style={{ width: '100%', height: 38, border: `1px solid ${P.border}`, borderRadius: '6px', background: P.surface2, padding: '0 12px', color: P.text, fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateLink}
                      disabled={!newLinkName.trim()}
                      style={{ height: 38, padding: '0 16px', border: `1px solid ${newLinkName.trim() ? P.btnBord : P.border}`, borderRadius: '6px', background: newLinkName.trim() ? P.btnBg : P.accentDim, color: newLinkName.trim() ? P.btnText : P.mutedDim, fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, cursor: newLinkName.trim() ? 'pointer' : 'not-allowed' }}
                    >
                      Сохранить
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                  {affiliateLinks.map(link => (
                    <div key={link.id} className="affiliate-ref-link-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 0.7fr) minmax(0, 1.4fr) auto auto', gap: '10px', alignItems: 'center', padding: '10px 12px', border: `1px solid ${P.border}`, borderRadius: '6px', background: P.surface2 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: P.text, fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600 }}>{link.name}</div>
                        {!link.removable && <div style={{ marginTop: '2px', color: P.accent, fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Стандартная</div>}
                      </div>
                      <div title={link.url} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: P.muted, fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>{link.url}</div>
                      <button
                        type="button"
                        onClick={() => handleCopy(link)}
                        style={{ height: 30, padding: '0 10px', border: `1px solid ${P.border}`, borderRadius: '5px', background: P.card, color: copiedLinkId === link.id ? P.accent : P.muted, fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {copiedLinkId === link.id ? 'Скопировано' : 'Копировать'}
                      </button>
                      {link.removable ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteLink(link.id)}
                          aria-label={`Удалить ссылку ${link.name}`}
                          style={{ width: 30, height: 30, padding: 0, border: '1px solid rgba(239,68,68,0.28)', borderRadius: '5px', background: 'rgba(239,68,68,0.08)', color: '#EF4444', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 4h9M5 4V2.5h4V4m-5.5 0 .6 8h5.8l.6-8M5.7 6.2v3.5M8.3 6.2v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      ) : <span style={{ width: 30 }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral link filter */}
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '18px 22px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 600, color: P.mutedDim, textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: 'Inter, sans-serif' }}>
                  Показывать статистику по ссылке
                </p>
                <div style={{ width: 'min(320px, 100%)' }}>
                  <CustomSelect
                    value={selectedLinkId}
                    onChange={value => {
                      setSelectedLinkId(value)
                    }}
                    options={[
                      { label: 'Все ссылки', value: 'all' },
                      ...affiliateLinks.map(link => ({ label: link.name, value: link.id })),
                    ]}
                    dropDown
                    subdued
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="affiliate-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', width: '100%' }}>
                {[
                  {
                    label: 'Всего партнёров', value: String(visiblePartners.length), note: selectedLink ? selectedLink.name : 'по всем ссылкам', accent: false,
                    icon: <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="5" r="2.3" stroke="currentColor" strokeWidth="1.3"/><circle cx="11.5" cy="5.5" r="1.8" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 14c0-2.7 1.5-4.5 3.5-4.5s3.5 1.8 3.5 4.5M9 10c1.9 0 3.5 1.5 3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                  },
                  {
                    label: 'Активных', value: String(activePartners), note: 'приносят доход', accent: false,
                    icon: <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M2 13V9M6 13V6M10 13V8M14 13V3M1 13.5h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                  },
                  {
                    label: 'Заработано', value: `$${totalEarned.toFixed(2)}`, note: 'за весь период', accent: false,
                    icon: <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 5.5H7.2a1.7 1.7 0 0 0 0 3.4h1.6a1.7 1.7 0 0 1 0 3.4H5.5M8 3.8v1.7M8 12.3V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
                  },
                  {
                    label: 'К выплате', value: `$${pendingPayout.toFixed(2)}`, note: 'доступно сейчас', accent: true,
                    icon: <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3"/><circle cx="5" cy="10" r="1.2" fill="currentColor"/></svg>,
                  },
                ].map(stat => (
                  <div
                    key={stat.label}
                    style={{ minWidth: 0, minHeight: 116, background: stat.accent ? 'linear-gradient(145deg, rgba(255,138,107,0.12) 0%, #12121C 72%)' : 'linear-gradient(145deg, #191926 0%, #12121C 72%)', border: `1px solid ${stat.accent ? 'rgba(255,138,107,0.38)' : '#2E2E46'}`, borderRadius: '10px', padding: '17px 18px', position: 'relative', overflow: 'hidden', boxSizing: 'border-box', transition: 'border-color 0.15s, transform 0.15s, background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = stat.accent ? '#FF8A6B' : '#34344F'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = stat.accent ? 'rgba(255,138,107,0.38)' : '#2E2E46'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ position: 'absolute', top: -26, right: -20, width: 82, height: 82, borderRadius: '50%', background: stat.accent ? 'rgba(255,138,107,0.12)' : 'rgba(255,255,255,0.025)', pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '13px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: stat.accent ? '#FFB4A0' : P.mutedDim, textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: 'Inter, sans-serif', lineHeight: 1.35 }}>{stat.label}</div>
                      <div style={{ width: 30, height: 30, borderRadius: '7px', background: stat.accent ? 'rgba(255,138,107,0.12)' : '#191926', border: `1px solid ${stat.accent ? 'rgba(255,138,107,0.38)' : '#2E2E46'}`, color: stat.accent ? '#FF8A6B' : '#9A98B5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {stat.icon}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '27px', fontWeight: 700, color: stat.accent ? '#FFB4A0' : P.text, lineHeight: 1, letterSpacing: '-0.04em' }}>{stat.value}</div>
                      <div style={{ fontSize: '10px', color: P.mutedDim, fontFamily: 'Inter, sans-serif', textAlign: 'right', lineHeight: 1.3 }}>{stat.note}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Partners list */}
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '13px 22px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: P.surface }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: P.text }}>Список партнёров</span>
                  <span style={{ fontSize: '12px', color: P.mutedDim, fontFamily: 'Inter, sans-serif' }}>{visiblePartners.length} пользователей</span>
                </div>
                <div style={{ height: 'min(300px, 48vh)', overflow: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', scrollbarColor: `${P.border} ${P.surface2}`, scrollbarGutter: 'stable' }}>
                  <div style={{ position: 'sticky', top: 0, zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1.2fr 110px 120px 160px', minWidth: '824px', padding: '8px 22px', background: P.surface2, borderBottom: `1px solid ${P.border2}` }}>
                    {['Имя', 'Email', 'Дата', 'Пополнения', 'Доход'].map(h => (
                      <span key={h} style={{ fontSize: '10px', fontWeight: 600, color: P.mutedDim, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif' }}>{h}</span>
                    ))}
                  </div>
                  {visiblePartners.map((p, i) => (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 110px 120px 160px', minWidth: '824px', padding: '11px 22px', borderBottom: i < visiblePartners.length - 1 ? `1px solid ${P.border2}` : 'none', alignItems: 'center', transition: 'background 0.1s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0F0F19' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ fontSize: '13px', color: P.text, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: '12px', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>{p.email}</span>
                      <span style={{ fontSize: '12px', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>{p.date}</span>
                      <span style={{ fontSize: '12px', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                        ${(Number.parseFloat(p.earned.replace('$', '')) / 0.2).toFixed(2)}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: P.text, fontFamily: 'JetBrains Mono, monospace' }}>{p.earned}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FUNDS */}
          {section === 'funds' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Wallet */}
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="4" width="14" height="9" rx="2" stroke={P.muted} strokeWidth="1.3"/>
                    <path d="M1 7h14" stroke={P.muted} strokeWidth="1.3"/>
                    <circle cx="4.5" cy="10" r="1" fill={P.accent}/>
                  </svg>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: P.text }}>Кошелёк для вывода</span>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: P.muted, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                  {walletSaved
                    ? 'Сохранённый кошелёк используется для автоматического получения выплат.'
                    : `Укажите адрес кошелька USDT (${walletNetwork}) для автоматического получения выплат.`}
                </p>
                {walletSaved ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px', border: '1px solid rgba(76,201,240,0.35)', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(76,201,240,0.12), rgba(76,201,240,0.035))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.035)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ display: 'grid', width: 40, height: 40, flexShrink: 0, placeItems: 'center', border: '1px solid rgba(76,201,240,0.35)', borderRadius: '7px', background: 'rgba(76,201,240,0.12)', color: '#4CC9F0' }}>
                        <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <rect x="2" y="5" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.4"/>
                          <path d="M2 8.5h16" stroke="currentColor" strokeWidth="1.4"/>
                          <circle cx="6" cy="12.5" r="1.2" fill="currentColor"/>
                        </svg>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                          <span style={{ color: '#8EDDF7', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>USDT · {walletNetwork}</span>
                          <span style={{ padding: '2px 6px', border: '1px solid rgba(76,201,240,0.35)', borderRadius: '3px', background: 'rgba(76,201,240,0.12)', color: '#8EDDF7', fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em' }}>СОХРАНЁН</span>
                        </div>
                        <div title={wallet} style={{ overflow: 'hidden', color: '#8EDDF7', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {wallet}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setWalletSaved(false)
                        setWallet('')
                      }}
                      style={{ display: 'inline-flex', height: 34, flexShrink: 0, alignItems: 'center', gap: '7px', padding: '0 11px', border: '1px solid rgba(139,124,255,0.3)', borderRadius: '6px', background: 'rgba(139,124,255,0.055)', color: '#8B7CFF', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(139,124,255,0.12)'
                        e.currentTarget.style.borderColor = 'rgba(139,124,255,0.52)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(139,124,255,0.055)'
                        e.currentTarget.style.borderColor = 'rgba(139,124,255,0.3)'
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M2.5 4h9M5 4V2.5h4V4m-5.5 0 .6 8h5.8l.6-8M5.7 6.2v3.5M8.3 6.2v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Удалить
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ width: '100%', maxWidth: 240, marginBottom: '12px' }}>
                      <div style={{ marginBottom: '6px', color: P.muted, fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Сеть выплат
                      </div>
                      <CustomSelect
                        value={walletNetwork}
                        onChange={setWalletNetwork}
                        options={[
                          { label: 'TRC20 · TRON', value: 'TRC20' },
                          { label: 'ERC20 · Ethereum', value: 'ERC20' },
                          { label: 'BEP20 · BNB Smart Chain', value: 'BEP20' },
                          { label: 'Polygon', value: 'Polygon' },
                        ]}
                        dropDown
                        subdued
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        className="affiliate-wallet-input"
                        type="text" placeholder={`Адрес кошелька USDT (${walletNetwork})`} value={wallet} onChange={e => setWallet(e.target.value)}
                        style={{ flex: 1, minWidth: 0, height: 44, background: '#191926', border: '1px solid #34344F', borderRadius: '7px', padding: '0 14px', color: '#EDEBFA', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
                        onFocus={e => { e.target.style.borderColor = '#8B7CFF'; e.target.style.boxShadow = 'none' }}
                        onBlur={e => { e.target.style.borderColor = '#34344F'; e.target.style.boxShadow = 'none' }}
                      />
                      <button onClick={handleSaveWallet}
                        style={{ height: 40, padding: '0 20px', flexShrink: 0, background: P.btnBg, border: `1px solid ${P.btnBord}`, borderRadius: '6px', color: P.btnText, fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.18s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = P.btnHovBg; e.currentTarget.style.borderColor = P.btnHovBord }}
                        onMouseLeave={e => { e.currentTarget.style.background = P.btnBg; e.currentTarget.style.borderColor = P.btnBord }}
                      >
                        Сохранить
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Payout info */}
              <div style={{ background: P.surface2, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '18px 22px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '6px', background: P.card, border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <circle cx="7.5" cy="7.5" r="6" stroke={P.muted} strokeWidth="1.3"/>
                    <path d="M7.5 4.5v4M7.5 10v.5" stroke={P.accent} strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: '0 0 8px', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '13px', color: P.text }}>Условия выплат</p>
                  <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {['Выплаты производятся автоматически в момент пополнения реферала', 'Минимальная сумма вывода — нет (выплаты автоматические)', 'Комиссия за вывод от $0.01 до $2 в зависимости от сети (TRC20, ERC20, BEP20, Polygon)', 'Валюта выплат — USDT', 'Ваш реферальный доход — 50% от каждой оплаты реферала'].map((line, i) => (
                      <li key={i} style={{ fontSize: '13px', color: P.muted, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Balance tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Доступно к выводу', value: '$22.70' },
                  { label: 'Следующая выплата', value: '11.08.2026' },
                ].map(item => (
                  <div key={item.label} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', padding: '18px 20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: P.mutedDim, fontFamily: 'Inter, sans-serif', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{item.label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '24px', fontWeight: 700, color: P.text }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Withdrawal history */}
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: '8px', overflowX: 'auto', overflowY: 'hidden' }}>
                <div style={{ padding: '13px 22px', borderBottom: `1px solid ${P.border}`, background: P.surface }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: P.text }}>История выводов</span>
                </div>
                {MOCK_WITHDRAWALS.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: P.mutedDim, fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>Выводов пока не было</div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 90px', padding: '8px 22px', background: P.surface2, borderBottom: `1px solid ${P.border2}` }}>
                      {['Дата', 'Сумма', 'Кошелёк', 'Статус'].map(h => (
                        <span key={h} style={{ fontSize: '10px', fontWeight: 600, color: P.mutedDim, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif' }}>{h}</span>
                      ))}
                    </div>
                    {MOCK_WITHDRAWALS.map((w, i) => (
                      <div key={w.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 90px', padding: '12px 22px', borderBottom: i < MOCK_WITHDRAWALS.length - 1 ? `1px solid ${P.border2}` : 'none', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>{w.date}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: P.positive, fontFamily: 'JetBrains Mono, monospace' }}>{w.amount}</span>
                        <span style={{ fontSize: '12px', color: P.muted, fontFamily: 'JetBrains Mono, monospace' }}>{w.wallet}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontFamily: 'Inter, sans-serif', color: w.status === 'completed' ? P.positive : P.text }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: w.status === 'completed' ? P.accent : P.muted }} />
                          {w.status === 'completed' ? 'Выплачено' : 'В обработке'}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
          {footer}
        </div>
      </div>
    </div>
  )
}

function LegalPage({ onClose, footer }: { onClose: () => void; footer?: React.ReactNode }) {
  return (
    <div className="message-fade scrollable" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <PageHeader
        icon={<svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L2 4v4c0 3.3 2.5 5.7 6 6.5 3.5-.8 6-3.2 6-6.5V4L8 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        title="Правовая информация"
        description="Пользовательское соглашение и политика конфиденциальности"
        onClose={onClose}
      />

      {/* Content */}
      <div style={{ flex: 1, padding: '32px', maxWidth: 760, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {[
          {
            title: 'Политика конфиденциальности',
            sections: [
              { h: '1. Общие положения', p: 'Настоящая Политика конфиденциальности определяет порядок сбора, хранения, использования и защиты информации, получаемой при использовании сайта. Используя сайт, пользователь подтверждает свое согласие с настоящей Политикой.' },
              { h: '2. Какие данные мы собираем', p: 'При использовании сайта могут автоматически собираться: адрес электронной почты, имя пользователя, IP-адрес, тип устройства и браузера, данные файлов Cookie, история использования сервиса. Платёжные реквизиты банковских карт не собираются — оплата производится через сторонние платёжные сервисы.' },
              { h: '3. Цели обработки данных', p: 'Информация используется для регистрации и авторизации, предоставления доступа к сервисам, повышения качества работы, обеспечения безопасности аккаунтов, предотвращения мошенничества и технической поддержки.' },
              { h: '4. Использование файлов Cookie', p: 'Сайт использует Cookie для сохранения настроек, обеспечения корректной работы и анализа посещаемости. Пользователь может отключить Cookie в настройках браузера, однако это может повлиять на работу отдельных функций.' },
              { h: '5. Передача данных третьим лицам', p: 'Персональные данные не продаются и не передаются третьим лицам, за исключением случаев, предусмотренных законодательством, а также для работы сервисов, обеспечивающих функционирование сайта (хостинг, аналитика, обработка платежей).' },
              { h: '6. Защита информации', p: 'Администрация принимает организационные и технические меры для защиты данных пользователей от несанкционированного доступа. Однако ни один способ передачи данных через Интернет не может гарантировать абсолютную безопасность.' },
              { h: '7. Права пользователя', p: 'Пользователь вправе запросить удаление учётной записи, изменить регистрационные данные, отказаться от информационных сообщений, обратиться в поддержку по вопросам обработки персональных данных.' },
              { h: '8. Изменение политики', p: 'Администрация вправе изменять настоящую Политику без предварительного уведомления. Новая редакция вступает в силу с момента её публикации на сайте.' },
            ],
          },
          {
            title: 'Пользовательское соглашение',
            sections: [
              { h: '1. Общие положения', p: 'Настоящее Пользовательское соглашение регулирует отношения между Администрацией сайта и Пользователем. Использование сайта означает полное и безоговорочное принятие настоящего Соглашения.' },
              { h: '2. Предмет соглашения', p: 'Сайт предоставляет пользователям инструменты для сбора рыночных данных и формирования аналитических промптов, а также доступ к статистическим и информационным материалам. Все материалы предоставляются исключительно в информационных целях.' },
              { h: '3. Регистрация', p: 'Пользователь обязуется предоставлять достоверную информацию, не передавать доступ к аккаунту третьим лицам и самостоятельно обеспечивать сохранность логина и пароля. Все действия через учётную запись считаются совершёнными самим пользователем.' },
              { h: '4. Использование сервиса', p: 'Пользователь обязуется соблюдать законодательство, не использовать сайт для противоправных действий, не нарушать работу сервиса и не копировать материалы без разрешения администрации.' },
              { h: '5. Интеллектуальная собственность', p: 'Все материалы сайта, включая алгоритмы формирования промптов, дизайн, логотипы, тексты, изображения и базы данных, являются объектами интеллектуальной собственности и охраняются законодательством.' },
              { h: '6. Ограничение ответственности', p: 'Администрация не гарантирует получение прибыли при использовании сформированных промптов и не несёт ответственности за финансовые потери пользователя.' },
              { h: '7. Приостановление доступа', p: 'Администрация вправе без предварительного уведомления ограничить доступ, приостановить работу сайта или удалить учётную запись в случае нарушения настоящего Соглашения.' },
              { h: '8. Изменение соглашения', p: 'Администрация вправе изменять Соглашение в любое время. Новая редакция вступает в силу с момента публикации. Продолжение использования сайта означает согласие с новой редакцией.' },
            ],
          },
        ].map(doc => (
          <div key={doc.title} style={{ marginBottom: '40px' }}>
            <h2 style={{ margin: '0 0 20px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              {doc.title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {doc.sections.map(s => (
                <div key={s.h}>
                  <h3 style={{ margin: '0 0 6px', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{s.h}</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.65 }}>{s.p}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      {footer}
      </div>
    </div>
  )
}

const MOCK_TICKETS = [
  { id: 'TKT-001', date: '12.06.2026', subject: 'Как зарегистрироваться в партнёрской программе?', status: 'closed', reply: 'Для участия в партнёрской программе перейдите во вкладку «Партнёрская программа» и скопируйте реферальную ссылку. Никакой дополнительной регистрации не требуется.' },
  { id: 'TKT-002', date: '18.06.2026', subject: 'Почему промпт долго собирается?', status: 'closed', reply: 'Сбор рыночных данных может занять несколько секунд. Если запрос завис — попробуйте повторить через минуту. Возможна временная нагрузка на серверы.' },
  { id: 'TKT-003', date: '24.06.2026', subject: 'Хочу сменить email аккаунта', status: 'closed', reply: 'Смена email пока недоступна в самостоятельном режиме. Напишите нам в Telegram @binum_support с подтверждением личности, и мы изменим данные вручную.' },
  { id: 'TKT-004', date: '01.07.2026', subject: 'Купил 100 кредитов — как активировать?', status: 'closed', reply: 'После оплаты кредиты начисляются автоматически в течение 5 минут. Если этого не произошло, пришлите чек об оплате в поддержку.' },
  { id: 'TKT-005', date: '07.07.2026', subject: 'Хочу вернуть деньги за кредиты', status: 'closed', reply: 'Возврат средств возможен в течение 3 дней с момента покупки при условии, что купленные кредиты не были использованы. Заявка на возврат рассмотрена — средства возвращены.' },
  { id: 'TKT-006', date: '10.07.2026', subject: 'Почему в данных есть оценка SELL?', status: 'closed', reply: 'Оценки индикаторов описывают состояние рынка в момент запроса и не являются торговой рекомендацией. Итоговый промпт предназначен для самостоятельного анализа.' },
  { id: 'TKT-007', date: '15.07.2026', subject: 'Не отображается график в промпте', status: 'closed', reply: 'Попробуйте обновить страницу. Если проблема повторяется — очистите кеш браузера (Ctrl+Shift+Del). Графики загружаются динамически и могут не отображаться при слабом соединении.' },
  { id: 'TKT-008', date: '18.07.2026', subject: 'Вопрос по партнёрской программе — задержка выплаты', status: 'closed', reply: 'Ваш вопрос решён. Выплата произведена согласно условиям. Следующая автоматическая выплата — каждый понедельник.' },
  { id: 'TKT-009', date: '22.07.2026', subject: 'Хочу купить кредиты — как оплатить криптой?', status: 'answered', reply: 'Для оплаты в USDT (TRC-20) нажмите «Купить кредиты» и выберите способ оплаты «Криптовалюта». Адрес кошелька для перевода будет отображён автоматически.' },
  { id: 'TKT-010', date: '25.07.2026', subject: 'Не могу войти в аккаунт — забыл пароль', status: 'answered', reply: 'Письмо для сброса пароля отправлено на ваш email. Проверьте папку «Спам», если письмо не пришло в течение 5 минут.' },
  { id: 'TKT-011', date: '28.07.2026', subject: 'Можно ли использовать Trading Prompt на мобильном?', status: 'answered', reply: 'Да, сервис полностью адаптирован для мобильных устройств. Откройте сайт в браузере на смартфоне — всё работает без установки приложения.' },
  { id: 'TKT-012', date: '01.08.2026', subject: 'Сколько промптов можно собрать?', status: 'answered', reply: 'Каждый готовый промпт списывает один кредит. Ограничений по времени нет, пока на балансе остаются кредиты.' },
  { id: 'TKT-013', date: '05.08.2026', subject: 'Где посмотреть историю промптов?', status: 'open', reply: '' },
  { id: 'TKT-014', date: '08.08.2026', subject: 'Когда появится история промптов?', status: 'open', reply: '' },
  { id: 'TKT-015', date: '11.08.2026', subject: 'Хочу изменить реферальную ссылку', status: 'open', reply: '' },
]

function SupportPage({ onClose, footer }: { onClose: () => void; footer?: React.ReactNode }) {
  const [section, setSection] = useState<'support' | 'history'>('support')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [tickets, setTickets] = useState(MOCK_TICKETS)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    const newTicket = {
      id: `TKT-00${tickets.length + 1}`,
      date: new Date().toLocaleDateString('ru-RU').split('.').map((v, i) => i === 2 ? v.slice(-4) : v.padStart(2, '0')).join('.'),
      subject: subject.trim(),
      status: 'open',
      reply: '',
    }
    setTickets(prev => [...prev, newTicket])
    setSubject('')
    setBody('')
    setSent(true)
    setTimeout(() => setSent(false), 3500)
  }

  const statusLabel: Record<string, string> = { open: 'Открыт', answered: 'Отвечен', closed: 'Закрыт' }
  const statusDot: Record<string, string> = { open: '#9A98B5', answered: '#CFCDE3', closed: '#676582' }
  const supportMenuItems = [
    {
      id: 'support' as const,
      label: 'Поддержка',
      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 0 1 12 0v3a2 2 0 0 1-2 2h-1V8h3M2 8v5H1a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1ZM11 13c0 1-1 1.5-3 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    {
      id: 'history' as const,
      label: 'История запросов',
      icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 4.5V1.8M2.5 1.8H5.2M2.5 1.8l2.1 2.1A5.5 5.5 0 1 1 2 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 5v3.3l2.2 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
  ]

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#191926',
    border: '1px solid #34344F',
    borderRadius: '7px', padding: '10px 14px',
    color: '#EDEBFA', fontSize: '14px',
    fontFamily: 'Inter, sans-serif', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box', resize: 'none' as const,
  }

  return (
    <div className="message-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0B0B12', overflow: 'hidden' }}>

      {/* Header */}
      <PageHeader
        icon={<svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M8 11v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M6 6.5C6 5.4 6.9 4.5 8 4.5s2 .9 2 2c0 1-.6 1.5-1.3 2-.5.3-.7.7-.7 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
        title="Поддержка и контакты"
        description="Мы отвечаем в течение 2 часов"
        onClose={onClose}
      />

      <div className="support-mobile-tabs" style={{ display: 'none', flexShrink: 0, padding: '8px 14px', gap: '8px', background: '#12121C', borderBottom: '1px solid #191926' }}>
        {supportMenuItems.map(item => {
          const active = section === item.id
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              style={{ flex: 1, minWidth: 0, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '0 10px', background: active ? 'rgba(139,124,255,0.16)' : 'transparent', border: `1px solid ${active ? 'rgba(139,124,255,0.35)' : 'transparent'}`, borderRadius: '6px', color: active ? '#B9AFFF' : '#7C7A98', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: active ? 600 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div className="support-sidebar" style={{ width: 210, flexShrink: 0, background: '#12121C', borderRight: '1px solid #191926', display: 'flex', flexDirection: 'column' }}>
          <nav style={{ padding: '10px 8px', flex: 1 }}>
            {supportMenuItems.map(item => {
              const active = section === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  style={{ width: '100%', height: 40, display: 'flex', alignItems: 'center', gap: '9px', padding: '0 11px', background: active ? 'rgba(139,124,255,0.10)' : 'transparent', border: `1px solid ${active ? 'rgba(139,124,255,0.35)' : 'transparent'}`, borderRadius: '6px', color: active ? '#B9AFFF' : '#9A98B5', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: active ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s, color 0.15s', marginBottom: '3px' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#0F0F19'; e.currentTarget.style.color = '#8B7CFF' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9A98B5' } }}
                >
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="scrollable page-body support-body" style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', boxSizing: 'border-box', minWidth: 0 }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {section === 'support' && (<>

          {/* Block 1: Контакты */}
          <div className="support-card" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg, rgba(76,201,240,0.12) 0%, #12121C 48%)', border: '1px solid rgba(76,201,240,0.35)', borderRadius: '10px', padding: '24px 28px' }}>
            <div style={{ position: 'absolute', top: -90, right: -60, width: 230, height: 230, borderRadius: '50%', background: 'rgba(139,124,255,0.055)', pointerEvents: 'none' }} />
            <div className="support-contacts-header" style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '7px', color: '#8EDDF7', fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <span style={{ width: 16, height: 1, background: '#4CC9F0' }} />
                  На связи
                </div>
                <h2 style={{ margin: '0 0 5px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '19px', color: '#EDEBFA' }}>Контакты поддержки</h2>
                <p style={{ margin: 0, maxWidth: 520, fontSize: '12px', color: '#7C7A98', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>Выберите удобный способ связи или скопируйте контакт одним нажатием.</p>
              </div>
              <div className="support-contact-status" style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', background: 'rgba(76,201,240,0.12)', border: '1px solid rgba(76,201,240,0.35)', borderRadius: '6px', color: '#8EDDF7', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CC9F0', boxShadow: '0 0 10px rgba(76,201,240,0.35)' }} />
                Ответ до 2 часов
              </div>
            </div>

            <div className="support-contacts-grid" style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
              {[
                {
                  label: 'Email', value: 'support@binum.ai', sub: 'Для подробных обращений',
                  icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                },
                {
                  label: 'Telegram', value: '@binum_support', sub: 'Оперативная связь',
                  icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M14.5 2.5L1.5 7.5c-.4.17-.4.67 0 .83l2.8 1.04 1.1 3.37c.1.33.53.43.77.18l1.56-1.5 2.87 2.1c.3.2.7.05.78-.3L14.9 3c.1-.45-.33-.8-.4-.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
                },
                {
                  label: 'Сайт', value: 'binum.ai', sub: 'Работаем 9–21 МСК',
                  icon: <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><ellipse cx="8" cy="8" rx="2.5" ry="6" stroke="currentColor" strokeWidth="1.1"/><path d="M2 8h12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
                },
              ].map(contact => (
                <div key={contact.label} style={{ minWidth: 0, background: '#191926', border: '1px solid #242436', borderRadius: '9px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '13px', transition: 'background 0.15s, border-color 0.15s, transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(76,201,240,0.12)'; e.currentTarget.style.borderColor = 'rgba(76,201,240,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#191926'; e.currentTarget.style.borderColor = '#242436'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '8px', flexShrink: 0, background: 'rgba(76,201,240,0.12)', border: '1px solid rgba(76,201,240,0.35)', color: '#4CC9F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {contact.icon}
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#676582', textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: 'Inter, sans-serif' }}>{contact.label}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 500, color: '#CFCDE3', wordBreak: 'break-all', lineHeight: 1.35 }}>{contact.value}</div>
                    <div style={{ marginTop: '4px', fontSize: '10px', color: '#676582', fontFamily: 'Inter, sans-serif' }}>{contact.sub}</div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Скопировать ${contact.label}`}
                    title={`Скопировать ${contact.value}`}
                    onClick={() => navigator.clipboard.writeText(contact.value).catch(() => {})}
                    style={{ width: '100%', height: 32, background: '#12121C', border: '1px solid #2E2E46', borderRadius: '6px', color: '#9A98B5', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', transition: 'background 0.15s, border-color 0.15s, color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(76,201,240,0.12)'; e.currentTarget.style.borderColor = 'rgba(76,201,240,0.35)'; e.currentTarget.style.color = '#8EDDF7' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#12121C'; e.currentTarget.style.borderColor = '#2E2E46'; e.currentTarget.style.color = '#9A98B5' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M9 4V2.5A1.5 1.5 0 0 0 7.5 1h-5A1.5 1.5 0 0 0 1 2.5v5A1.5 1.5 0 0 0 2.5 9H4" stroke="currentColor" strokeWidth="1.2"/></svg>
                    Скопировать
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Block 2: Создать тикет */}
          <div className="support-card" style={{ background: '#12121C', border: '1px solid #191926', borderRadius: '8px', padding: '28px 32px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 4px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '17px', color: '#EDEBFA' }}>Создать тикет</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#676582', fontFamily: 'Inter, sans-serif' }}>Опишите вашу проблему — мы ответим в течение 2 часов</p>
            </div>
            {sent ? (
              <div style={{ padding: '16px 20px', background: '#0F0F19', border: '1px solid #191926', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#9A98B5" strokeWidth="1.4"/><path d="M5.5 9.5l2.5 2.5 4.5-5" stroke="#9A98B5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: '14px', color: '#EDEBFA', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Тикет отправлен. Ответим в течение 2 часов.</span>
              </div>
            ) : (
              <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#7C7A98', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px', fontFamily: 'Inter, sans-serif' }}>Тема</label>
                  <input className="support-input" type="text" placeholder="Кратко опишите вопрос" value={subject} onChange={e => setSubject(e.target.value)} required style={{ ...inputStyle, height: 44 }}
                    onFocus={e => { e.target.style.borderColor = '#8B7CFF'; e.target.style.boxShadow = 'none' }}
                    onBlur={e => { e.target.style.borderColor = '#34344F'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#7C7A98', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px', fontFamily: 'Inter, sans-serif' }}>Сообщение</label>
                  <textarea className="support-input" rows={5} placeholder="Подробно опишите проблему или вопрос..." value={body} onChange={e => setBody(e.target.value)} required style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#8B7CFF'; e.currentTarget.style.boxShadow = 'none' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#34344F'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={{
                    height: 44, padding: '0 36px',
                    background: '#8B7CFF', border: '1px solid #8B7CFF', borderRadius: '7px',
                    color: '#0D0A24', fontSize: '14px', fontWeight: 700,
                    fontFamily: 'Outfit, sans-serif', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'background 0.15s, border-color 0.15s, color 0.15s', letterSpacing: '0.02em',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#A194FF'; e.currentTarget.style.borderColor = '#A194FF' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#8B7CFF'; e.currentTarget.style.borderColor = '#8B7CFF' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 6-12 6V8l8-1-8-1V1z" fill="currentColor"/></svg>
                    Отправить тикет
                  </button>
                </div>
              </form>
            )}
          </div>

          </>)}

          {section === 'history' && (<>
          {/* Block 3: История тикетов */}
          <div className="support-card" style={{ background: '#12121C', border: '1px solid #191926', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="support-tickets-hdr" style={{ padding: '18px 28px', borderBottom: '1px solid #0F0F19', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '17px', color: '#EDEBFA' }}>История тикетов</h2>
              <span style={{ fontSize: '12px', color: '#676582', fontFamily: 'Inter, sans-serif' }}>{tickets.length} обращений</span>
            </div>

            {/* Table header */}
            <div className="support-tbl-hdr" style={{
              display: 'grid', gridTemplateColumns: '90px 1fr 110px 100px 28px',
              padding: '9px 28px', background: '#0F0F19',
              borderBottom: '1px solid #191926', flexShrink: 0,
            }}>
              {['Номер', 'Тема', 'Дата', 'Статус', ''].map(h => (
                <span key={h} style={{ fontSize: '10px', fontWeight: 600, color: '#676582', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif' }}>{h}</span>
              ))}
            </div>

            {/* Scrollable rows */}
            <div className="scrollable" style={{ maxHeight: 340, overflowY: 'auto' }}>
              {tickets.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#676582', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>Обращений пока нет</div>
              ) : (
                tickets.slice().reverse().map((t, i, arr) => (
                  <div key={t.id}>
                    <div
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      className="support-tbl-row"
                      style={{
                        display: 'grid', gridTemplateColumns: '90px 1fr 110px 100px 28px',
                        padding: '13px 28px', alignItems: 'center',
                        borderBottom: i < arr.length - 1 || expandedId === t.id ? '1px solid #0F0F19' : 'none',
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0F0F19' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span className="support-tbl-num" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#676582' }}>{t.id}</span>
                      <span style={{ fontSize: '13px', color: '#CFCDE3', fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '16px' }}>{t.subject}</span>
                      <span className="support-tbl-date" style={{ fontSize: '12px', color: '#676582', fontFamily: 'JetBrains Mono, monospace' }}>{t.date}</span>
                      <span className="support-tbl-status" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: statusDot[t.status], fontFamily: 'Inter, sans-serif' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusDot[t.status], flexShrink: 0 }} />
                        {statusLabel[t.status]}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#676582', transition: 'transform 0.15s', transform: expandedId === t.id ? 'rotate(180deg)' : 'rotate(0deg)', justifySelf: 'end' }}>
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    {expandedId === t.id && (
                      <div style={{ padding: '14px 28px 16px', background: '#0F0F19', borderBottom: i < arr.length - 1 ? '1px solid #191926' : 'none' }}>
                        <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 600, color: '#676582', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif' }}>Ответ поддержки</p>
                        {t.reply
                          ? <p style={{ margin: 0, fontSize: '13px', color: '#9A98B5', fontFamily: 'Inter, sans-serif', lineHeight: 1.7 }}>{t.reply}</p>
                          : <p style={{ margin: 0, fontSize: '13px', color: '#676582', fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>Ожидает ответа...</p>
                        }
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          </>)}

          {footer}
        </div>
      </div>
      </div>
    </div>
  )
}

const HISTORY_PAIRS = ['EUR/USD','GBP/USD','USD/JPY','XAU/USD','AUD/USD','GBP/JPY','USD/CHF','NZD/USD','OIL/USD','USD/CAD','EUR/JPY','USD/TRY']
const HISTORY_AI = ['GPT-4o','Claude 3.5','Gemini Pro','Grok-2','Mistral']

function makeVotes(dir: 'BUY'|'SELL'): { name: string; dir: 'BUY'|'SELL'; conf: number }[] {
  const opp: 'BUY'|'SELL' = dir === 'BUY' ? 'SELL' : 'BUY'
  const pattern: ('BUY'|'SELL')[] = [dir,dir,dir,dir,opp].sort(()=>Math.random()-0.5)
  return HISTORY_AI.map((name,i) => ({ name, dir: pattern[i], conf: 63+Math.floor(Math.random()*31) }))
}

function seededRand(seed: number) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff }
}

const MOCK_HISTORY = (() => {
  const entries = []
  const pairs = HISTORY_PAIRS
  const now = new Date('2026-08-09T18:00:00')
  for (let i = 0; i < 48; i++) {
    const r = seededRand(i * 7919 + 31337)
    const pair = pairs[Math.floor(r() * pairs.length)]
    const expiry = [1,2,3,5,10,15][Math.floor(r() * 6)]
    const dir: 'BUY'|'SELL' = r() > 0.5 ? 'BUY' : 'SELL'
    const conf = 65 + Math.floor(r() * 28)
    const result: 'WIN'|'LOSS' = r() > 0.38 ? 'WIN' : 'LOSS'
    const votes = makeVotes(dir)
    const ts = new Date(now.getTime() - i * (14 + Math.floor(r()*40)) * 60000)
    entries.push({ id: `SIG-${String(i+1).padStart(3,'0')}`, pair, expiry, dir, conf, result, votes, ts, variant: Math.floor(r()*10) })
  }
  return entries
})()

function HistoryPage({ onClose }: { onClose: () => void }) {
  const [filter, setFilter] = useState<'ALL'|'BUY'|'SELL'|'WIN'|'LOSS'>('ALL')
  const [pairFilter, setPairFilter] = useState('ALL')
  const [expandedId, setExpandedId] = useState<string|null>(null)

  const pairs = ['ALL', ...Array.from(new Set(MOCK_HISTORY.map(h => h.pair)))]

  const filtered = MOCK_HISTORY.filter(h => {
    if (pairFilter !== 'ALL' && h.pair !== pairFilter) return false
    if (filter === 'BUY') return h.dir === 'BUY'
    if (filter === 'SELL') return h.dir === 'SELL'
    if (filter === 'WIN') return h.result === 'WIN'
    if (filter === 'LOSS') return h.result === 'LOSS'
    return true
  })

  const wins = MOCK_HISTORY.filter(h => h.result === 'WIN').length
  const winRate = Math.round((wins / MOCK_HISTORY.length) * 100)
  const avgConf = Math.round(MOCK_HISTORY.reduce((s,h) => s+h.conf, 0) / MOCK_HISTORY.length)

  function fmtDate(d: Date) {
    return d.toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }).replace(',','')
  }

  return (
    <div className="message-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Header */}
      <PageHeader
        icon={<svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M8 3v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" stroke="currentColor" strokeWidth="1.4"/></svg>}
        title="История сигналов"
        description={`${MOCK_HISTORY.length} сигналов · Winrate ${winRate}% · Ср. уверенность ${avgConf}%`}
        onClose={onClose}
      />

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        gap: '12px', padding: '16px 24px',
        borderBottom: '1px solid var(--border2)',
        flexShrink: 0, background: 'var(--input-bg)',
      }}>
        {[
          {
            label: 'Всего сигналов', value: String(MOCK_HISTORY.length), color: '#4CC9F0',
            colorBg: 'rgba(76,201,240,0.12)',
            icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 3L4 10.5v14h6v-8h8v8h6v-14L14 3z" stroke="#4CC9F0" strokeWidth="1.6" strokeLinejoin="round"/><path d="M11 24.5v-6h6v6" stroke="#4CC9F0" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
          },
          {
            label: 'Успешных', value: String(wins), color: '#22C55E',
            colorBg: 'rgba(34,197,94,0.12)',
            icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="11" stroke="#22C55E" strokeWidth="1.6"/><path d="M8.5 14.5l4 4 7-8" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
          },
          {
            label: 'Winrate', value: `${winRate}%`, color: '#A855F7',
            colorBg: 'rgba(168,85,247,0.12)',
            icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 22 Q9 10 14 14 Q19 18 23 6" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" fill="none"/><circle cx="23" cy="6" r="2.5" fill="#A855F7"/><path d="M5 22h18" stroke="rgba(168,85,247,0.3)" strokeWidth="1" strokeDasharray="2 2"/></svg>,
          },
          {
            label: 'Ср. уверенность', value: `${avgConf}%`, color: '#F59E0B',
            colorBg: 'rgba(245,158,11,0.12)',
            icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 4a10 10 0 0 1 0 20A10 10 0 0 1 14 4z" stroke="#F59E0B" strokeWidth="1.6"/><path d="M14 9v5l3.5 3.5" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
          },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '3px', padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: '7px', flexShrink: 0,
              background: s.colorBg,
              border: `1px solid ${s.colorBg.replace('0.12', '0.3')}`,
              boxShadow: `0 0 12px ${s.colorBg.replace('0.12', '0.18')}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted2)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{s.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '22px', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '8px', padding: '12px 24px',
        borderBottom: '1px solid var(--border2)',
        flexShrink: 0, flexWrap: 'wrap', alignItems: 'center',
        background: 'var(--border2)',
      }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(['ALL','BUY','SELL','WIN','LOSS'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              height: 30, padding: '0 12px',
              background: filter === f
                ? f === 'BUY' ? 'rgba(34,197,94,0.2)' : f === 'SELL' ? 'rgba(239,68,68,0.2)' : f === 'WIN' ? 'rgba(34,197,94,0.2)' : f === 'LOSS' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'
                : 'transparent',
              border: `1px solid ${filter === f
                ? f === 'BUY' ? 'rgba(34,197,94,0.4)' : f === 'SELL' ? 'rgba(239,68,68,0.4)' : f === 'WIN' ? 'rgba(34,197,94,0.4)' : f === 'LOSS' ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'
                : 'var(--border)'}`,
              borderRadius: '5px',
              color: filter === f
                ? f === 'BUY' ? '#22C55E' : f === 'SELL' ? '#EF4444' : f === 'WIN' ? '#22C55E' : f === 'LOSS' ? '#EF4444' : '#4CC9F0'
                : 'var(--muted2)',
              fontSize: '12px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}>
              {f === 'ALL' ? 'Все' : f}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', minWidth: 140 }}>
          <CustomSelect
            value={pairFilter}
            onChange={setPairFilter}
            options={pairs.map(p => ({ label: p === 'ALL' ? 'Все пары' : p, value: p, icon: p !== 'ALL' ? <PairFlag pair={p} size={13} /> : undefined }))}
            dropDown
          />
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '90px 90px 56px 60px 70px 70px 1fr',
        padding: '8px 24px',
        background: 'var(--input-bg)',
        borderBottom: '1px solid var(--border2)',
        flexShrink: 0,
      }}>
        {['ID','Пара','Экспир','Направ','Уверен','Результат','Модели'].map(h => (
          <span key={h} style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif' }}>{h}</span>
        ))}
      </div>

      {/* Scrollable list */}
      <div className="scrollable" style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted3)', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
            Нет сигналов по выбранному фильтру
          </div>
        ) : filtered.map((h, idx) => {
          const dirColor = h.dir === 'BUY' ? '#22C55E' : '#EF4444'
          const dirBg = h.dir === 'BUY' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'
          const resColor = h.result === 'WIN' ? '#22C55E' : '#EF4444'
          const resBg = h.result === 'WIN' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'
          const resBorder = h.result === 'WIN' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'
          const isExp = expandedId === h.id
          return (
            <div key={h.id}>
              <div
                onClick={() => setExpandedId(isExp ? null : h.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 90px 56px 60px 70px 70px 1fr',
                  padding: '12px 24px',
                  borderBottom: '1px solid var(--border2)',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: isExp ? 'rgba(59,130,246,0.04)' : idx % 2 === 0 ? 'transparent' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = 'var(--surface)' }}
                onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'transparent' }}
              >
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--muted3)' }}>{h.id}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <PairFlag pair={h.pair} size={12} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{h.pair}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--muted3)' }}>{fmtDate(h.ts)}</span>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--muted2)' }}>{h.expiry}м</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '3px',
                  background: dirBg, color: dirColor,
                  fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em',
                  width: 'fit-content',
                }}>{h.dir}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--muted)' }}>{h.conf}%</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '3px',
                  background: resBg, color: resColor,
                  border: `1px solid ${resBorder}`,
                  fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em',
                  width: 'fit-content',
                }}>
                  {h.result === 'WIN'
                    ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5 8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  }
                  {h.result === 'WIN' ? 'WIN' : 'LOSS'}
                </span>
                {/* Model votes mini */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', overflow: 'hidden' }}>
                  {h.votes.map(v => (
                    <span key={v.name} style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: v.dir === 'BUY' ? '#22C55E' : '#EF4444',
                      boxShadow: `0 0 4px ${v.dir === 'BUY' ? '#22C55E' : '#EF4444'}`,
                    }} title={`${v.name}: ${v.dir} ${v.conf}%`}/>
                  ))}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 4, flexShrink: 0, transition: 'transform 0.15s', transform: isExp ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--muted3)' }}>
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              {/* Expanded detail */}
              {isExp && (
                <div style={{
                  padding: '16px 24px 20px',
                  background: 'var(--input-bg)',
                  borderBottom: '1px solid rgba(59,130,246,0.15)',
                }}>
                  <p style={{ margin: '0 0 12px', fontSize: '10px', fontWeight: 600, color: 'var(--muted3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Голоса AI-систем
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: 480 }}>
                    {h.votes.map(v => {
                      const vc = v.dir === 'BUY' ? '#22C55E' : '#EF4444'
                      return (
                        <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ width: 80, fontSize: '12px', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{v.name}</span>
                          <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${v.conf}%`, background: vc, borderRadius: 2 }} />
                          </div>
                          <span style={{ width: 34, fontSize: '11px', color: 'var(--muted2)', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', flexShrink: 0 }}>{v.conf}%</span>
                          <span style={{ width: 38, fontSize: '11px', fontWeight: 700, color: vc, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{v.dir}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: '14px', display: 'flex', gap: '20px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--muted3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Пара</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <PairFlag pair={h.pair} size={13} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{h.pair}</span>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--muted3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Экспирация</span>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginTop: '3px' }}>{h.expiry} мин</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--muted3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Уверенность</span>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 700, color: '#F59E0B', marginTop: '3px' }}>{h.conf}%</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--muted3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Результат</span>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 700, color: h.result === 'WIN' ? '#22C55E' : '#EF4444', marginTop: '3px' }}>{h.result}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CreditsPage({ footer }: { footer?: React.ReactNode }) {
  const MIN_CREDITS = 100
  const MAX_CREDITS = 10000
  const CREDIT_STEP = 100
  const [credits, setCredits] = useState(1000)
  const [activeTab, setActiveTab] = useState<'credits' | 'history'>('credits')
  const price = credits / 10
  const progress = ((credits - MIN_CREDITS) / (MAX_CREDITS - MIN_CREDITS)) * 100
  const quickAmounts = [100, 500, 1000, 3000, 5000, 10000]
  const purchases = [
    { date: '01.07.2026', description: 'Пополнение баланса', credits: '+3 000', amount: '$300', status: 'Оплачено' },
    { date: '01.04.2026', description: 'Пополнение баланса', credits: '+1 000', amount: '$100', status: 'Оплачено' },
    { date: '01.01.2026', description: 'Пополнение баланса', credits: '+100', amount: '$10', status: 'Оплачено' },
  ]
  const tabs = [
    {
      id: 'credits' as const,
      label: 'Кредиты',
      icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 7h13" stroke="currentColor" strokeWidth="1.3"/><circle cx="5" cy="10" r="1" fill="currentColor"/></svg>,
    },
    {
      id: 'history' as const,
      label: 'История',
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
            Без подписки
          </div>
          <div className="credits-hero-copy">
            <div className="credits-title">Пополните баланс кредитов</div>
            <div className="credits-description">
              Выберите нужный объём — от 100 до 10 000 кредитов. Один кредит используется для создания одного готового промпта, а остаток не сгорает.
            </div>
          </div>
          <div className="credits-rate">
            <div className="credits-rate-label">Стоимость одного промпта</div>
            <div className="credits-rate-value">0,10 $</div>
            <div className="credits-rate-caption">1 промпт = 1 кредит</div>
          </div>
        </div>

        <div className="credits-purchase-grid">
          <div className="credits-builder">
            <div className="credits-builder-header">
              <div>
                <div className="credits-section-kicker">Объём покупки</div>
                <div className="credits-selected-value">{credits.toLocaleString('ru-RU')}</div>
                <div className="credits-selected-caption">кредитов</div>
              </div>
              <div className="credits-selected-price">
                <span>${price.toLocaleString('en-US')}</span>
                <small>к оплате</small>
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
                aria-label="Количество кредитов"
                aria-valuetext={`${credits} кредитов за ${price} долларов`}
                onChange={event => setCredits(Number(event.target.value))}
                style={{ background: `linear-gradient(to right, #8B7CFF 0%, #8B7CFF ${progress}%, #2E2E46 ${progress}%, #2E2E46 100%)` }}
              />
              <div className="credits-slider-scale">
                <span><strong>100</strong><small>$10</small></span>
                <span><strong>10 000</strong><small>$1 000</small></span>
              </div>
            </div>

            <div className="credits-quick-label">Быстрый выбор</div>
            <div className="credits-quick-grid">
              {quickAmounts.map(amount => (
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
            <div className="credits-summary-title">Ваш заказ</div>
            <div className="credits-summary-row">
              <span>Кредиты</span>
              <strong>{credits.toLocaleString('ru-RU')}</strong>
            </div>
            <div className="credits-summary-row">
              <span>Стоимость кредита</span>
              <strong>$0.10</strong>
            </div>
            <div className="credits-summary-divider" />
            <div className="credits-summary-total">
              <span>Итого</span>
              <strong>${price.toLocaleString('en-US')}</strong>
            </div>
            <button type="button" className="credits-buy-button">
              Купить {credits.toLocaleString('ru-RU')} кредитов
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="credits-payment-note">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 6V4a4 4 0 0 1 8 0v2M2 6h10v7H2V6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              Безопасная оплата
            </div>
          </div>
        </div>

        <div className="credits-benefits">
          {[
            {
              title: 'Без срока действия',
              text: 'Кредиты остаются на балансе, пока вы их не используете.',
              icon: <path d="M8 3v5l3 2M8 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>,
            },
            {
              title: 'Прозрачная стоимость',
              text: 'Один готовый промпт списывает ровно один кредит.',
              icon: <><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M8 4v8M10.5 5.5H6.8a1.7 1.7 0 0 0 0 3.4h2.4a1.7 1.7 0 0 1 0 3.4H5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>,
            },
            {
              title: 'Мгновенное зачисление',
              text: 'Баланс обновляется автоматически сразу после оплаты.',
              icon: <path d="m9.5 1-6 8h5l-1 6 6-8h-5l1-6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>,
            },
          ].map(item => (
            <div className="credits-benefit" key={item.title}>
              <div className="credits-benefit-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none">{item.icon}</svg></div>
              <div>
                <div className="credits-benefit-title">{item.title}</div>
                <div className="credits-benefit-text">{item.text}</div>
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
              <div className="credits-history-title">История пополнений</div>
              <div className="credits-history-caption">Последние операции с вашим балансом</div>
            </div>
            <div className="credits-history-count">{purchases.length} операции</div>
          </div>
          <div className="credits-history-list">
            {purchases.map(purchase => (
              <div className="credits-history-row" key={purchase.date}>
                <span>{purchase.date}</span>
                <span>{purchase.description}</span>
                <strong>{purchase.credits}</strong>
                <span>{purchase.amount}</span>
                <span>{purchase.status}</span>
              </div>
            ))}
          </div>
        </div>
            )}
          </div>
          {footer}
        </div>
      </div>
    </div>
  )
}

function SettingsPage({ user, initialSection, onClose, watchlist, setWatchlist, footer }: { user: { name: string; email: string } | null; initialSection?: string; onClose: () => void; watchlist: string[]; setWatchlist: React.Dispatch<React.SetStateAction<string[]>>; footer?: React.ReactNode }) {
  type Section = 'account' | 'prompt-settings' | 'subscription'
  const [section, setSection] = useState<Section>((initialSection as Section) || 'account')
  const [sigTab, setSigTab] = useState<'indicators' | 'fundamental' | 'watchlist'>('indicators')

  useEffect(() => {
    if (initialSection) setSection(initialSection as Section)
  }, [initialSection])

  // ── Prompt data-source state ────────────────────────────────
  const [indicatorEnabled, setIndicatorEnabled] = useState<Record<string, boolean>>({})
  const [fundamentalEnabled, setFundamentalEnabled] = useState<Record<string, boolean>>({})

  // ── Watchlist state lifted to App ───────────────────────────



  const sidebarItems: { id: Section; label: string; icon: React.ReactElement }[] = [
    { id: 'account', label: 'Аккаунт', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { id: 'prompt-settings', label: 'Настройки', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M3.2 3.2l1.4 1.4M10.4 10.4l1.4 1.4M3.2 11.8l1.4-1.4M10.4 4.6l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { id: 'subscription', label: 'Кредиты', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="3.5" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6.5h12" stroke="currentColor" strokeWidth="1.3"/><circle cx="4.5" cy="9.5" r="1" fill="currentColor"/></svg> },
  ]

  const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: '6px' }
  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0 14px', color: 'var(--text)', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', height: 44, boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }

  return (
    <div className="message-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Header */}
      {(() => {
        const sectionDescriptions: Record<string, string> = {
          account: 'Управление профилем и данными аккаунта',
          'prompt-settings': 'Общие настройки и настройки генерации промптов',
          subscription: 'Пополнение баланса для создания готовых промптов',
        }
        const item = sidebarItems.find(i => i.id === section)
        return (
          <PageHeader
            icon={item?.icon}
            title={item?.label ?? ''}
            description={sectionDescriptions[section]}
            onClose={onClose}
          />
        )
      })()}

      {/* Content */}
      <div className={section === 'prompt-settings' || section === 'subscription' ? '' : `scrollable settings-body${section === 'account' ? ' settings-body--account' : ''}`} style={{ flex: 1, overflowY: section === 'prompt-settings' || section === 'subscription' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', padding: section === 'prompt-settings' || section === 'subscription' ? '0' : section === 'account' ? '32px 24px' : '28px 36px', boxSizing: 'border-box', background: 'var(--bg)' }}>
        <div style={{ maxWidth: (section === 'subscription' || section === 'prompt-settings') ? '100%' : section === 'account' ? 960 : 680, width: '100%', margin: section === 'prompt-settings' || section === 'subscription' ? '0' : '0 auto', display: 'flex', flexDirection: 'column', gap: section === 'subscription' ? 0 : '20px', flex: section === 'prompt-settings' || section === 'subscription' ? 1 : undefined, overflow: section === 'prompt-settings' || section === 'subscription' ? 'hidden' : undefined }}>

            {/* ── ACCOUNT ─────────────────────────────────────── */}
            {section === 'account' && <AccountSettings user={user} />}

            {/* ── PROMPT SETTINGS (Indicators + Watchlist) ─────── */}
            {section === 'prompt-settings' && (() => {
              const indicatorGroups = [
                {
                  id: 'trend', label: 'Трендовые', desc: 'Направление и сила текущего тренда', accent: '#8B7CFF',
                  indicators: [
                    { id: 'sma', code: 'SMA', name: 'Simple Moving Average', description: 'Простая скользящая средняя', parameters: '20 / 50 / 200' },
                    { id: 'ema', code: 'EMA', name: 'Exponential Moving Average', description: 'Экспоненциальная скользящая', parameters: '12 / 26 / 50' },
                    { id: 'macd', code: 'MACD', name: 'MACD', description: 'Схождение и расхождение средних', parameters: '12 / 26 / 9' },
                    { id: 'adx', code: 'ADX', name: 'Average Directional Index', description: 'Сила направленного движения', parameters: '14' },
                  ],
                },
                {
                  id: 'momentum', label: 'Импульсные', desc: 'Перекупленность, перепроданность и импульс', accent: '#4CC9F0',
                  indicators: [
                    { id: 'rsi', code: 'RSI', name: 'Relative Strength Index', description: 'Индекс относительной силы', parameters: '14' },
                    { id: 'stoch', code: 'STO', name: 'Stochastic Oscillator', description: 'Положение цены в диапазоне', parameters: '14 / 3 / 3' },
                    { id: 'cci', code: 'CCI', name: 'Commodity Channel Index', description: 'Отклонение цены от среднего', parameters: '20' },
                    { id: 'williams', code: '%R', name: 'Williams %R', description: 'Импульс и точки разворота', parameters: '14' },
                  ],
                },
                {
                  id: 'market', label: 'Объём и волатильность', desc: 'Активность рынка и диапазон движения', accent: '#FF8A6B',
                  indicators: [
                    { id: 'bb', code: 'BB', name: 'Bollinger Bands', description: 'Границы текущей волатильности', parameters: '20 / 2' },
                    { id: 'atr', code: 'ATR', name: 'Average True Range', description: 'Средний истинный диапазон', parameters: '14' },
                    { id: 'obv', code: 'OBV', name: 'On-Balance Volume', description: 'Баланс объёма покупок и продаж', parameters: 'Volume' },
                    { id: 'vwap', code: 'VWAP', name: 'Volume Weighted Average Price', description: 'Средняя цена с учётом объёма', parameters: 'Session' },
                  ],
                },
              ]
              const indicators = indicatorGroups.flatMap(group => group.indicators)
              const allEnabled = indicators.every(indicator => indicatorEnabled[indicator.id] !== false)
              const enabledCount = indicators.filter(indicator => indicatorEnabled[indicator.id] !== false).length

              const Checkbox = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
                <div
                  onClick={e => { e.stopPropagation(); onClick() }}
                  style={{ width: 15, height: 15, borderRadius: '2px', background: on ? '#8B7CFF' : '#0F0F19', border: `1px solid ${on ? '#8B7CFF' : '#34344F'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s' }}
                >
                  {on && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#0D0A24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              )

              const indicatorsContent = () => (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '16px 20px', gap: '12px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '12px' }}>
                    <div>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>Технические индикаторы</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted3)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                        Активно: <span style={{ color: '#CFCDE3', fontWeight: 600 }}>{enabledCount}</span> из {indicators.length}
                      </div>
                    </div>
                    <button
                      onClick={() => { const next = !allEnabled; const upd: Record<string, boolean> = {}; indicators.forEach(indicator => { upd[indicator.id] = next }); setIndicatorEnabled(upd) }}
                      style={{ height: 30, padding: '0 14px', background: '#12121C', border: '1px solid #191926', borderRadius: '3px', cursor: 'pointer', color: '#9A98B5', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', transition: 'border-color 0.12s, color 0.12s', letterSpacing: '0.03em', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2E2E46'; e.currentTarget.style.color = '#EDEBFA' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#191926'; e.currentTarget.style.color = '#9A98B5' }}
                    >{allEnabled ? 'Снять все' : 'Выбрать все'}</button>
                  </div>

                  <div className="indicator-table-header" style={{ display: 'grid', gridTemplateColumns: '15px 34px 1fr 1fr 92px', gap: '0 12px', padding: '0 10px 6px', borderBottom: '1px solid #191926', flexShrink: 0 }}>
                    <div /><div />
                    <span style={{ fontSize: '10px', color: '#474560', fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Индикатор</span>
                    <span style={{ fontSize: '10px', color: '#474560', fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Назначение</span>
                    <span style={{ fontSize: '10px', color: '#474560', fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Параметры</span>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin', scrollbarColor: '#191926 transparent' }}>
                    {indicatorGroups.map(group => {
                      const groupEnabledCount = group.indicators.filter(indicator => indicatorEnabled[indicator.id] !== false).length
                      const allGroupEnabled = groupEnabledCount === group.indicators.length
                      return (
                        <div key={group.id} style={{ marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#0B0B12', borderTop: '1px solid #191926', borderBottom: '1px solid #191926' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                              <span style={{ width: 3, height: 14, borderRadius: '2px', background: group.id === 'market' ? 'rgb(255, 255, 255)' : group.accent, flexShrink: 0 }} />
                              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: group.id === 'market' ? 'var(--text)' : group.accent, whiteSpace: 'nowrap' }}>{group.label}</span>
                              <span className="indicator-group-description" style={{ fontSize: '11px', color: '#474560', fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.desc}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#474560' }}>{groupEnabledCount}/{group.indicators.length}</span>
                              <button
                                onClick={() => { const upd: Record<string, boolean> = {}; group.indicators.forEach(indicator => { upd[indicator.id] = !allGroupEnabled }); setIndicatorEnabled(previous => ({ ...previous, ...upd })) }}
                                style={{ height: 20, padding: '0 8px', background: 'transparent', border: '1px solid #2E2E46', borderRadius: '2px', color: '#676582', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'color 0.1s, border-color 0.1s' }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#CFCDE3'; e.currentTarget.style.borderColor = '#474560' }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#676582'; e.currentTarget.style.borderColor = '#2E2E46' }}
                              >{allGroupEnabled ? 'Снять' : 'Вкл.'}</button>
                            </div>
                          </div>
                          {group.indicators.map((indicator, index) => {
                            const on = indicatorEnabled[indicator.id] !== false
                            return (
                              <div
                                key={indicator.id}
                                className="indicator-row"
                                onClick={() => setIndicatorEnabled(previous => ({ ...previous, [indicator.id]: !on }))}
                                style={{ display: 'grid', gridTemplateColumns: '15px 34px 1fr 1fr 92px', gap: '0 12px', padding: '7px 10px', alignItems: 'center', background: on ? '#0F0F19' : 'transparent', borderBottom: `1px solid ${index < group.indicators.length - 1 ? '#14141F' : '#191926'}`, cursor: 'pointer', transition: 'background 0.1s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#14141F' }}
                                onMouseLeave={e => { e.currentTarget.style.background = on ? '#0F0F19' : 'transparent' }}
                              >
                                <Checkbox on={on} onClick={() => setIndicatorEnabled(previous => ({ ...previous, [indicator.id]: !on }))} />
                                <div style={{ width: 30, height: 30, borderRadius: '7px', background: on ? '#191926' : '#12121C', border: `1px solid ${on ? '#34344F' : '#191926'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700, color: on ? '#CFCDE3' : '#34344F' }}>{indicator.code}</span>
                                </div>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: on ? '#CFCDE3' : '#474560', transition: 'color 0.1s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{indicator.name}</span>
                                <span className="indicator-description" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: on ? '#676582' : '#34344F', transition: 'color 0.1s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{indicator.description}</span>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700, color: on ? group.accent : '#34344F', whiteSpace: 'nowrap', transition: 'color 0.1s' }}>{indicator.parameters}</span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )

              const fundamentalGroups = [
                {
                  id: 'macro', label: 'Макроэкономика', desc: 'Ключевые показатели и решения регуляторов', accent: '#8B7CFF',
                  items: [
                    { id: 'calendar', code: 'CAL', name: 'Экономический календарь', description: 'Публикации высокой и средней важности' },
                    { id: 'central-banks', code: 'CB', name: 'Центральные банки', description: 'Решения по ставкам и заявления регуляторов' },
                    { id: 'inflation', code: 'CPI', name: 'Инфляция', description: 'CPI, PPI и инфляционные ожидания' },
                    { id: 'labor', code: 'NFP', name: 'Рынок труда', description: 'Занятость, безработица и динамика зарплат' },
                  ],
                },
                {
                  id: 'news', label: 'Новости', desc: 'События, способные повлиять на стоимость активов', accent: '#4CC9F0',
                  items: [
                    { id: 'breaking-news', code: '24H', name: 'Срочные новости', description: 'Важные события в режиме реального времени' },
                    { id: 'geopolitics', code: 'GEO', name: 'Геополитика', description: 'Конфликты, санкции и международные отношения' },
                    { id: 'corporate', code: 'EPS', name: 'Корпоративные события', description: 'Отчётность, прогнозы и действия компаний' },
                    { id: 'commodities-news', code: 'CMD', name: 'Сырьевые рынки', description: 'Запасы, производство и логистика сырья' },
                  ],
                },
                {
                  id: 'sentiment', label: 'Рыночные настроения', desc: 'Позиционирование участников и склонность к риску', accent: '#FF8A6B',
                  items: [
                    { id: 'cot', code: 'COT', name: 'Отчёты COT', description: 'Позиции крупных участников фьючерсного рынка' },
                    { id: 'fear-greed', code: 'F&G', name: 'Индекс страха и жадности', description: 'Общий уровень аппетита инвесторов к риску' },
                    { id: 'bond-yields', code: 'YLD', name: 'Доходности облигаций', description: 'Кривая доходности и ожидания по ставкам' },
                    { id: 'market-flow', code: 'FLOW', name: 'Потоки капитала', description: 'Переток средств между классами активов' },
                  ],
                },
              ]
              const fundamentalItems = fundamentalGroups.flatMap(group => group.items)
              const allFundamentalEnabled = fundamentalItems.every(item => fundamentalEnabled[item.id] !== false)
              const enabledFundamentalCount = fundamentalItems.filter(item => fundamentalEnabled[item.id] !== false).length

              const fundamentalContent = () => (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '16px 20px', gap: '12px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '12px' }}>
                    <div>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>Фундаментальный анализ</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted3)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                        Активно: <span style={{ color: '#CFCDE3', fontWeight: 600 }}>{enabledFundamentalCount}</span> из {fundamentalItems.length}
                      </div>
                    </div>
                    <button
                      onClick={() => { const next = !allFundamentalEnabled; const updated: Record<string, boolean> = {}; fundamentalItems.forEach(item => { updated[item.id] = next }); setFundamentalEnabled(updated) }}
                      style={{ height: 30, padding: '0 14px', background: '#12121C', border: '1px solid #191926', borderRadius: '3px', cursor: 'pointer', color: '#9A98B5', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', transition: 'border-color 0.12s, color 0.12s', letterSpacing: '0.03em', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2E2E46'; e.currentTarget.style.color = '#EDEBFA' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#191926'; e.currentTarget.style.color = '#9A98B5' }}
                    >{allFundamentalEnabled ? 'Снять все' : 'Выбрать все'}</button>
                  </div>

                  <div className="fundamental-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin', scrollbarColor: '#191926 transparent', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' }}>
                    {fundamentalGroups.map(group => {
                      const enabledInGroup = group.items.filter(item => fundamentalEnabled[item.id] !== false).length
                      const allGroupEnabled = enabledInGroup === group.items.length
                      return (
                        <div key={group.id} style={{ border: '1px solid #191926', borderRadius: '6px', overflow: 'hidden', background: '#0F0F19', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '9px 12px', background: '#12121C', borderBottom: '1px solid #191926' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: 3, height: 14, borderRadius: '2px', background: group.accent, flexShrink: 0 }} />
                                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{group.label}</span>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#676582' }}>{enabledInGroup}/{group.items.length}</span>
                              </div>
                              <div className="fundamental-group-description" style={{ marginTop: '3px', marginLeft: '11px', fontSize: '11px', color: '#676582', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.desc}</div>
                            </div>
                            <button
                              onClick={() => { const updated: Record<string, boolean> = {}; group.items.forEach(item => { updated[item.id] = !allGroupEnabled }); setFundamentalEnabled(previous => ({ ...previous, ...updated })) }}
                              style={{ height: 24, padding: '0 9px', background: 'transparent', border: '1px solid #2E2E46', borderRadius: '3px', color: '#7C7A98', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', flexShrink: 0 }}
                            >{allGroupEnabled ? 'Снять' : 'Вкл.'}</button>
                          </div>
                          <div className="fundamental-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' }}>
                            {group.items.map((item, index) => {
                              const on = fundamentalEnabled[item.id] !== false
                              return (
                                <div
                                  key={item.id}
                                  className="fundamental-item"
                                  onClick={() => setFundamentalEnabled(previous => ({ ...previous, [item.id]: !on }))}
                                  style={{ display: 'grid', gridTemplateColumns: '15px 36px minmax(0, 1fr)', alignItems: 'center', gap: '10px', minHeight: 58, padding: '8px 12px', borderRight: 'none', borderBottom: index < group.items.length - 1 ? '1px solid #14141F' : 'none', cursor: 'pointer', background: on ? '#0F0F19' : '#0B0B12', transition: 'background 0.12s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#14141F' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = on ? '#0F0F19' : '#0B0B12' }}
                                >
                                  <Checkbox on={on} onClick={() => setFundamentalEnabled(previous => ({ ...previous, [item.id]: !on }))} />
                                  <div style={{ width: 34, height: 30, borderRadius: '5px', background: on ? '#191926' : '#12121C', border: `1px solid ${on ? '#34344F' : '#191926'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 700, color: on ? '#CFCDE3' : '#34344F' }}>{item.code}</span>
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: on ? '#CFCDE3' : '#474560', lineHeight: 1.35, overflowWrap: 'anywhere' }}>{item.name}</div>
                                    <div className="fundamental-item-description" style={{ marginTop: '2px', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: on ? '#676582' : '#34344F', lineHeight: 1.4, overflowWrap: 'anywhere' }}>{item.description}</div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )

              const FX_GROUPS = [
                { key: 'Мажорные',     color: '#CFCDE3', pairs: ALL_INSTRUMENTS['Мажорные'] },
                { key: 'Минорные',     color: '#9A98B5', pairs: ALL_INSTRUMENTS['Минорные'] },
                { key: 'Экзотические', color: '#8B7CFF', pairs: ALL_INSTRUMENTS['Экзотические'] },
              ]
              const PairIcon2 = ({ pair, on }: { pair: string; on: boolean }) => {
                const [base, quote] = pair.split('/')
                const c1 = on ? '#9A98B5' : '#34344F'
                const c2 = on ? '#676582' : '#242436'
                return (
                  <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
                    <circle cx="12" cy="10" r="8.5" fill={c1} fillOpacity="0.12" stroke={c1} strokeWidth="1.1"/>
                    <circle cx="24" cy="10" r="8.5" fill={c2} fillOpacity="0.1" stroke={c2} strokeWidth="1.1"/>
                    <text x="9" y="14" textAnchor="middle" fontSize="7" fontWeight="700" fill={c1} fontFamily="Inter,sans-serif">{base.slice(0,2)}</text>
                    <text x="27" y="14" textAnchor="middle" fontSize="7" fontWeight="700" fill={c2} fontFamily="Inter,sans-serif">{quote.slice(0,2)}</text>
                  </svg>
                )
              }
              const totalFx2 = FX_GROUPS.reduce((s,g) => s+g.pairs.length, 0)
              const selFx2 = FX_GROUPS.reduce((s,g) => s+g.pairs.filter(p => watchlist.includes(p)).length, 0)

              const sigMenuItems = [
                { id: 'indicators' as const, label: 'Индикаторы', icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M1.5 12.5h11M2.5 10l2.4-3 2.2 1.7L11.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11.5" cy="3" r="1.2" fill="currentColor"/></svg> },
                { id: 'fundamental' as const, label: 'Фундамент', icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2 12V6.5M5.3 12V3.5M8.7 12V8M12 12V1.5M1 12.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                { id: 'watchlist' as const, label: 'Watchlist', icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.6 3.2 3.5.5-2.6 2.5.7 3.6L7 9.6 3.8 11.3l.7-3.6L2 5.2l3.5-.5L7 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
              ]

              return (
                <>
                  {/* Mobile tab bar — hidden on desktop, shown on mobile */}
                  <div className="sig-mobile-tabs" style={{ display: 'none', borderBottom: '1px solid var(--border)', background: 'var(--card)', padding: '8px 14px', gap: '8px', flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
                    {sigMenuItems.map(item => {
                      const active = sigTab === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSigTab(item.id)}
                          style={{
                            flex: '1 0 auto', minWidth: 112, height: 38,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                            background: active ? 'rgba(139,124,255,0.16)' : 'transparent',
                            border: `1px solid ${active ? 'rgba(139,124,255,0.35)' : 'transparent'}`,
                            borderRadius: '6px',
                            color: active ? '#B9AFFF' : '#7C7A98',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px', fontWeight: active ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            position: 'relative',
                          }}
                        >
                          <span style={{ flexShrink: 0 }}>{item.icon}</span>
                          {item.label}
                        </button>
                      )
                    })}
                  </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                  {/* Left sidebar — desktop only */}
                  <div className="sig-sidebar" style={{ width: 200, flexShrink: 0, background: 'var(--card)', borderRight: '1px solid var(--border2)', display: 'flex', flexDirection: 'column' }}>
                    <nav style={{ padding: '12px 10px', flex: 1 }}>
                      {sigMenuItems.map(item => {
                        const active = sigTab === item.id
                        return (
                          <button key={item.id} onClick={() => setSigTab(item.id)} style={{ width: '100%', height: 40, display: 'flex', alignItems: 'center', gap: '9px', padding: '0 11px', background: active ? 'rgba(139,124,255,0.10)' : 'transparent', border: `1px solid ${active ? 'rgba(139,124,255,0.35)' : 'transparent'}`, borderRadius: '6px', color: active ? '#B9AFFF' : '#9A98B5', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: active ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', marginBottom: '3px' }}
                            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#0F0F19'; e.currentTarget.style.color = '#8B7CFF' } }}
                            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9A98B5' } }}
                          >
                            <span style={{ flexShrink: 0 }}>{item.icon}</span>
                            {item.label}
                          </button>
                        )
                      })}
                    </nav>
                  </div>

                  {/* Right content */}
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                    {/* Indicators tab */}
                    {sigTab === 'indicators' && indicatorsContent()}

                    {/* Fundamental analysis tab */}
                    {sigTab === 'fundamental' && fundamentalContent()}

                    {/* Watchlist tab */}
                    {sigTab === 'watchlist' && (
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '16px 20px', gap: '14px', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                          <div>
                            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>Валютные пары</div>
                            <div style={{ fontSize: '12px', color: 'var(--muted3)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                              Активно: <span style={{ color: '#CFCDE3', fontWeight: 600 }}>{selFx2}</span> из {totalFx2}
                            </div>
                          </div>
                          <button onClick={() => setWatchlist(p => p.filter(x => !FX_GROUPS.some(g => g.pairs.includes(x))))} style={{ height: 34, padding: '0 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '5px', color: 'var(--muted2)', fontSize: '12px', fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.12s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2E2E46'; e.currentTarget.style.color = '#EDEBFA' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted2)' }}
                          >Сбросить всё</button>
                        </div>
                        <div className="watchlist-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent', display: 'flex', flexDirection: 'column', gap: '18px', paddingRight: '8px', paddingBottom: '16px' }}>
                          {FX_GROUPS.map(group => {
                            const hex = group.color
                            const sel = group.pairs.filter(p => watchlist.includes(p))
                            const allOn = sel.length === group.pairs.length
                            return (
                              <div key={group.key}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: 3, height: 16, borderRadius: '2px', background: hex }} />
                                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{group.key}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--muted3)', fontFamily: 'JetBrains Mono, monospace' }}>{sel.length}/{group.pairs.length}</span>
                                  </div>
                                  <button onClick={() => allOn ? setWatchlist(p => p.filter(x => !group.pairs.includes(x))) : setWatchlist(p => [...p, ...group.pairs.filter(x => !p.includes(x))])} style={{ height: 26, padding: '0 10px', background: '#12121C', border: '1px solid #191926', borderRadius: '5px', color: '#9A98B5', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.12s' }}>{allOn ? 'Снять все' : 'Выбрать все'}</button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(156px, 1fr))', gap: '4px' }}>
                                  {group.pairs.map(pair => {
                                    const on = watchlist.includes(pair)
                                    return (
                                      <div
                                        key={pair}
                                        onClick={() => setWatchlist(p => on ? p.filter(x => x !== pair) : [...p, pair])}
                                        style={{ background: on ? '#0F0F19' : '#12121C', border: `1px solid ${on ? '#2E2E46' : '#191926'}`, borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#14141F'; e.currentTarget.style.borderColor = '#2E2E46' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = on ? '#0F0F19' : '#12121C'; e.currentTarget.style.borderColor = on ? '#2E2E46' : '#191926' }}
                                      >
                                        <div style={{ width: 14, height: 14, borderRadius: '2px', background: on ? '#8B7CFF' : '#0F0F19', border: `1px solid ${on ? '#8B7CFF' : '#34344F'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.12s' }}>
                                          {on && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4L3 6L7 2" stroke="#0D0A24" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                        </div>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', opacity: on ? 1 : 0.4, transition: 'opacity 0.12s', flexShrink: 0 }}>
                                          <PairFlag pair={pair} size={13} />
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: on ? '#CFCDE3' : '#474560', fontFamily: 'JetBrains Mono, monospace', transition: 'color 0.12s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{pair}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                          {footer && <div style={{ marginTop: '8px' }}>{footer}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                </>
              )
            })()}

            {/* ── CREDITS ──────────────────────────────────────── */}
            {section === 'subscription' && <CreditsPage footer={footer} />}


        </div>
        {section !== 'subscription' && footer}
      </div>
    </div>
  )
}

function PremiumPage({ onClose, footer }: { onClose: () => void; footer?: React.ReactNode }) {
  const [section, setSection] = useState<'plans' | 'faq'>('plans')

  const plans = [
    {
      id: 'test', name: '3 сигнала — Пробный', price: null, period: null,
      colorBg: '#0F0F19', colorBorder: '#191926',
      badge: 'TEST',
      popular: false,
      bars: [7, 9, 11, 13, 15], filledBars: 1,
      features: ['3 сигнала при первом входе', '3 дополнительных сигнала после регистрации', 'Все валютные пары и крипто', 'Консенсус 100+ AI-систем'],
      cta: 'Активен сейчас',
      isTrial: true,
    },
    {
      id: 'free', name: 'Безлимит сигналов', price: null, period: null,
      colorBg: '#0F0F19', colorBorder: '#191926',
      badge: 'FREE',
      popular: true,
      bars: [7, 11, 15, 19, 22], filledBars: 5,
      features: ['Откройте счёт у брокера Pocket Option', 'Отправьте свой ID в нашу поддержку', 'Безлимитные сигналы навсегда', 'Все валютные пары и крипто'],
      cta: 'Получить бесплатно',
      isTrial: false,
    },
    {
      id: '100', name: '100 сигналов', price: '$39', originalPrice: '$65', discount: '40%', period: '/ пакет',
      colorBg: '#0F0F19', colorBorder: '#191926',
      badge: 'START',
      popular: false,
      bars: [7, 11, 15, 19, 22], filledBars: 2,
      features: ['Все валютные пары и крипто', 'Консенсус 100+ AI-систем', 'Срок действия — 90 дней'],
      cta: 'Купить пакет',
      isTrial: false,
    },
    {
      id: '500', name: '500 сигналов', price: '$149', originalPrice: '$260', discount: '43%', period: '/ пакет',
      colorBg: '#0F0F19', colorBorder: '#191926',
      badge: 'PRO',
      popular: false,
      bars: [7, 11, 15, 19, 22], filledBars: 3,
      features: ['Экономия 43% vs пакет 100', 'Приоритетная обработка', 'Срок действия — 180 дней'],
      cta: 'Купить пакет',
      isTrial: false,
    },
    {
      id: '2000', name: '2000 сигналов', price: '$399', originalPrice: '$780', discount: '49%', period: '/ пакет',
      colorBg: '#0F0F19', colorBorder: '#191926',
      badge: 'VIP',
      popular: false,
      bars: [7, 11, 15, 19, 22], filledBars: 5,
      features: ['Экономия 49% vs пакет 100', 'VIP поддержка 24/7', 'Срок действия — 365 дней'],
      cta: 'Купить пакет',
      isTrial: false,
    },
  ]

  const FAQ = [
    { q: 'Как получить бесплатный доступ?', a: 'Откройте счёт у брокера Pocket Option и отправьте свой ID в нашу поддержку. После проверки вы получаете безлимитный и бессрочный доступ ко всем сигналам абсолютно бесплатно.' },
    { q: 'Когда истекает пакет?', a: 'Пакет 100 сигналов действует 90 дней, 500 сигналов — 180 дней, 2000 сигналов — 365 дней с момента покупки. Неиспользованные сигналы сгорают по истечении срока.' },
    { q: 'Какие способы оплаты принимаются?', a: 'Принимаем банковские карты Visa/Mastercard, криптовалюту USDT (TRC-20), а также оплату через популярные электронные кошельки.' },
    { q: 'Есть ли гарантия возврата?', a: 'Да, в течение 3 дней с момента покупки вы можете запросить полный возврат средств, если не использовали ни одного сигнала из пакета.' },
    { q: 'Какова точность сигналов?', a: 'Средняя точность консенсуса 5 AI-систем составляет 72–78% на основе исторических данных. Прошлые результаты не гарантируют будущую прибыль.' },
    { q: 'Можно ли использовать на нескольких устройствах?', a: 'Да, ваш аккаунт доступен с любого устройства и браузера. Одновременный вход с нескольких устройств разрешён.' },
  ]

  const menuItems = [
    {
      id: 'plans' as const,
      label: 'Тарифные планы',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4l-3.7 2.1.7-4.1L2 5.5l4.2-.9L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: 'faq' as const,
      label: 'Вопросы и ответы',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 11v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M6 6.5C6 5.4 6.9 4.5 8 4.5s2 .9 2 2c0 1-.6 1.5-1.3 2-.5.3-.7.7-.7 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="message-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Header */}
      <PageHeader
        icon={<svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4l-3.7 2.1.7-4.1L2 5.5l4.2-.9L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>}
        title="Trading Prompt Premium"
        description="Пакеты сигналов от 5 AI-систем — платите только за использованные"
        onClose={onClose}
      />

      {/* Body — sidebar + content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left sidebar */}
        <div style={{
          width: 240, flexShrink: 0,
          background: 'var(--card)',
          borderRight: '1px solid var(--border2)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: '24px 20px 20px',
            borderBottom: '1px solid var(--border2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '5px',
                background: '#191926',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4l-3.7 2.1.7-4.1L2 5.5l4.2-.9L8 1z" stroke="var(--text)" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>Premium</div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 400, fontSize: '12px', color: 'var(--muted3)' }}>подписка</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '12px 10px', flex: 1 }}>
            {menuItems.map(item => {
              const active = section === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  style={{
                    width: '100%', height: 42,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '0 12px',
                    background: active ? '#0F0F19' : 'transparent',
                    border: 'none', borderRadius: '5px',
                    color: active ? '#EDEBFA' : 'var(--muted2)',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px', fontWeight: active ? 600 : 500,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s', marginBottom: '2px',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--muted)' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted2)' } }}
                >
                  {active && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, borderRadius: '0 1px 1px 0', background: '#8B7CFF' }} />}
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Right content */}
        <div className="page-body" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', boxSizing: 'border-box', minWidth: 0 }}>

          {/* PLANS section */}
          {section === 'plans' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>Тарифные планы</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted3)', fontFamily: 'Inter, sans-serif' }}>Выберите подходящий план и начните получать точные сигналы</p>
              </div>
              <div className="premium-grid">
                {plans.map(plan => (
                  <div key={plan.id} style={{
                    background: (plan as any).popular
                      ? 'var(--card)'
                      : 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '7px',
                    padding: '20px 18px',
                    display: 'flex', flexDirection: 'column', gap: '16px',
                    position: 'relative',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#14141F'; e.currentTarget.style.borderColor = '#2E2E46' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    {/* Icon + badge row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '3px',
                        background: '#0F0F19', border: '1px solid #191926',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <svg viewBox="0 0 24 18" fill="none" width="24" height="18">
                          {plan.bars.map((h, bi) => (
                            <rect key={bi} x={bi * 5} y={18 - h} width="3.5" height={h} rx="1"
                              fill={bi < plan.filledBars ? (plan.popular ? '#FF8A6B' : '#9A98B5') : '#191926'}
                              fillOpacity={bi < plan.filledBars ? 0.9 : 1}
                            />
                          ))}
                        </svg>
                      </div>
                      <div style={{
                        padding: '3px 10px', borderRadius: '3px',
                        background: plan.popular ? 'rgba(255,138,107,0.12)' : '#191926', border: `1px solid ${plan.popular ? 'rgba(255,138,107,0.38)' : '#34344F'}`,
                        fontSize: '11px', fontWeight: 700, color: plan.popular ? '#FFB4A0' : '#7C7A98',
                        letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace',
                      }}>{plan.badge}</div>
                    </div>

                    <div style={{ borderBottom: '1px solid var(--border2)', paddingBottom: '16px' }}>
                      <p style={{ margin: '0 0 10px', fontSize: '17px', fontWeight: 700, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>{plan.name}</p>
                      {plan.price ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--muted2)', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'line-through', opacity: 0.7 }}>{(plan as any).originalPrice}</span>
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', background: '#191926', color: '#7C7A98', fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em', border: '1px solid #34344F' }}>−{(plan as any).discount}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontSize: '36px', fontWeight: 800, color: '#EDEBFA', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{plan.price}</span>
                            <span style={{ fontSize: '13px', color: 'var(--muted3)', fontFamily: 'Inter, sans-serif' }}>{plan.period}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {(plan as any).isTrial ? (
                            <>
                              <div style={{ fontSize: '28px', fontWeight: 800, color: '#EDEBFA', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>3+3</div>
                              <div style={{ fontSize: '12px', color: 'var(--muted3)', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>Сигналов бесплатно · Тест</div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: '28px', fontWeight: 800, color: '#8B7CFF', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>$0</div>
                              <div style={{ fontSize: '12px', color: 'var(--muted3)', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>Безлимитно · Бессрочно</div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%',
                            background: '#0F0F19', border: '1px solid #191926',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginTop: '1px',
                          }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#8B7CFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.55, fontFamily: 'Inter, sans-serif' }}>{f}</span>
                        </div>
                      ))}
                    </div>

                    <button style={{
                      width: '100%', height: 42,
                      background: (plan as any).isTrial ? 'transparent' : plan.popular ? '#FF8A6B' : '#12121C',
                      border: `1px solid ${(plan as any).isTrial ? '#191926' : plan.popular ? '#FF8A6B' : '#191926'}`,
                      borderRadius: '3px',
                      color: (plan as any).isTrial ? '#676582' : plan.popular ? '#2A0E06' : '#CFCDE3',
                      fontSize: '14px', fontWeight: 600, fontFamily: 'Outfit, sans-serif',
                      cursor: (plan as any).isTrial ? 'default' : 'pointer',
                      transition: 'background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s',
                      boxShadow: 'none',
                      letterSpacing: '0.02em',
                    }}
                      onMouseEnter={e => { if (!(plan as any).isTrial && !plan.popular) { e.currentTarget.style.background = '#0F0F19'; e.currentTarget.style.borderColor = '#2E2E46'; e.currentTarget.style.color = '#EDEBFA' } }}
                      onMouseLeave={e => { if (!(plan as any).isTrial && !plan.popular) { e.currentTarget.style.background = '#12121C'; e.currentTarget.style.borderColor = '#191926'; e.currentTarget.style.color = '#CFCDE3' } }}
                      onMouseDown={e => { if (!(plan as any).isTrial) e.currentTarget.style.transform = 'scale(0.98)' }}
                      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    >{plan.cta}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ section */}
          {section === 'faq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 720 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>Вопросы и ответы</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted3)', fontFamily: 'Inter, sans-serif' }}>Часто задаваемые вопросы о подписке Premium</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {FAQ.map((item, i) => (
                  <div key={i} style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '3px', flexShrink: 0,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px',
                      }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>Q</span>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>{item.q}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', lineHeight: 1.65 }}>{item.a}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {footer}
        </div>
      </div>
    </div>
  )
}

type PlanTier = 'free' | 'starter' | 'pro' | 'vip'

const PLAN_META: Record<PlanTier, { label: string; color: string; bg: string; border: string; dot: string }> = {
  free:    { label: 'Free',    color: '#8EDDF7', bg: 'rgba(76,201,240,0.12)',   border: 'rgba(76,201,240,0.35)',   dot: '#4CC9F0' },
  starter: { label: 'Start',   color: '#7C7A98', bg: '#0F0F19',   border: '#191926',   dot: '#7C7A98' },
  pro:     { label: 'Pro',     color: '#CFCDE3', bg: '#191926',   border: '#2E2E46',   dot: '#CFCDE3' },
  vip:     { label: 'VIP',     color: '#FFB4A0', bg: 'rgba(255,138,107,0.12)',   border: 'rgba(255,138,107,0.38)',   dot: '#FF8A6B' },
}

const PLAN_CYCLE: PlanTier[] = ['free', 'starter', 'pro', 'vip']

const NAV_ITEMS = [
  { id: 'chat',      label: 'Чат с Trading Prompt',         icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4.5L2 12V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
  )},
  { id: 'affiliate', label: 'Партнёрская программа',   icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="4" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="7" cy="10" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M4 6v1m6-1v1M5.8 8.5l1.2 0m0 0l1.2-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
  )},
  { id: 'support',   label: 'Поддержка и контакты',   icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 10v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M5.5 5.5a1.5 1.5 0 0 1 3 0c0 1-1.5 1.5-1.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
  )},
  { id: 'legal',     label: 'Правовая информация',     icon: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2.5" y="1.5" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5h4M5 7.5h4M5 10h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
  )},
]

function AccountBalanceSummary({ remaining, className }: { remaining: number; className?: string }) {
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

function UserMenu({ email, emailHidden, onToggleEmail, remaining, plan, onCyclePlan, onLogout, onNavigate, onOpenSettings, className, userId, name }: {
  email: string
  emailHidden: boolean
  onToggleEmail: () => void
  remaining: number
  plan: PlanTier
  onCyclePlan: () => void
  onLogout: () => void
  onNavigate: (id: string) => void
  onOpenSettings: (section: string) => void
  className?: string
  userId: number
  name: string
}) {
  const pm = PLAN_META[plan]
  const nbS: React.CSSProperties = {
    height: 32, padding: '0 10px', flexShrink: 0,
    background: 'transparent', border: 'none', borderRadius: '7px',
    color: 'var(--muted)', fontSize: '12px', fontFamily: 'Inter, sans-serif',
    cursor: 'pointer', whiteSpace: 'nowrap',
    display: 'flex', alignItems: 'center', gap: '5px',
    transition: 'color 0.13s, background 0.13s',
  }
  const nbE = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--border)' }
  const nbL = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent' }

  return (
    <div className={['account-menu-icons', className].filter(Boolean).join(' ')} style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'nowrap', overflow: 'hidden' }}>
      <AccountBalanceSummary remaining={remaining} className="account-balance-summary--desktop" />

      <button className="account-menu-button" style={nbS} onClick={() => onOpenSettings('account')} onMouseEnter={nbE} onMouseLeave={nbL}>
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M2 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
        Аккаунт
      </button>
      <button className="account-menu-button" style={nbS} onClick={() => onOpenSettings('subscription')} onMouseEnter={nbE} onMouseLeave={nbL}>
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6h11" stroke="currentColor" strokeWidth="1.3"/><circle cx="4" cy="9" r="1" fill="currentColor"/></svg></span>
        Кредиты
      </button>
      <button className="account-menu-button" style={nbS} onClick={() => onOpenSettings('prompt-settings')} onMouseEnter={nbE} onMouseLeave={nbL}>
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M2.8 11.2l1.4-1.4M9.8 4.2l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
        Настройки промпта
      </button>
      <button className="account-menu-button" style={nbS} onClick={() => onNavigate('affiliate')} onMouseEnter={nbE} onMouseLeave={nbL}>
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="4" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 13c0-2 1.3-3.5 3-3.5M13 13c0-2-1.3-3.5-3-3.5M6 13c0-1.8 1-3 2-3s2 1.2 2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
        Партнёрская программа
      </button>
      <button className="account-menu-button" style={nbS} onClick={() => onNavigate('support')} onMouseEnter={nbE} onMouseLeave={nbL}>
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 9V7.5c1.2-.3 2-1.2 2-2.5a2 2 0 0 0-4 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7" cy="11" r="0.7" fill="currentColor"/></svg></span>
        Поддержка и контакты
      </button>
      <button className="account-menu-button" style={nbS} onClick={() => onNavigate('faq')} onMouseEnter={nbE} onMouseLeave={nbL}>
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5.4 5.4a1.7 1.7 0 1 1 2.5 1.5c-.7.4-.9.8-.9 1.5M7 10.5v.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
        Вопросы и ответы
      </button>
      <button className="account-menu-button" style={nbS} onClick={() => onNavigate('legal')} onMouseEnter={nbE} onMouseLeave={nbL}>
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg></span>
        Правовая информация
      </button>

      {/* Logout */}
      <button
        className="account-menu-button"
        onClick={onLogout}
        style={{
          height: 32, padding: '0 10px', flexShrink: 0,
          background: 'transparent', border: 'none', borderRadius: '7px',
          color: 'var(--muted2)', fontSize: '12px', fontFamily: 'Inter, sans-serif',
          cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px',
          transition: 'color 0.13s, background 0.13s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--border)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted2)'; e.currentTarget.style.background = 'transparent' }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M9.5 9.5L12 7l-2.5-2.5M12 7H5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Выйти
      </button>
    </div>
  )
}

export {
  AccountBalanceSummary,
  AffiliatePage,
  AuthModal,
  Binum_LOGO,
  CURRENCY_PAIRS,
  CustomSelect,
  DEFAULT_WATCHLIST,
  EconomicCalendarPage,
  GREETINGS,
  LegalPage,
  PAIR_CATEGORIES,
  PLAN_CYCLE,
  PageFooter,
  PairFlag,
  PromptTradingView,
  SettingsPage,
  SupportPage,
  TIMEFRAME_OPTIONS,
  UserMenu,
  buildCandles,
  formatTime,
  generateFundamentals,
  generateIndicators,
  generateVolumeData,
}
export type { Message, PlanTier }
