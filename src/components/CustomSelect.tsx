import { useEffect, useRef, useState, type ReactNode } from 'react'

export default function CustomSelect({ value, onChange, options, width, menuWidth, menuAlign = 'left', dropDown, subdued = false, placeholder }: {
  value: string | number
  onChange: (v: string) => void
  options: { label: string; value: string | number; icon?: ReactNode }[]
  width?: number | string
  menuWidth?: number | string
  menuAlign?: 'left' | 'right'
  dropDown?: boolean
  subdued?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => String(o.value) === String(value))

  return (
    <div ref={ref} className={`custom-select${subdued ? ' custom-select--subdued' : ''}`} style={{ position: 'relative', width: width ?? '100%' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
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

      {open && (
        <div style={{
          position: 'absolute',
          ...(dropDown
            ? { top: 'calc(100% + 6px)' }
            : { bottom: 'calc(100% + 6px)' }),
          ...(menuWidth
            ? menuAlign === 'right'
              ? { right: 0, left: 'auto', width: menuWidth }
              : { right: 'auto', left: 0, width: menuWidth }
            : { right: 0, left: 0, width: '100%' }),
          background: 'var(--card2)',
          border: '1px solid var(--border)',
          borderRadius: '3px',
          overflowX: 'hidden',
          zIndex: 50,
          boxShadow: 'var(--panel-shadow)',
          maxHeight: 260,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border) var(--bg)',
          scrollbarGutter: 'stable',
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
      )}
    </div>
  )
}
