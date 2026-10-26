import { useEffect, useState } from 'react'
import type { AuthUser } from '../../api/auth'
import PageHeader from '../../components/PageHeader'
import PairFlag from '../../components/PairFlag'
import { ALL_INSTRUMENTS } from '../../data/instruments'
import AccountSettings from './AccountSettings'
import CreditsSettings from './CreditsSettings'

export default function SettingsPage({ user, onUserUpdate, initialSection, onClose, watchlist, setWatchlist }: { user: AuthUser | null; onUserUpdate?: (user: AuthUser) => void; initialSection?: string; onClose: () => void; watchlist: string[]; setWatchlist: React.Dispatch<React.SetStateAction<string[]>> }) {
  type Section = 'account' | 'prompt-settings' | 'subscription'
  const [section, setSection] = useState<Section>((initialSection as Section) || 'account')
  const [sigTab, setSigTab] = useState<'indicators' | 'fundamental' | 'watchlist'>('indicators')

  useEffect(() => {
    if (initialSection) setSection(initialSection as Section)
  }, [initialSection])

  // ── Prompt data-source state ────────────────────────────────
  const [indicatorEnabled, setIndicatorEnabled] = useState<Record<string, boolean>>({})
  const [fundamentalEnabled, setFundamentalEnabled] = useState<Record<string, boolean>>({})

  const sidebarItems: { id: Section; label: string; icon: React.ReactElement }[] = [
    { id: 'account', label: 'Аккаунт', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { id: 'prompt-settings', label: 'Настройки', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M3.2 3.2l1.4 1.4M10.4 10.4l1.4 1.4M3.2 11.8l1.4-1.4M10.4 4.6l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { id: 'subscription', label: 'Кредиты', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="3.5" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6.5h12" stroke="currentColor" strokeWidth="1.3"/><circle cx="4.5" cy="9.5" r="1" fill="currentColor"/></svg> },
  ]


  return (
    <div className="message-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Header */}
      {(() => {
        const sectionDescriptions: Record<string, string> = {
          account: 'Управление профилем и данными аккаунта',
          'prompt-settings': 'Общие настройки и настройки генерации промптов',
          subscription: 'Пополнение баланса для создания готовых промптов',
        }
        const item = sidebarItems.find(i => i.id === section)
        return (
          <PageHeader
            icon={item?.icon}
            title={item?.label ?? ''}
            description={sectionDescriptions[section]}
            onClose={onClose}
          />
        )
      })()}

      {/* Content */}
      <div className={section === 'prompt-settings' || section === 'subscription' ? '' : `scrollable settings-body${section === 'account' ? ' settings-body--account' : ''}`} style={{ flex: 1, overflowY: section === 'prompt-settings' || section === 'subscription' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', padding: section === 'prompt-settings' || section === 'subscription' ? '0' : section === 'account' ? '32px 24px' : '28px 36px', boxSizing: 'border-box', background: 'var(--bg)' }}>
        <div style={{ maxWidth: (section === 'subscription' || section === 'prompt-settings') ? '100%' : section === 'account' ? 960 : 680, width: '100%', margin: section === 'prompt-settings' || section === 'subscription' ? '0' : '0 auto', display: 'flex', flexDirection: 'column', gap: section === 'subscription' ? 0 : '20px', flex: section === 'prompt-settings' || section === 'subscription' ? 1 : undefined, overflow: section === 'prompt-settings' || section === 'subscription' ? 'hidden' : undefined }}>

            {/* ── ACCOUNT ─────────────────────────────────────── */}
            {section === 'account' && <AccountSettings user={user} onUserUpdate={onUserUpdate} />}

            {/* ── PROMPT SETTINGS (Indicators + Watchlist) ─────── */}
            {section === 'prompt-settings' && (() => {
              const indicatorGroups = [
                {
                  id: 'trend', label: 'Трендовые', desc: 'Направление и сила текущего тренда', accent: '#8B7CFF',
                  indicators: [
                    { id: 'sma', code: 'SMA', name: 'Simple Moving Average', description: 'Простая скользящая средняя', parameters: '20 / 50 / 200' },
                    { id: 'ema', code: 'EMA', name: 'Exponential Moving Average', description: 'Экспоненциальная скользящая', parameters: '12 / 26 / 50' },
                    { id: 'macd', code: 'MACD', name: 'MACD', description: 'Схождение и расхождение средних', parameters: '12 / 26 / 9' },
                    { id: 'adx', code: 'ADX', name: 'Average Directional Index', description: 'Сила направленного движения', parameters: '14' },
                  ],
                },
                {
                  id: 'momentum', label: 'Импульсные', desc: 'Перекупленность, перепроданность и импульс', accent: '#4CC9F0',
                  indicators: [
                    { id: 'rsi', code: 'RSI', name: 'Relative Strength Index', description: 'Индекс относительной силы', parameters: '14' },
                    { id: 'stoch', code: 'STO', name: 'Stochastic Oscillator', description: 'Положение цены в диапазоне', parameters: '14 / 3 / 3' },
                    { id: 'cci', code: 'CCI', name: 'Commodity Channel Index', description: 'Отклонение цены от среднего', parameters: '20' },
                    { id: 'williams', code: '%R', name: 'Williams %R', description: 'Импульс и точки разворота', parameters: '14' },
                  ],
                },
                {
                  id: 'market', label: 'Объём и волатильность', desc: 'Активность рынка и диапазон движения', accent: '#FF8A6B',
                  indicators: [
                    { id: 'bb', code: 'BB', name: 'Bollinger Bands', description: 'Границы текущей волатильности', parameters: '20 / 2' },
                    { id: 'atr', code: 'ATR', name: 'Average True Range', description: 'Средний истинный диапазон', parameters: '14' },
                    { id: 'obv', code: 'OBV', name: 'On-Balance Volume', description: 'Баланс объёма покупок и продаж', parameters: 'Volume' },
                    { id: 'vwap', code: 'VWAP', name: 'Volume Weighted Average Price', description: 'Средняя цена с учётом объёма', parameters: 'Session' },
                  ],
                },
              ]
              const indicators = indicatorGroups.flatMap(group => group.indicators)
              const allEnabled = indicators.every(indicator => indicatorEnabled[indicator.id] !== false)
              const enabledCount = indicators.filter(indicator => indicatorEnabled[indicator.id] !== false).length

              const Checkbox = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
                <div
                  onClick={e => { e.stopPropagation(); onClick() }}
                  style={{ width: 15, height: 15, borderRadius: '2px', background: on ? '#8B7CFF' : '#0F0F19', border: `1px solid ${on ? '#8B7CFF' : '#34344F'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s' }}
                >
                  {on && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#0D0A24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              )

              const indicatorsContent = () => (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '16px 20px', gap: '12px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '12px' }}>
                    <div>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>Технические индикаторы</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted3)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                        Активно: <span style={{ color: '#CFCDE3', fontWeight: 600 }}>{enabledCount}</span> из {indicators.length}
                      </div>
                    </div>
                    <button
                      onClick={() => { const next = !allEnabled; const upd: Record<string, boolean> = {}; indicators.forEach(indicator => { upd[indicator.id] = next }); setIndicatorEnabled(upd) }}
                      style={{ height: 30, padding: '0 14px', background: '#12121C', border: '1px solid #191926', borderRadius: '3px', cursor: 'pointer', color: '#9A98B5', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', transition: 'border-color 0.12s, color 0.12s', letterSpacing: '0.03em', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2E2E46'; e.currentTarget.style.color = '#EDEBFA' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#191926'; e.currentTarget.style.color = '#9A98B5' }}
                    >{allEnabled ? 'Снять все' : 'Выбрать все'}</button>
                  </div>

                  <div className="indicator-table-header" style={{ display: 'grid', gridTemplateColumns: '15px 34px 1fr 1fr 92px', gap: '0 12px', padding: '0 10px 6px', borderBottom: '1px solid #191926', flexShrink: 0 }}>
                    <div /><div />
                    <span style={{ fontSize: '10px', color: '#474560', fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Индикатор</span>
                    <span style={{ fontSize: '10px', color: '#474560', fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Назначение</span>
                    <span style={{ fontSize: '10px', color: '#474560', fontFamily: 'Inter, sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Параметры</span>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin', scrollbarColor: '#191926 transparent' }}>
                    {indicatorGroups.map(group => {
                      const groupEnabledCount = group.indicators.filter(indicator => indicatorEnabled[indicator.id] !== false).length
                      const allGroupEnabled = groupEnabledCount === group.indicators.length
                      return (
                        <div key={group.id} style={{ marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#0B0B12', borderTop: '1px solid #191926', borderBottom: '1px solid #191926' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                              <span style={{ width: 3, height: 14, borderRadius: '2px', background: group.id === 'market' ? 'rgb(255, 255, 255)' : group.accent, flexShrink: 0 }} />
                              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: group.id === 'market' ? 'var(--text)' : group.accent, whiteSpace: 'nowrap' }}>{group.label}</span>
                              <span className="indicator-group-description" style={{ fontSize: '11px', color: '#474560', fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.desc}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#474560' }}>{groupEnabledCount}/{group.indicators.length}</span>
                              <button
                                onClick={() => { const upd: Record<string, boolean> = {}; group.indicators.forEach(indicator => { upd[indicator.id] = !allGroupEnabled }); setIndicatorEnabled(previous => ({ ...previous, ...upd })) }}
                                style={{ height: 20, padding: '0 8px', background: 'transparent', border: '1px solid #2E2E46', borderRadius: '2px', color: '#676582', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'color 0.1s, border-color 0.1s' }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#CFCDE3'; e.currentTarget.style.borderColor = '#474560' }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#676582'; e.currentTarget.style.borderColor = '#2E2E46' }}
                              >{allGroupEnabled ? 'Снять' : 'Вкл.'}</button>
                            </div>
                          </div>
                          {group.indicators.map((indicator, index) => {
                            const on = indicatorEnabled[indicator.id] !== false
                            return (
                              <div
                                key={indicator.id}
                                className="indicator-row"
                                onClick={() => setIndicatorEnabled(previous => ({ ...previous, [indicator.id]: !on }))}
                                style={{ display: 'grid', gridTemplateColumns: '15px 34px 1fr 1fr 92px', gap: '0 12px', padding: '7px 10px', alignItems: 'center', background: on ? '#0F0F19' : 'transparent', borderBottom: `1px solid ${index < group.indicators.length - 1 ? '#14141F' : '#191926'}`, cursor: 'pointer', transition: 'background 0.1s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#14141F' }}
                                onMouseLeave={e => { e.currentTarget.style.background = on ? '#0F0F19' : 'transparent' }}
                              >
                                <Checkbox on={on} onClick={() => setIndicatorEnabled(previous => ({ ...previous, [indicator.id]: !on }))} />
                                <div style={{ width: 30, height: 30, borderRadius: '7px', background: on ? '#191926' : '#12121C', border: `1px solid ${on ? '#34344F' : '#191926'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700, color: on ? '#CFCDE3' : '#34344F' }}>{indicator.code}</span>
                                </div>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: on ? '#CFCDE3' : '#474560', transition: 'color 0.1s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{indicator.name}</span>
                                <span className="indicator-description" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: on ? '#676582' : '#34344F', transition: 'color 0.1s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{indicator.description}</span>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700, color: on ? group.accent : '#34344F', whiteSpace: 'nowrap', transition: 'color 0.1s' }}>{indicator.parameters}</span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )

              const fundamentalGroups = [
                {
                  id: 'macro', label: 'Макроэкономика', desc: 'Ключевые показатели и решения регуляторов', accent: '#8B7CFF',
                  items: [
                    { id: 'calendar', code: 'CAL', name: 'Экономический календарь', description: 'Публикации высокой и средней важности' },
                    { id: 'central-banks', code: 'CB', name: 'Центральные банки', description: 'Решения по ставкам и заявления регуляторов' },
                    { id: 'inflation', code: 'CPI', name: 'Инфляция', description: 'CPI, PPI и инфляционные ожидания' },
                    { id: 'labor', code: 'NFP', name: 'Рынок труда', description: 'Занятость, безработица и динамика зарплат' },
                  ],
                },
                {
                  id: 'news', label: 'Новости', desc: 'События, способные повлиять на стоимость активов', accent: '#4CC9F0',
                  items: [
                    { id: 'breaking-news', code: '24H', name: 'Срочные новости', description: 'Важные события в режиме реального времени' },
                    { id: 'geopolitics', code: 'GEO', name: 'Геополитика', description: 'Конфликты, санкции и международные отношения' },
                    { id: 'corporate', code: 'EPS', name: 'Корпоративные события', description: 'Отчётность, прогнозы и действия компаний' },
                    { id: 'commodities-news', code: 'CMD', name: 'Сырьевые рынки', description: 'Запасы, производство и логистика сырья' },
                  ],
                },
                {
                  id: 'sentiment', label: 'Рыночные настроения', desc: 'Позиционирование участников и склонность к риску', accent: '#FF8A6B',
                  items: [
                    { id: 'cot', code: 'COT', name: 'Отчёты COT', description: 'Позиции крупных участников фьючерсного рынка' },
                    { id: 'fear-greed', code: 'F&G', name: 'Индекс страха и жадности', description: 'Общий уровень аппетита инвесторов к риску' },
                    { id: 'bond-yields', code: 'YLD', name: 'Доходности облигаций', description: 'Кривая доходности и ожидания по ставкам' },
                    { id: 'market-flow', code: 'FLOW', name: 'Потоки капитала', description: 'Переток средств между классами активов' },
                  ],
                },
              ]
              const fundamentalItems = fundamentalGroups.flatMap(group => group.items)
              const allFundamentalEnabled = fundamentalItems.every(item => fundamentalEnabled[item.id] !== false)
              const enabledFundamentalCount = fundamentalItems.filter(item => fundamentalEnabled[item.id] !== false).length

              const fundamentalContent = () => (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '16px 20px', gap: '12px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: '12px' }}>
                    <div>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>Фундаментальный анализ</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted3)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                        Активно: <span style={{ color: '#CFCDE3', fontWeight: 600 }}>{enabledFundamentalCount}</span> из {fundamentalItems.length}
                      </div>
                    </div>
                    <button
                      onClick={() => { const next = !allFundamentalEnabled; const updated: Record<string, boolean> = {}; fundamentalItems.forEach(item => { updated[item.id] = next }); setFundamentalEnabled(updated) }}
                      style={{ height: 30, padding: '0 14px', background: '#12121C', border: '1px solid #191926', borderRadius: '3px', cursor: 'pointer', color: '#9A98B5', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', transition: 'border-color 0.12s, color 0.12s', letterSpacing: '0.03em', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2E2E46'; e.currentTarget.style.color = '#EDEBFA' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#191926'; e.currentTarget.style.color = '#9A98B5' }}
                    >{allFundamentalEnabled ? 'Снять все' : 'Выбрать все'}</button>
                  </div>

                  <div className="fundamental-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin', scrollbarColor: '#191926 transparent', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' }}>
                    {fundamentalGroups.map(group => {
                      const enabledInGroup = group.items.filter(item => fundamentalEnabled[item.id] !== false).length
                      const allGroupEnabled = enabledInGroup === group.items.length
                      return (
                        <div key={group.id} style={{ border: '1px solid #191926', borderRadius: '6px', overflow: 'hidden', background: '#0F0F19', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '9px 12px', background: '#12121C', borderBottom: '1px solid #191926' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: 3, height: 14, borderRadius: '2px', background: group.accent, flexShrink: 0 }} />
                                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{group.label}</span>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#676582' }}>{enabledInGroup}/{group.items.length}</span>
                              </div>
                              <div className="fundamental-group-description" style={{ marginTop: '3px', marginLeft: '11px', fontSize: '11px', color: '#676582', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.desc}</div>
                            </div>
                            <button
                              onClick={() => { const updated: Record<string, boolean> = {}; group.items.forEach(item => { updated[item.id] = !allGroupEnabled }); setFundamentalEnabled(previous => ({ ...previous, ...updated })) }}
                              style={{ height: 24, padding: '0 9px', background: 'transparent', border: '1px solid #2E2E46', borderRadius: '3px', color: '#7C7A98', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', flexShrink: 0 }}
                            >{allGroupEnabled ? 'Снять' : 'Вкл.'}</button>
                          </div>
                          <div className="fundamental-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' }}>
                            {group.items.map((item, index) => {
                              const on = fundamentalEnabled[item.id] !== false
                              return (
                                <div
                                  key={item.id}
                                  className="fundamental-item"
                                  onClick={() => setFundamentalEnabled(previous => ({ ...previous, [item.id]: !on }))}
                                  style={{ display: 'grid', gridTemplateColumns: '15px 36px minmax(0, 1fr)', alignItems: 'center', gap: '10px', minHeight: 58, padding: '8px 12px', borderRight: 'none', borderBottom: index < group.items.length - 1 ? '1px solid #14141F' : 'none', cursor: 'pointer', background: on ? '#0F0F19' : '#0B0B12', transition: 'background 0.12s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#14141F' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = on ? '#0F0F19' : '#0B0B12' }}
                                >
                                  <Checkbox on={on} onClick={() => setFundamentalEnabled(previous => ({ ...previous, [item.id]: !on }))} />
                                  <div style={{ width: 34, height: 30, borderRadius: '5px', background: on ? '#191926' : '#12121C', border: `1px solid ${on ? '#34344F' : '#191926'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 700, color: on ? '#CFCDE3' : '#34344F' }}>{item.code}</span>
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: on ? '#CFCDE3' : '#474560', lineHeight: 1.35, overflowWrap: 'anywhere' }}>{item.name}</div>
                                    <div className="fundamental-item-description" style={{ marginTop: '2px', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: on ? '#676582' : '#34344F', lineHeight: 1.4, overflowWrap: 'anywhere' }}>{item.description}</div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )

              const FX_GROUPS = [
                { key: 'Мажорные',     color: '#CFCDE3', pairs: ALL_INSTRUMENTS['Мажорные'] },
                { key: 'Минорные',     color: '#9A98B5', pairs: ALL_INSTRUMENTS['Минорные'] },
                { key: 'Экзотические', color: '#8B7CFF', pairs: ALL_INSTRUMENTS['Экзотические'] },
              ]
              const totalFx2 = FX_GROUPS.reduce((s,g) => s+g.pairs.length, 0)
              const selFx2 = FX_GROUPS.reduce((s,g) => s+g.pairs.filter(p => watchlist.includes(p)).length, 0)

              const sigMenuItems = [
                { id: 'indicators' as const, label: 'Индикаторы', icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M1.5 12.5h11M2.5 10l2.4-3 2.2 1.7L11.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11.5" cy="3" r="1.2" fill="currentColor"/></svg> },
                { id: 'fundamental' as const, label: 'Фундамент', icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2 12V6.5M5.3 12V3.5M8.7 12V8M12 12V1.5M1 12.5h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                { id: 'watchlist' as const, label: 'Watchlist', icon: <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.6 3.2 3.5.5-2.6 2.5.7 3.6L7 9.6 3.8 11.3l.7-3.6L2 5.2l3.5-.5L7 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
              ]

              return (
                <>
                  {/* Mobile tab bar — hidden on desktop, shown on mobile */}
                  <div className="sig-mobile-tabs" style={{ display: 'none', borderBottom: '1px solid var(--border)', background: 'var(--card)', padding: '8px 14px', gap: '8px', flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
                    {sigMenuItems.map(item => {
                      const active = sigTab === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSigTab(item.id)}
                          style={{
                            flex: '1 0 auto', minWidth: 112, height: 38,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                            background: active ? 'rgba(139,124,255,0.16)' : 'transparent',
                            border: `1px solid ${active ? 'rgba(139,124,255,0.35)' : 'transparent'}`,
                            borderRadius: '6px',
                            color: active ? '#B9AFFF' : '#7C7A98',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px', fontWeight: active ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            position: 'relative',
                          }}
                        >
                          <span style={{ flexShrink: 0 }}>{item.icon}</span>
                          {item.label}
                        </button>
                      )
                    })}
                  </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                  {/* Left sidebar — desktop only */}
                  <div className="sig-sidebar" style={{ width: 200, flexShrink: 0, background: 'var(--card)', borderRight: '1px solid var(--border2)', display: 'flex', flexDirection: 'column' }}>
                    <nav style={{ padding: '12px 10px', flex: 1 }}>
                      {sigMenuItems.map(item => {
                        const active = sigTab === item.id
                        return (
                          <button key={item.id} onClick={() => setSigTab(item.id)} style={{ width: '100%', height: 40, display: 'flex', alignItems: 'center', gap: '9px', padding: '0 11px', background: active ? 'rgba(139,124,255,0.10)' : 'transparent', border: `1px solid ${active ? 'rgba(139,124,255,0.35)' : 'transparent'}`, borderRadius: '6px', color: active ? '#B9AFFF' : '#9A98B5', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: active ? 600 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', marginBottom: '3px' }}
                            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#0F0F19'; e.currentTarget.style.color = '#8B7CFF' } }}
                            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9A98B5' } }}
                          >
                            <span style={{ flexShrink: 0 }}>{item.icon}</span>
                            {item.label}
                          </button>
                        )
                      })}
                    </nav>
                  </div>

                  {/* Right content */}
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                    {/* Indicators tab */}
                    {sigTab === 'indicators' && indicatorsContent()}

                    {/* Fundamental analysis tab */}
                    {sigTab === 'fundamental' && fundamentalContent()}

                    {/* Watchlist tab */}
                    {sigTab === 'watchlist' && (
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '16px 20px', gap: '14px', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                          <div>
                            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>Валютные пары</div>
                            <div style={{ fontSize: '12px', color: 'var(--muted3)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                              Активно: <span style={{ color: '#CFCDE3', fontWeight: 600 }}>{selFx2}</span> из {totalFx2}
                            </div>
                          </div>
                          <button onClick={() => setWatchlist(p => p.filter(x => !FX_GROUPS.some(g => g.pairs.includes(x))))} style={{ height: 34, padding: '0 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '5px', color: 'var(--muted2)', fontSize: '12px', fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.12s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2E2E46'; e.currentTarget.style.color = '#EDEBFA' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted2)' }}
                          >Сбросить всё</button>
                        </div>
                        <div className="watchlist-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent', display: 'flex', flexDirection: 'column', gap: '18px', paddingRight: '8px', paddingBottom: '16px' }}>
                          {FX_GROUPS.map(group => {
                            const hex = group.color
                            const sel = group.pairs.filter(p => watchlist.includes(p))
                            const allOn = sel.length === group.pairs.length
                            return (
                              <div key={group.key}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: 3, height: 16, borderRadius: '2px', background: hex }} />
                                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>{group.key}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--muted3)', fontFamily: 'JetBrains Mono, monospace' }}>{sel.length}/{group.pairs.length}</span>
                                  </div>
                                  <button onClick={() => allOn ? setWatchlist(p => p.filter(x => !group.pairs.includes(x))) : setWatchlist(p => [...p, ...group.pairs.filter(x => !p.includes(x))])} style={{ height: 26, padding: '0 10px', background: '#12121C', border: '1px solid #191926', borderRadius: '5px', color: '#9A98B5', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.12s' }}>{allOn ? 'Снять все' : 'Выбрать все'}</button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(156px, 1fr))', gap: '4px' }}>
                                  {group.pairs.map(pair => {
                                    const on = watchlist.includes(pair)
                                    return (
                                      <div
                                        key={pair}
                                        onClick={() => setWatchlist(p => on ? p.filter(x => x !== pair) : [...p, pair])}
                                        style={{ background: on ? '#0F0F19' : '#12121C', border: `1px solid ${on ? '#2E2E46' : '#191926'}`, borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#14141F'; e.currentTarget.style.borderColor = '#2E2E46' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = on ? '#0F0F19' : '#12121C'; e.currentTarget.style.borderColor = on ? '#2E2E46' : '#191926' }}
                                      >
                                        <div style={{ width: 14, height: 14, borderRadius: '2px', background: on ? '#8B7CFF' : '#0F0F19', border: `1px solid ${on ? '#8B7CFF' : '#34344F'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.12s' }}>
                                          {on && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4L3 6L7 2" stroke="#0D0A24" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                        </div>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', opacity: on ? 1 : 0.4, transition: 'opacity 0.12s', flexShrink: 0 }}>
                                          <PairFlag pair={pair} size={13} />
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: on ? '#CFCDE3' : '#474560', fontFamily: 'JetBrains Mono, monospace', transition: 'color 0.12s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{pair}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                </>
              )
            })()}

            {/* ── CREDITS ──────────────────────────────────────── */}
            {section === 'subscription' && <CreditsSettings />}


        </div>
      </div>
    </div>
  )
}
