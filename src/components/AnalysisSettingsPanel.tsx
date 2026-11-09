import { useEffect, useRef, useState } from "react"
import CustomSelect from "./CustomSelect"
import { TOGGLE_TOOLTIPS } from "../analysisSettingsTooltips"
import type { AnalysisSource, RequestLogEntry } from "../tradingMarketData"

type ToggleGroup = {
  id: string
  chart?: boolean
  label: string
  items: readonly (readonly [string, string])[]
}

export type AnalysisSettingsPanelProps = {
  source: AnalysisSource
  onSourceChange: (source: AnalysisSource) => void
  utcOffset: number
  onUtcOffsetChange: (offset: number) => void
  calendarCountries: string
  onCalendarCountriesChange: (countries: string) => void
  calendarEnabled: boolean
  onCalendarEnabledChange: (enabled: boolean) => void
  ticksEnabled: boolean
  onTicksEnabledChange: (enabled: boolean) => void
  disabledToggleKeys: string[]
  disabledChartIndicatorKeys: string[]
  toggleGroups: readonly ToggleGroup[]
  onToggleBlock: (key: string) => void
  onToggleChartIndicator: (key: string) => void
  onDone?: () => void
  logs: RequestLogEntry[]
  onClearLogs: () => void
  onCheckBlocks: () => void
}

type SettingsIconName = "database" | "clock" | "calendar" | "pulse" | "layers" | "terminal" | "check" | "copy" | "trash" | "tune"

const CALENDAR_COUNTRIES = [
  { code: "AR", name: "Аргентина" },
  { code: "AU", name: "Австралия" },
  { code: "BR", name: "Бразилия" },
  { code: "GB", name: "Великобритания" },
  { code: "HK", name: "Гонконг" },
  { code: "EU", name: "Евросоюз" },
  { code: "IN", name: "Индия" },
  { code: "ID", name: "Индонезия" },
  { code: "IT", name: "Италия" },
  { code: "CA", name: "Канада" },
  { code: "CN", name: "Китай" },
  { code: "MX", name: "Мексика" },
  { code: "NZ", name: "Новая Зеландия" },
  { code: "NO", name: "Норвегия" },
  { code: "PL", name: "Польша" },
  { code: "RU", name: "Россия" },
  { code: "SA", name: "Саудовская Аравия" },
  { code: "SG", name: "Сингапур" },
  { code: "US", name: "США" },
  { code: "TR", name: "Турция" },
  { code: "FR", name: "Франция" },
  { code: "DE", name: "Германия" },
  { code: "CH", name: "Швейцария" },
  { code: "SE", name: "Швеция" },
  { code: "ZA", name: "ЮАР" },
  { code: "KR", name: "Южная Корея" },
  { code: "JP", name: "Япония" },
] as const

function SettingsIcon({ name }: { name: SettingsIconName }) {
  const paths: Record<SettingsIconName, React.ReactNode> = {
    database: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16M8 14h2M14 14h2M8 17h2" />
      </>
    ),
    pulse: <path d="M3 12h4l2.2-5 4.2 10 2.1-5H21" />,
    layers: (
      <>
        <path d="m12 3-9 5 9 5 9-5-9-5Z" />
        <path d="m5 12-2 1 9 5 9-5-2-1M5 17l-2 1 9 5 9-5-2-1" />
      </>
    ),
    terminal: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m7 9 3 3-3 3M13 16h4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    copy: (
      <>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    trash: (
      <>
        <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
      </>
    ),
    tune: (
      <>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </>
    ),
  }

  return (
    <svg className="calculation-settings-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </g>
    </svg>
  )
}

function CountryMultiSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (countries: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const selectedCodes = value
    .split(",")
    .map(code => code.trim().toUpperCase())
    .filter(code => CALENDAR_COUNTRIES.some(country => country.code === code))

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const filteredCountries = CALENDAR_COUNTRIES.filter(country =>
    `${country.name} ${country.code}`.toLowerCase().includes(search.trim().toLowerCase()),
  )

  const toggleCountry = (code: string) => {
    const next = selectedCodes.includes(code)
      ? selectedCodes.filter(item => item !== code)
      : [...selectedCodes, code]
    onChange(next.join(","))
  }

  return (
    <div className="calculation-country-select" ref={rootRef}>
      <button
        type="button"
        className="calculation-country-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(current => !current)}
      >
        <span className="calculation-country-value">
          {selectedCodes.length ? (
            <>
              <span className="calculation-country-flags">
                {selectedCodes.slice(0, 3).map(code => (
                  <span key={code} className={`fi fi-${code.toLowerCase()}`} aria-hidden="true" />
                ))}
              </span>
              <span>{selectedCodes.length === 1
                ? CALENDAR_COUNTRIES.find(country => country.code === selectedCodes[0])?.name
                : `Выбрано стран: ${selectedCodes.length}`}</span>
            </>
          ) : (
            <span className="calculation-country-placeholder">Авто по инструменту</span>
          )}
        </span>
        <svg viewBox="0 0 12 7" fill="none" aria-hidden="true">
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="calculation-country-menu">
          <div className="calculation-country-search">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Найти страну"
              autoFocus
            />
          </div>
          <div className="calculation-country-actions">
            <button type="button" onClick={() => onChange("")}>Авто</button>
            <button type="button" onClick={() => onChange(CALENDAR_COUNTRIES.map(country => country.code).join(","))}>
              Выбрать все
            </button>
          </div>
          <div className="calculation-country-list" role="listbox" aria-multiselectable="true">
            {filteredCountries.map(country => {
              const selected = selectedCodes.includes(country.code)
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={selected ? "is-selected" : undefined}
                  key={country.code}
                  onClick={() => toggleCountry(country.code)}
                >
                  <span className={`fi fi-${country.code.toLowerCase()}`} aria-hidden="true" />
                  <span>{country.name}</span>
                  <small>{country.code}</small>
                  <i>{selected && <SettingsIcon name="check" />}</i>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnalysisSettingsPanel({
  source,
  onSourceChange,
  utcOffset,
  onUtcOffsetChange,
  calendarCountries,
  onCalendarCountriesChange,
  calendarEnabled,
  onCalendarEnabledChange,
  ticksEnabled,
  onTicksEnabledChange,
  disabledToggleKeys,
  disabledChartIndicatorKeys,
  toggleGroups,
  onToggleBlock,
  onToggleChartIndicator,
  onDone,
}: AnalysisSettingsPanelProps) {
  return (
    <div className="builder-analysis-settings">
      <div data-prompt-guide="analysis-settings" className="builder-settings-static-heading">
        <span><SettingsIcon name="tune" /></span>
        <div>
          <strong>Настройки промпта</strong>
          <small>Выберите данные и индикаторы для анализа</small>
        </div>
        {onDone && (
          <button type="button" className="builder-settings-done" onClick={onDone}>
            Готово
          </button>
        )}
      </div>
      <div className="builder-advanced-settings-content">
        <div className="calculation-block-groups">
          {toggleGroups.map((group, groupIndex) => (
            <section
              className="calculation-toggle-group"
              data-prompt-guide={groupIndex === 0 ? "analysis-blocks" : undefined}
              key={group.id}
            >
              <header className="calculation-toggle-group-heading">
                <SettingsIcon name="layers" />
                <span>{group.label}</span>
              </header>
              <div className="calculation-toggle-cards">
                {group.items.map(([key, label]) => (
                  <div
                    className={`calculation-toggle-card${disabledToggleKeys.includes(key) ? "" : " is-prompt-enabled"}`}
                    key={key}
                  >
                    <label className="calculation-toggle-main" title="Включить в промпт">
                      <input
                        className="calculation-toggle-prompt-input"
                        type="checkbox"
                        aria-label={`${label}: включить в промпт`}
                        checked={!disabledToggleKeys.includes(key)}
                        onChange={() => onToggleBlock(key)}
                      />
                      <span className="calculation-toggle-label">
                        <span className="calculation-toggle-name">{label}</span>
                        <small className="calculation-toggle-description">{TOGGLE_TOOLTIPS[key]}</small>
                      </span>
                    </label>
                    {group.chart && (
                      <>
                        <div className="calculation-toggle-divider" />
                        <label
                          className="calculation-chart-toggle"
                          data-prompt-guide={groupIndex === 0 && key === group.items[0]?.[0] ? "chart-visibility" : undefined}
                        >
                          <span>Показать на графике</span>
                          <span className="calculation-chart-switch">
                            <input
                              type="checkbox"
                              role="switch"
                              aria-label={`${label}: показать на графике`}
                              checked={!disabledChartIndicatorKeys.includes(key)}
                              onChange={() => onToggleChartIndicator(key)}
                            />
                            <span aria-hidden="true"><i /></span>
                          </span>
                        </label>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
