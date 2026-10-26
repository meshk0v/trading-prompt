import type { ReactNode } from 'react'
import './SectionLayout.css'

export type SectionItem<T extends string> = { id: T; label: string; icon: ReactNode }

type SectionLayoutProps<T extends string> = {
  items: SectionItem<T>[]
  active: T
  onChange: (id: T) => void
  /** "solid" fills the active item with the accent colour, "soft" only tints it. */
  tone?: 'soft' | 'solid'
  /** Page-specific modifier for sizes and colours. */
  className?: string
  children: ReactNode
}

/** Sections of a page: a sidebar on desktop, tabs above the content on phones (≤640px). */
export default function SectionLayout<T extends string>({
  items,
  active,
  onChange,
  tone = 'soft',
  className,
  children,
}: SectionLayoutProps<T>) {
  const rootClass = ['section-layout', `section-layout--${tone}`, className].filter(Boolean).join(' ')

  const renderItems = (itemClass: string) =>
    items.map(item => (
      <button
        key={item.id}
        type="button"
        onClick={() => onChange(item.id)}
        className={`${itemClass}${item.id === active ? ' is-active' : ''}`}
      >
        <span className="section-layout__icon">{item.icon}</span>
        {item.label}
      </button>
    ))

  return (
    <>
      <div className={`${rootClass} section-layout__tabs`}>{renderItems('section-layout__tab')}</div>
      <div className={`${rootClass} section-layout__row`}>
        <aside className="section-layout__sidebar">
          <nav>{renderItems('section-layout__item')}</nav>
        </aside>
        {children}
      </div>
    </>
  )
}
