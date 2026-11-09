type Indicator = {
  id: number
  category: "oscillator" | "trend" | "volatility" | "volume"
  name: string
  param: string
  value: string
  signal: "BUY" | "SELL" | "NEUTRAL"
}

type Candle = {
  o: number
  h: number
  l: number
  c: number
}

type Volume = {
  exchange: string
  instrument: string
  volume: string
  change: string
  signal: "BUY" | "SELL" | "NEUTRAL"
}

type Fundamental = {
  country: string
  name: string
  period: string
  actual: string
  forecast: string
  previous: string
  signal: "BUY" | "SELL" | "NEUTRAL"
}

type PromptData = {
  request: {
    purpose: string | null
    instrument: string
    assetType: string
    timeframes: string[]
    history: {
      priceBars: number
      indicatorBars: number
    }
  }
  marketData: {
    indicators: Indicator[]
    candles: Candle[]
    volumes: Volume[]
    fundamentals: Fundamental[]
  }
}

const SECTION_META = {
  trend: {
    title: "Тренд",
    description: "Направление и сила движения: положение цены относительно средних и подтверждение трендовыми индикаторами.",
  },
  oscillator: {
    title: "Импульс",
    description: "Скорость движения цены, состояние перекупленности или перепроданности и баланс краткосрочного импульса.",
  },
  volatility: {
    title: "Волатильность",
    description: "Текущий размах движения и положение цены внутри динамических ценовых каналов.",
  },
  volume: {
    title: "Объём и денежный поток",
    description: "Активность участников и подтверждение движения показателями объёма.",
  },
} as const

const signalLabel = {
  BUY: "Бычий",
  SELL: "Медвежий",
  NEUTRAL: "Нейтральный",
} as const

function SignalBadge({ signal }: { signal: Indicator["signal"] }) {
  return <span className={`analysis-signal analysis-signal--${signal.toLowerCase()}`}>{signalLabel[signal]}</span>
}

