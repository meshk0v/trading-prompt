import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useI18n } from '../i18n/context'
import './PromptPanelResizeHandle.css'

type PromptPanelResizeHandleProps = {
  width: number
  onResize: (width: number) => void
}

const MIN_PANEL_WIDTH = 320
const DEFAULT_PANEL_WIDTH = 400

function clampPanelWidth(width: number, containerWidth: number) {
  const maxWidth = Math.min(680, containerWidth - 360)
  return Math.min(Math.max(width, MIN_PANEL_WIDTH), Math.max(MIN_PANEL_WIDTH, maxWidth))
}

export default function PromptPanelResizeHandle({ width, onResize }: PromptPanelResizeHandleProps) {
  const { t } = useI18n()
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null)
  const [resizing, setResizing] = useState(false)
  const getContainerWidth = (element: HTMLDivElement) => element.closest<HTMLElement>('.app-main')?.clientWidth ?? window.innerWidth

  const finishResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragState.current = null
    setResizing(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  return (
    <div
      className="prompt-panel-resize-handle"
      data-resizing={resizing}
      role="separator"
      aria-label={t('Изменить ширину конструктора промпта')}
      aria-orientation="vertical"
      aria-valuemin={MIN_PANEL_WIDTH}
      aria-valuemax={680}
      aria-valuenow={Math.round(width)}
      tabIndex={0}
      title={t('Потяните, чтобы изменить ширину. Двойной клик — сбросить.')}
      onPointerDown={event => {
        dragState.current = { startX: event.clientX, startWidth: width }
        setResizing(true)
        event.currentTarget.setPointerCapture(event.pointerId)
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
      }}
      onPointerMove={event => {
        if (!dragState.current) return
        const nextWidth = dragState.current.startWidth + dragState.current.startX - event.clientX
        onResize(clampPanelWidth(nextWidth, getContainerWidth(event.currentTarget)))
      }}
      onPointerUp={finishResize}
      onPointerCancel={finishResize}
      onDoubleClick={event => onResize(clampPanelWidth(DEFAULT_PANEL_WIDTH, getContainerWidth(event.currentTarget)))}
      onKeyDown={event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        onResize(clampPanelWidth(width + (event.key === 'ArrowLeft' ? 20 : -20), getContainerWidth(event.currentTarget)))
      }}
    >
      <span className="prompt-panel-resize-grip" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  )
}
