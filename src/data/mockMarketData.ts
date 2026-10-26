// Generated sample data for prompts. Values are fictional and only illustrate the prompt format.

export type IndicatorDatum = {
  id: number
  category: 'oscillator' | 'trend' | 'volatility' | 'volume'
  name: string
  param: string
  value: string
  signal: 'BUY' | 'SELL' | 'NEUTRAL'
}

export type VolumeDatum = {
  id: number
  exchange: string
  instrument: string
  volume: string
  change: string
  signal: 'BUY' | 'SELL' | 'NEUTRAL'
}

export type FundamentalDatum = {
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

function makeRng(seed: number) {
  let s = seed | 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0
    return (s >>> 0) / 4294967296
  }
}

export function generateIndicators(direction: 'BUY' | 'SELL' | 'WAIT', pair: string): IndicatorDatum[] {
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

export function generateFundamentals(direction: 'BUY' | 'SELL' | 'WAIT', pair: string): FundamentalDatum[] {
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
  { exchange: 'CME Group',        instrument: () => 'Net Speculative Pos.',    baseVol: 42000,   unit: 'contracts' },
  { exchange: 'COT Report',       instrument: () => 'Non-Commercial Long',     baseVol: 185000,  unit: 'contracts' },
  { exchange: 'COT Report',       instrument: () => 'Non-Commercial Short',    baseVol: 140000,  unit: 'contracts' },
  { exchange: 'COT Report',       instrument: () => 'Commercial Hedgers Net',  baseVol: -28000,  unit: 'contracts' },
  { exchange: 'Dark Pool',        instrument: p => `${p} Dark Volume`,        baseVol: 1200,    unit: 'M USD' },
  { exchange: 'Dark Pool',        instrument: () => 'Dark Pool Share %',       baseVol: 18,      unit: '%' },
  { exchange: 'OTC Market',       instrument: p => `${p} OTC Volume`,         baseVol: 12000,   unit: 'M USD' },
  { exchange: 'Retail Brokers',   instrument: () => 'Retail Long Positions',   baseVol: 62,      unit: '%' },
  { exchange: 'Retail Brokers',   instrument: () => 'Retail Short Positions',  baseVol: 38,      unit: '%' },
  { exchange: 'NYSE',             instrument: p => `${p} Block Trades`,       baseVol: 480,     unit: 'trades' },
  { exchange: 'Institutional',    instrument: () => 'Inst. Buy Volume',        baseVol: 4800,    unit: 'M USD' },
  { exchange: 'Institutional',    instrument: () => 'Inst. Sell Volume',       baseVol: 4200,    unit: 'M USD' },
  { exchange: 'CME Group',        instrument: p => `${p} Buy/Sell Ratio`,     baseVol: 1.18,    unit: 'x' },
  { exchange: 'CBOE',             instrument: p => `${p} Options P/C Ratio`,  baseVol: 0.72,    unit: 'x' },
  { exchange: 'DTCC',             instrument: p => `${p} Settlement Vol.`,    baseVol: 38000,   unit: 'M USD' },
]

export function generateVolumeData(direction: 'BUY' | 'SELL' | 'WAIT', pair: string): VolumeDatum[] {
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

export function buildCandles(direction: 'BUY' | 'SELL' | 'WAIT', seed: number): Candle[] {
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
