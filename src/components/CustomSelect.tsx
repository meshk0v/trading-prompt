import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import './CustomSelect.css'

export type SelectOption = { label: string; value: string | number; icon?: ReactNode }

type CustomSelectProps = {
  value: string | number
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  /** Fixed width of the dropdown list; by default it matches the field. */
  menuWidth?: string
  menuAlign?: 'left' | 'right'
  /** Open the list below the field (default: above it). */
  dropDown?: boolean
}

/** Styled replacement for <select> with optional icons next to the options. */
export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  menuWidth,
  menuAlign = 'left',
  dropDown,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking anywhere outside.
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(option => String(option.value) === String(value))
  const menuStyle: CSSProperties | undefined = menuWidth
    ? {
        width: menuWidth,
        [menuAlign === 'right' ? 'right' : 'left']: 0,
        [menuAlign === 'right' ? 'left' : 'right']: 'auto',
      }
    : undefined

  return (
    <div ref={ref} className="custom-select">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className="custom-select__field"
      >
        {selected?.icon && <span className="custom-select__icon custom-select__icon--muted">{selected.icon}</span>}
        <span className={`custom-select__value${!selected && placeholder ? ' custom-select__value--placeholder' : ''}`}>
          {selected?.label ?? placeholder ?? String(value)}
        </span>
        <svg className="custom-select__chevron" width="12" height="7" viewBox="0 0 12 7" fill="none" aria-hidden="true">
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className={`custom-select__menu${dropDown ? ' custom-select__menu--down' : ''}`} style={menuStyle}>
          {options.map(option => {
            const isSelected = String(option.value) === String(value)
            return (
              <div
                key={option.value}
                className={`custom-select__option${isSelected ? ' is-selected' : ''}`}
                onClick={() => {
                  onChange(String(option.value))
                  setOpen(false)
                }}
              >
                {option.icon && <span className="custom-select__icon">{option.icon}</span>}
                {option.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
