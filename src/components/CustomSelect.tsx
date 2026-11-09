import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export default function CustomSelect({ value, onChange, options, width, menuWidth, menuAlign = 'left', dropDown, subdued = false, placeholder, portalMenu = false }: {
  value: string | number
  onChange: (v: string) => void
  options: { label: string; value: string | number; icon?: ReactNode }[]
  width?: number | string
  menuWidth?: number | string
  menuAlign?: 'left' | 'right'
  dropDown?: boolean
  subdued?: boolean
  placeholder?: string
  portalMenu?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0, width: 0 })

  const updatePortalPosition = () => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const resolvedWidth = typeof menuWidth === 'number' ? menuWidth : rect.width
    const left = menuAlign === 'right' ? rect.right - resolvedWidth : rect.left
    setPortalPosition({
      top: dropDown ? rect.bottom + 6 : rect.top - 6,
      left: Math.max(8, Math.min(window.innerWidth - resolvedWidth - 8, left)),
      width: resolvedWidth,
    })
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        ref.current
        && !ref.current.contains(target)
        && !menuRef.current?.contains(target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open || !portalMenu) return
    updatePortalPosition()
    window.addEventListener('resize', updatePortalPosition)
    window.addEventListener('scroll', updatePortalPosition, true)
    return () => {
      window.removeEventListener('resize', updatePortalPosition)
      window.removeEventListener('scroll', updatePortalPosition, true)
    }
  }, [open, portalMenu, dropDown, menuAlign, menuWidth])

  const selected = options.find(o => String(o.value) === String(value))
  const menu = (
    <div ref={menuRef} style={{
      position: portalMenu ? 'fixed' : 'absolute',
      ...(portalMenu
        ? dropDown
          ? { top: portalPosition.top, left: portalPosition.left, width: portalPosition.width }
          : { bottom: window.innerHeight - portalPosition.top, left: portalPosition.left, width: portalPosition.width }
        : {
            ...(dropDown
              ? { top: 'calc(100% + 6px)' }
              : { bottom: 'calc(100% + 6px)' }),
            ...(menuWidth
              ? menuAlign === 'right'
                ? { right: 0, left: 'auto', width: menuWidth }
                : { right: 'auto', left: 0, width: menuWidth }
              : { right: 0, left: 0, width: '100%' }),
          }),
      background: 'var(--card2)',
      border: '1px solid var(--border)',
      borderRadius: '3px',
      overflowX: 'hidden',
      zIndex: portalMenu ? 1000 : 50,
      boxShadow: 'var(--panel-shadow)',
      maxHeight: 260,
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: 'var(--border) var(--bg)',
    }}>
      {options.map(opt => (
        <div
          key={opt.value}
          onClick={() => { onChange(String(opt.value)); setOpen(false) }}
          style={{
            padding: '8px 12px',
            fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace',
            color: String(opt.value) === String(value) ? 'var(--accent-text)' : 'var(--text2)',
            background: String(opt.value) === String(value) ? 'var(--selected-option-bg, #242436)' : 'transparent',
            cursor: 'pointer',
            transition: 'background 0.1s',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
          onMouseEnter={e => { if (String(opt.value) !== String(value)) e.currentTarget.style.background = 'var(--accent-soft)' }}
          onMouseLeave={e => { if (String(opt.value) !== String(value)) e.currentTarget.style.background = 'transparent' }}
        >
          {opt.icon && <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{opt.icon}</span>}
          {opt.label}
        </div>
      ))}
    </div>
  )

  return (
    <div ref={ref} className={`custom-select${subdued ? ' custom-select--subdued' : ''}`} style={{ position: 'relative', width: width ?? '100%' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          if (!open && portalMenu) updatePortalPosition()
          setOpen(o => !o)
        }}
        style={{
          width: '100%', height: 36,
          background: subdued ? 'var(--input-bg, #191926)' : 'var(--bg)',
          border: `1px solid ${open ? 'var(--accent, #8B7CFF)' : 'var(--border)'}`,
          borderRadius: subdued ? '7px' : '5px',
          color: 'var(--text)',
          fontSize: subdued ? '14px' : '13px',
          fontFamily: subdued ? 'Inter, sans-serif' : 'JetBrains Mono, monospace',
          padding: '0 32px 0 10px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '7px', justifyContent: 'flex-start',
          textAlign: 'left',
          transition: 'border-color 0.15s',
          outline: 'none',
          boxShadow: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {selected?.icon && <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', opacity: subdued ? 0.72 : 1 }}>{selected.icon}</span>}
        <span className={!selected && placeholder ? 'text-[var(--muted2)]' : undefined} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.label ?? placeholder ?? String(value)}
        </span>
        <svg
          width="12" height="7" viewBox="0 0 12 7" fill="none"
          style={{
            position: 'absolute', right: 10, top: '50%',
            transform: open ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)',
            transition: 'transform 0.15s', flexShrink: 0, pointerEvents: 'none',
            color: open ? 'var(--accent)' : 'var(--muted)',
          }}
        >
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (portalMenu ? createPortal(menu, document.body) : menu)}
    </div>
  )
}