export default function UserAnalysisReport({ prompt }: { prompt: string }) {
  let data: PromptData

  try {
    data = JSON.parse(prompt) as PromptData
  } catch {
    return <div className="analysis-report-error">Не удалось отобразить структурированный отчёт.</div>
  }

  const { request, marketData } = data
  const lastCandle = marketData.candles.at(-1)
  const firstCandle = marketData.candles[0]
  const change = firstCandle && lastCandle
    ? ((lastCandle.c - firstCandle.o) / firstCandle.o) * 100
    : 0
  const signalCounts = marketData.indicators.reduce(
    (counts, indicator) => ({ ...counts, [indicator.signal]: counts[indicator.signal] + 1 }),
    { BUY: 0, SELL: 0, NEUTRAL: 0 },
  )
  const dominantSignal = signalCounts.BUY > signalCounts.SELL
    ? "BUY"
    : signalCounts.SELL > signalCounts.BUY
      ? "SELL"
      : "NEUTRAL"

  return (
    <div className="analysis-report">
      <div className="analysis-report-hero">
        <div>
          <span className="analysis-report-eyebrow">Рыночный обзор</span>
          <h3>{request.instrument}</h3>
          <p>{request.assetType} · {request.timeframes.join(" / ")}</p>
        </div>
        <SignalBadge signal={dominantSignal} />
      </div>

      <div className="analysis-summary-grid">
        <div>
          <span>Последняя цена</span>
          <strong>{lastCandle?.c.toFixed(2) ?? "—"}</strong>
        </div>
        <div>
          <span>Изменение</span>
          <strong className={change >= 0 ? "analysis-positive" : "analysis-negative"}>
            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </strong>
        </div>
        <div>
          <span>Сигналы</span>
          <strong>{signalCounts.BUY} / {signalCounts.SELL} / {signalCounts.NEUTRAL}</strong>
        </div>
        <div>
          <span>Глубина</span>
          <strong>{request.history.priceBars} баров</strong>
        </div>
      </div>

      <section className="analysis-section">
        <div className="analysis-section-heading">
          <span>01</span>
          <div>
            <h4>Сводка</h4>
            <p>Ключевые параметры сформированного набора данных перед передачей в выбранную ИИ-модель.</p>
          </div>
        </div>
        <ul className="analysis-facts">
          <li><span>Актив и тип</span><strong>{request.instrument} · {request.assetType}</strong></li>
          <li><span>Таймфреймы</span><strong>{request.timeframes.join(", ")}</strong></li>
          <li><span>История цены</span><strong>{request.history.priceBars} баров</strong></li>
          <li><span>История индикаторов</span><strong>{request.history.indicatorBars} баров</strong></li>
          <li><span>Последняя свеча</span><strong>O {lastCandle?.o.toFixed(2)} · H {lastCandle?.h.toFixed(2)} · L {lastCandle?.l.toFixed(2)} · C {lastCandle?.c.toFixed(2)}</strong></li>
        </ul>
        {request.purpose && (
          <div className="analysis-user-task">
            <span>Задача пользователя</span>
            <p>{request.purpose}</p>
          </div>
        )}
      </section>

      {(Object.keys(SECTION_META) as Array<keyof typeof SECTION_META>).map((category, index) => {
        const indicators = marketData.indicators.filter(indicator => indicator.category === category)
        if (indicators.length === 0) return null
        const meta = SECTION_META[category]

        return (
          <section className="analysis-section" key={category}>
            <div className="analysis-section-heading">
              <span>{String(index + 2).padStart(2, "0")}</span>
              <div>
                <h4>{meta.title}</h4>
                <p>{meta.description}</p>
              </div>
            </div>
            <div className="analysis-table-wrap">
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>Индикатор</th>
                    <th>Параметр</th>
                    <th>Значение</th>
                    <th>Оценка</th>
                  </tr>
                </thead>
                <tbody>
                  {indicators.map(indicator => (
                    <tr key={indicator.id}>
                      <td>{indicator.name}</td>
                      <td>{indicator.param}</td>
                      <td className="analysis-mono">{indicator.value}</td>
                      <td><SignalBadge signal={indicator.signal} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}

      <section className="analysis-section">
        <div className="analysis-section-heading">
          <span>06</span>
          <div>
            <h4>Реальный объём</h4>
            <p>Данные торговых площадок: активность по инструменту и изменение объёма относительно предыдущего периода.</p>
          </div>
        </div>
        <div className="analysis-table-wrap">
          <table className="analysis-table">
            <thead>
              <tr>
                <th>Площадка</th>
                <th>Инструмент</th>
                <th>Объём</th>
                <th>Изменение</th>
              </tr>
            </thead>
            <tbody>
              {marketData.volumes.map((item, index) => (
                <tr key={`${item.exchange}-${index}`}>
                  <td>{item.exchange}</td>
                  <td>{item.instrument}</td>
                  <td className="analysis-mono">{item.volume}</td>
                  <td className={item.change.startsWith("+") ? "analysis-positive" : "analysis-negative"}>{item.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="analysis-section">
        <div className="analysis-section-heading">
          <span>07</span>
          <div>
            <h4>Фундаментальные показатели</h4>
            <p>Сопоставление фактических значений с прогнозом и предыдущими данными для оценки макроэкономического фона.</p>
          </div>
        </div>
        <div className="analysis-table-wrap">
          <table className="analysis-table">
            <thead>
              <tr>
                <th>Страна / событие</th>
                <th>Период</th>
                <th>Факт</th>
                <th>Прогноз</th>
                <th>Ранее</th>
              </tr>
            </thead>
            <tbody>
              {marketData.fundamentals.map((item, index) => (
                <tr key={`${item.country}-${item.name}-${index}`}>
                  <td><strong>{item.country}</strong><span className="analysis-table-note">{item.name}</span></td>
                  <td>{item.period}</td>
                  <td className="analysis-mono">{item.actual}</td>
                  <td className="analysis-mono">{item.forecast}</td>
                  <td className="analysis-mono">{item.previous}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="analysis-section">
        <div className="analysis-section-heading">
          <span>08</span>
          <div>
            <h4>История свечей</h4>
            <p>Последние свечи от старых к новым. Значения приведены в формате OHLC.</p>
          </div>
        </div>
        <div className="analysis-table-wrap">
          <table className="analysis-table analysis-candles-table">
            <thead>
              <tr>
                <th>Свеча</th>
                <th>Open</th>
                <th>High</th>
                <th>Low</th>
                <th>Close</th>
                <th>Движение</th>
              </tr>
            </thead>
            <tbody>
              {marketData.candles.map((candle, index) => {
                const candleChange = ((candle.c - candle.o) / candle.o) * 100
                return (
                  <tr key={index}>
                    <td>#{index + 1}</td>
                    <td className="analysis-mono">{candle.o.toFixed(2)}</td>
                    <td className="analysis-mono">{candle.h.toFixed(2)}</td>
                    <td className="analysis-mono">{candle.l.toFixed(2)}</td>
                    <td className="analysis-mono">{candle.c.toFixed(2)}</td>
                    <td className={candleChange >= 0 ? "analysis-positive" : "analysis-negative"}>
                      {candleChange >= 0 ? "+" : ""}{candleChange.toFixed(2)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="analysis-disclaimer">
        Сводка носит информационный и учебный характер, не является инвестиционной рекомендацией и требует самостоятельной проверки.
      </p>
    </div>
  )
}
