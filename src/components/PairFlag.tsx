// ── Currency → ISO 3166-1 alpha-2 flag code ──────────────────────────────────
const CURRENCY_FLAG: Record<string, string> = {
  EUR: 'eu',
  USD: 'us',
  GBP: 'gb',
  JPY: 'jp',
  CHF: 'ch',
  AUD: 'au',
  CAD: 'ca',
  NZD: 'nz',
  NOK: 'no',
  SEK: 'se',
  DKK: 'dk',
  PLN: 'pl',
  HUF: 'hu',
  CZK: 'cz',
  RON: 'ro',
  SGD: 'sg',
  CNH: 'cn',
  HKD: 'hk',
  TRY: 'tr',
  ZAR: 'za',
  MXN: 'mx',
  BRL: 'br',
  THB: 'th',
  IDR: 'id',
  INR: 'in',
  PHP: 'ph',
  KRW: 'kr',
  ILS: 'il',
  AED: 'ae',
  SAR: 'sa',
  QAR: 'qa',
  EGP: 'eg',
}

// Stacked flag pair: quote flag bottom-left (behind), base flag top-right (front), both with shadow.
export default function PairFlag({ pair, size = 14 }: { pair: string; size?: number }) {
  const [base, quote] = pair.split('/')
  const FALLBACK = 'eu' // placeholder until user sets correct flag
  const f1 = (base ? CURRENCY_FLAG[base] : undefined) ?? FALLBACK // front / top-right
  const f2 = (quote ? CURRENCY_FLAG[quote] : undefined) ?? FALLBACK // back  / bottom-left

  const w = Math.round(size * 1.3) // flag width
  const h = Math.round(size * 0.9) // flag height
  const ox = Math.round(size * 0.42) // horizontal offset
  const oy = Math.round(size * 0.28) // vertical offset — tighter to fit in rows
  const cw = w + ox
  const ch = h + oy

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        width: cw,
        height: ch,
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    >
      {/* Back flag — quote, bottom-left */}
      <span
        className={`fi fi-${f2}`}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: w,
          height: h,
          borderRadius: 2,
          overflow: 'hidden',
          display: 'inline-block',
          fontSize: w,
          lineHeight: '1',
          boxShadow: '0 1px 3px rgba(0,0,0,0.45)',
          zIndex: 1,
        }}
      />
      {/* Front flag — base, top-right */}
      <span
        className={`fi fi-${f1}`}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: w,
          height: h,
          borderRadius: 2,
          overflow: 'hidden',
          display: 'inline-block',
          fontSize: w,
          lineHeight: '1',
          boxShadow: '0 1px 4px rgba(0,0,0,0.6)',
          zIndex: 2,
        }}
      />
    </span>
  )
}
