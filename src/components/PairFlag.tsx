import {
  BIQUOTE_COMMODITY,
  BIQUOTE_INDEX,
  BIQUOTE_STOCK,
} from "../data/biquoteInstruments"

// ── Currency → ISO 3166-1 alpha-2 flag code ──────────────────────────────────
const CURRENCY_FLAG: Record<string, string> = {
  EUR: 'eu', USD: 'us', GBP: 'gb', JPY: 'jp', CHF: 'ch',
  AUD: 'au', CAD: 'ca', NZD: 'nz', NOK: 'no', SEK: 'se',
  DKK: 'dk', PLN: 'pl', HUF: 'hu', CZK: 'cz', RON: 'ro',
  SGD: 'sg', CNH: 'cn', HKD: 'hk', TRY: 'tr', ZAR: 'za',
  MXN: 'mx', BRL: 'br', THB: 'th', IDR: 'id', INR: 'in',
  PHP: 'ph', KRW: 'kr', ILS: 'il', AED: 'ae', SAR: 'sa',
  QAR: 'qa', EGP: 'eg',
}

const INSTRUMENT_ICON_SETS = {
  commodity: new Set<string>(BIQUOTE_COMMODITY),
  index: new Set<string>(BIQUOTE_INDEX),
  stock: new Set<string>(BIQUOTE_STOCK),
}

const CRYPTO_ICON_SYMBOLS = new Set([
  "BTC", "ETH", "BNB", "XRP", "SOL", "ADA", "AVAX",
  "DOT", "MATIC", "LINK", "LTC", "ATOM", "DOGE", "TRX",
])

const INSTRUMENT_ICON_ALIASES: Record<string, string> = {
  OILUSD: "USOIL",
}

function getCryptoSymbol(pair: string) {
  const normalizedPair = pair.replace(/[\s/_-]+/g, "").toUpperCase()
  const cryptoSymbol = normalizedPair.replace(/(?:USDT|USD)$/, "")
  return CRYPTO_ICON_SYMBOLS.has(cryptoSymbol) ? cryptoSymbol : null
}

function getInstrumentIcon(pair: string) {
  const normalizedPair = pair.replace(/[\s/_-]+/g, "").toUpperCase()
  const symbol = INSTRUMENT_ICON_ALIASES[normalizedPair] ?? normalizedPair
  const category = Object.entries(INSTRUMENT_ICON_SETS)
    .find(([, symbols]) => symbols.has(symbol))?.[0]

  return category ? `/instrument-icons/${category}/${symbol}.png` : null
}

// Stacked flag pair: quote flag bottom-left (behind), base flag top-right (front), both with shadow.
export default function PairFlag({ pair, size = 14 }: { pair: string; size?: number }) {
  const cryptoSymbol = getCryptoSymbol(pair)
  if (cryptoSymbol) {
    const flagWidth = Math.round(size * 1.3)
    const flagHeight = Math.round(size * 0.9)
    const offsetX = Math.round(size * 0.42)
    const offsetY = Math.round(size * 0.28)

    return (
      <span
        style={{
          position: "relative",
          display: "inline-block",
          width: flagWidth + offsetX,
          height: flagHeight + offsetY,
          flexShrink: 0,
          verticalAlign: "middle",
        }}
      >
        <span
          className="fi fi-us"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            zIndex: 1,
            display: "inline-block",
            width: flagWidth,
            height: flagHeight,
            overflow: "hidden",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.45)",
            fontSize: flagWidth,
            lineHeight: 1,
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 2,
            display: "block",
            width: flagWidth,
            height: flagHeight,
            overflow: "hidden",
            borderRadius: 2,
            background: "#20283d",
            boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          <img
            src={`/instrument-icons/crypto/${cryptoSymbol}.png`}
            alt=""
            aria-hidden="true"
            width={flagWidth}
            height={flagHeight}
            loading="lazy"
            decoding="async"
            style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
          />
        </span>
      </span>
    )
  }

  const instrumentIcon = getInstrumentIcon(pair)
  if (instrumentIcon) {
    const width = Math.round(size * 1.55)
    const height = Math.round(width / 1.447)

    return (
      <span
        style={{
          display: "inline-flex",
          width,
          height,
          flexShrink: 0,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(148, 163, 184, 0.22)",
          borderRadius: 3,
          background: "#20283d",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
          verticalAlign: "middle",
        }}
      >
        <img
          src={instrumentIcon}
          alt=""
          aria-hidden="true"
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
        />
      </span>
    )
  }

  const [base, quote] = pair.split('/')
  const FALLBACK = 'eu'  // placeholder until user sets correct flag
  const f1 = (base  ? CURRENCY_FLAG[base]  : undefined) ?? FALLBACK  // front / top-right
  const f2 = (quote ? CURRENCY_FLAG[quote] : undefined) ?? FALLBACK  // back  / bottom-left

  const w = Math.round(size * 1.3)    // flag width
  const h = Math.round(size * 0.9)    // flag height
  const ox = Math.round(size * 0.42)  // horizontal offset
  const oy = Math.round(size * 0.28)  // vertical offset — tighter to fit in rows
  const cw = w + ox
  const ch = h + oy

  return (
    <span style={{ position: 'relative', display: 'inline-block', width: cw, height: ch, flexShrink: 0, verticalAlign: 'middle' }}>
      {/* Back flag — quote, bottom-left */}
      <span className={`fi fi-${f2}`} style={{
        position: 'absolute', bottom: 0, left: 0,
        width: w, height: h, borderRadius: 2,
        overflow: 'hidden', display: 'inline-block',
        fontSize: w, lineHeight: '1',
        boxShadow: '0 1px 3px rgba(0,0,0,0.45)',
        zIndex: 1,
      }} />
      {/* Front flag — base, top-right */}
      <span className={`fi fi-${f1}`} style={{
        position: 'absolute', top: 0, right: 0,
        width: w, height: h, borderRadius: 2,
        overflow: 'hidden', display: 'inline-block',
        fontSize: w, lineHeight: '1',
        boxShadow: '0 1px 4px rgba(0,0,0,0.6)',
        zIndex: 2,
      }} />
    </span>
  )
}
