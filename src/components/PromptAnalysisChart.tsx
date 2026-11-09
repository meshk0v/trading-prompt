import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import TPL, { type TradingCandle } from "../tradingLevelsLibrary"
import PairFlag from "./PairFlag"

const MOBILE_CHART_MEDIA_QUERY = "(max-width: 640px)"

type PromptAnalysisChartProps = {
  pair: string
  timeframe: string
  candles: TradingCandle[]
  result: Record<string, any>
  show: string[]
  source?: string
  exportTargetId?: string
}

export default function PromptAnalysisChart({
  pair,
  timeframe,
  candles,
  result,
  show,
  source,
  exportTargetId,
}: PromptAnalysisChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [exportTarget, setExportTarget] = useState<HTMLElement | null>(null)
  const [isMobileInterface, setIsMobileInterface] = useState(() =>
    window.matchMedia(MOBILE_CHART_MEDIA_QUERY).matches
  )

  useEffect(() => {
    setExportTarget(exportTargetId ? document.getElementById(exportTargetId) : null)
  }, [exportTargetId])

  useEffect(() => {
    const mobileMedia = window.matchMedia(MOBILE_CHART_MEDIA_QUERY)
    const syncInterfaceMode = () => setIsMobileInterface(mobileMedia.matches)
    syncInterfaceMode()
    mobileMedia.addEventListener("change", syncInterfaceMode)
    return () => mobileMedia.removeEventListener("change", syncInterfaceMode)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      TPL.renderChart(candles, result, {
        canvas,
        format: fullscreen && isMobileInterface ? "mobile" : "desktop",
        theme: "dark",
        show,
        volume: true,
        symbol: pair,
        timeframe,
        source,
      })
      setError(null)
    } catch (chartError) {
      setError(chartError instanceof Error ? chartError.message : "Не удалось построить график")
    }
  }, [candles, fullscreen, isMobileInterface, pair, result, show, source, timeframe])

  useEffect(() => {
    if (!fullscreen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false)
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [fullscreen])

  const downloadChart = async () => {
    const canvas = canvasRef.current
    if (!canvas || downloading) return
    setDownloading(true)
    try {
      const blob = await TPL.chartToBlob(canvas)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${pair.replace(/[^A-Za-z0-9]+/g, "-")}-${timeframe}-chart.png`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 4000)
    } finally {
      setDownloading(false)
    }
  }

  const canvas = (
    <>
      <canvas ref={canvasRef} className="prompt-analysis-canvas" aria-label={`График анализа ${pair} ${timeframe}`} />
      {error && <div className="prompt-analysis-chart-error" role="alert">{error}</div>}
    </>
  )

  if (fullscreen) {
    return (
      <div className="prompt-chart-fullscreen" role="dialog" aria-modal="true" aria-label={`График анализа ${pair}`}>
        <div className="prompt-chart-fullscreen-header">
          <div className="prompt-chart-fullscreen-title">
            <PairFlag pair={pair} size={18} />
            <span>{pair}</span>
            <span className="prompt-chart-timeframe">{timeframe}</span>
          </div>
          <div className="prompt-analysis-chart-actions">
            <button type="button" onClick={downloadChart} disabled={downloading}>
              {downloading ? "Подготовка…" : "Скачать PNG"}
            </button>
            <button
              type="button"
              className="prompt-chart-close"
              onClick={() => setFullscreen(false)}
              aria-label="Закрыть полноэкранный график"
              title="Свернуть график"
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 6h4V2M14 6h-4V2M2 10h4v4M14 10h-4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="prompt-chart-fullscreen-body prompt-analysis-chart-fullscreen-body">{canvas}</div>
      </div>
    )
  }

  return (
    <>
      <div className="prompt-chart prompt-analysis-chart">
        {canvas}
        <button
          type="button"
          className="prompt-chart-open prompt-analysis-chart-expand"
          onClick={() => setFullscreen(true)}
          aria-label={`Открыть график ${pair} на всю страницу`}
          title="Открыть график на всю страницу"
        >
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {exportTarget && createPortal(
        <button
          type="button"
          className="prompt-export-button--png"
          onClick={downloadChart}
          disabled={downloading}
          aria-label="Скачать график PNG"
          title="Скачать PNG"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2v8m0 0 3-3m-3 3L5 7M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {downloading ? "Подготовка…" : "PNG"}
        </button>,
        exportTarget,
      )}
    </>
  )
}
