import { useState, type ReactNode } from 'react'
import CustomSelect from '../components/CustomSelect'
import PageHeader from '../components/PageHeader'
import SectionLayout, { type SectionItem } from '../components/SectionLayout'
import { useI18n } from '../i18n/context'
import { tr } from '../i18n/translate'
import './AffiliatePage.css'

type Section = 'partners' | 'funds'

type ReferralLink = {
  id: string
  name: string
  url: string
  partnerIds: string[]
  activePartners: number
  earned: number
  pendingPayout: number
  removable: boolean
}

// Demo data until the affiliate program has a backend.
const DEMO_PARTNERS = [
  { id: 'p1', name: 'Александр К.', email: 'ale***@gmail.com', date: '12.07.2026', status: 'active', earned: 8.5 },
  { id: 'p2', name: 'Мария Т.', email: 'mar***@mail.ru', date: '18.07.2026', status: 'active', earned: 3.2 },
  { id: 'p3', name: 'Дмитрий Р.', email: 'dmi***@yandex.ru', date: '22.07.2026', status: 'pending', earned: 0 },
  { id: 'p4', name: 'Светлана М.', email: 'sve***@gmail.com', date: '25.07.2026', status: 'active', earned: 19 },
  { id: 'p5', name: 'Игорь Л.', email: 'igo***@proton.me', date: '01.08.2026', status: 'active', earned: 3.2 },
  { id: 'p6', name: 'Анна С.', email: 'ann***@mail.ru', date: '03.08.2026', status: 'inactive', earned: 0 },
]

const DEMO_WITHDRAWALS = [
  { id: 'w1', date: '28.07.2026', amount: '$11.70', wallet: 'TRX···xQ8F', completed: true },
  { id: 'w2', date: '04.08.2026', amount: '$8.50', wallet: 'TRX···xQ8F', completed: false },
]

const REWARD_SHARE = 0.2
const REFERRAL_BASE_URL = 'https://binum.ai/ref/USR-48291'

const PAYOUT_TERMS = [
  tr('Выплаты производятся автоматически в момент пополнения реферала'),
  tr('Минимальная сумма вывода — нет (выплаты автоматические)'),
  tr('Комиссия за вывод от $0.01 до $2 в зависимости от сети (TRC20, ERC20, BEP20, Polygon)'),
  tr('Валюта выплат — USDT'),
  tr('Ваш реферальный доход — 50% от каждой оплаты реферала'),
]

const NETWORK_OPTIONS = [
  { label: 'TRC20 · TRON', value: 'TRC20' },
  { label: 'ERC20 · Ethereum', value: 'ERC20' },
  { label: 'BEP20 · BNB Smart Chain', value: 'BEP20' },
  { label: 'Polygon', value: 'Polygon' },
]

const usd = (value: number) => `$${value.toFixed(2)}`

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M2.5 4h9M5 4V2.5h4V4m-5.5 0 .6 8h5.8l.6-8M5.7 6.2v3.5M8.3 6.2v3.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

type StatCardProps = { label: string; value: string; note: string; icon: ReactNode; accent?: boolean }

function StatCard({ label, value, note, icon, accent }: StatCardProps) {
  return (
    <div className={`affiliate-stat${accent ? ' affiliate-stat--accent' : ''}`}>
      <div className="affiliate-stat__glow" />
      <div className="affiliate-stat__top">
        <div className="affiliate-stat__label">{label}</div>
        <div className="affiliate-stat__icon">{icon}</div>
      </div>
      <div className="affiliate-stat__bottom">
        <div className="affiliate-stat__value">{value}</div>
        <div className="affiliate-stat__note">{note}</div>
      </div>
    </div>
  )
}

/** Affiliate dashboard for signed-in users (demo data). */
export default function AffiliatePage({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const [section, setSection] = useState<Section>('partners')
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  const [selectedLinkId, setSelectedLinkId] = useState('all')
  const [addingLink, setAddingLink] = useState(false)
  const [newLinkName, setNewLinkName] = useState('')
  const [links, setLinks] = useState<ReferralLink[]>([
    {
      id: 'standard',
      name: tr('Стандартная ссылка'),
      url: REFERRAL_BASE_URL,
      partnerIds: DEMO_PARTNERS.map(partner => partner.id),
      activePartners: DEMO_PARTNERS.filter(partner => partner.status === 'active').length,
      earned: 34.9,
      pendingPayout: 22.7,
      removable: false,
    },
  ])
  const [wallet, setWallet] = useState('')
  const [walletNetwork, setWalletNetwork] = useState('TRC20')
  const [walletSaved, setWalletSaved] = useState(false)

  const selectedLink = links.find(link => link.id === selectedLinkId)
  const visiblePartners = selectedLink
    ? DEMO_PARTNERS.filter(partner => selectedLink.partnerIds.includes(partner.id))
    : DEMO_PARTNERS
  const sum = (key: 'earned' | 'pendingPayout' | 'activePartners') =>
    selectedLink ? selectedLink[key] : links.reduce((total, link) => total + link[key], 0)
  const linkName = (link: ReferralLink) => (link.removable ? link.name : t(link.name))

  const copyLink = (link: ReferralLink) => {
    navigator.clipboard.writeText(link.url).catch(() => {})
    setCopiedLinkId(link.id)
    setTimeout(() => setCopiedLinkId(current => (current === link.id ? null : current)), 2000)
  }

  const createLink = () => {
    const name = newLinkName.trim()
    if (!name) return
    setLinks(current => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        name,
        url: `${REFERRAL_BASE_URL}-${current.length + 1}`,
        partnerIds: [],
        activePartners: 0,
        earned: 0,
        pendingPayout: 0,
        removable: true,
      },
    ])
    setNewLinkName('')
    setAddingLink(false)
  }

  const deleteLink = (id: string) => {
    setLinks(current => current.filter(link => link.id !== id || !link.removable))
    setSelectedLinkId(current => (current === id ? 'all' : current))
    setCopiedLinkId(current => (current === id ? null : current))
  }

  const saveWallet = () => {
    if (!wallet.trim()) return
    setWallet(wallet.trim())
    setWalletSaved(true)
  }

  const sections: SectionItem<Section>[] = [
    {
      id: 'partners',
      label: t('Партнёры'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="10.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M1 14c0-2.5 2-4.5 4.5-4.5M15 14c0-2.5-2-4.5-4.5-4.5M7 14c0-2.5 1.3-4 3-4s3 1.5 3 4"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: 'funds',
      label: t('Средства'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="4" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1 7h14" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="4.5" cy="10" r="1" fill="currentColor" />
        </svg>
      ),
    },
  ]

  const stats: StatCardProps[] = [
    {
      label: t('Всего партнёров'),
      value: String(visiblePartners.length),
      note: selectedLink ? linkName(selectedLink) : t('по всем ссылкам'),
      icon: (
        <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="5" cy="5" r="2.3" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="11.5" cy="5.5" r="1.8" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M1.5 14c0-2.7 1.5-4.5 3.5-4.5s3.5 1.8 3.5 4.5M9 10c1.9 0 3.5 1.5 3.5 3.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: t('Активных'),
      value: String(sum('activePartners')),
      note: t('приносят доход'),
      icon: (
        <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M2 13V9M6 13V6M10 13V8M14 13V3M1 13.5h14"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: t('Заработано'),
      value: usd(sum('earned')),
      note: t('за весь период'),
      icon: (
        <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M10.5 5.5H7.2a1.7 1.7 0 0 0 0 3.4h1.6a1.7 1.7 0 0 1 0 3.4H5.5M8 3.8v1.7M8 12.3V14"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: t('К выплате'),
      value: usd(sum('pendingPayout')),
      note: t('доступно сейчас'),
      accent: true,
      icon: (
        <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1.5" y="3.5" width="13" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="5" cy="10" r="1.2" fill="currentColor" />
        </svg>
      ),
    },
  ]

  return (
    <div className="affiliate-page message-fade">
      <PageHeader
        icon={
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="4" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="12" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M6.5 7L9.5 5M6.5 9L9.5 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        }
        title={t('Партнёрская программа')}
        description={t('Приглашайте друзей и получайте 20% от их оплаты')}
        onClose={onClose}
      />

      <SectionLayout
        items={sections}
        active={section}
        onChange={setSection}
        tone="solid"
        className="affiliate-sections"
      >
        <div className="affiliate-page__body scrollable">
          {section === 'partners' && (
            <div className="affiliate-page__stack">
              <div className="affiliate-card">
                <div className="affiliate-links__header">
                  <div>
                    <div className="affiliate-card__title">{t('Реферальные ссылки')}</div>
                    <div className="affiliate-card__subtitle">
                      {t('Создавайте отдельную ссылку для каждого источника трафика')}
                    </div>
                  </div>
                  <button type="button" onClick={() => setAddingLink(value => !value)} className="affiliate-links__add">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    {t('Добавить ссылку')}
                  </button>
                </div>

                {addingLink && (
                  <div className="affiliate-links__form">
                    <input
                      type="text"
                      value={newLinkName}
                      onChange={event => setNewLinkName(event.target.value)}
                      onKeyDown={event => event.key === 'Enter' && createLink()}
                      placeholder={t('Введите имя, например Telegram или YouTube')}
                      className="affiliate-links__name-input"
                    />
                    <button
                      type="button"
                      onClick={createLink}
                      disabled={!newLinkName.trim()}
                      className="affiliate-button"
                    >
                      {t('Сохранить')}
                    </button>
                  </div>
                )}

                <div className="affiliate-links__list">
                  {links.map(link => (
                    <div key={link.id} className="affiliate-link">
                      <div className="affiliate-link__name-group">
                        <div className="affiliate-link__name">{linkName(link)}</div>
                        {!link.removable && <div className="affiliate-link__badge">{t('Стандартная')}</div>}
                      </div>
                      <div title={link.url} className="affiliate-link__url">
                        {link.url}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyLink(link)}
                        className={`affiliate-link__copy${copiedLinkId === link.id ? ' is-copied' : ''}`}
                      >
                        {copiedLinkId === link.id ? t('Скопировано') : t('Копировать')}
                      </button>
                      {link.removable ? (
                        <button
                          type="button"
                          onClick={() => deleteLink(link.id)}
                          aria-label={t('Удалить ссылку {name}', { name: link.name })}
                          className="affiliate-link__delete"
                        >
                          <TrashIcon />
                        </button>
                      ) : (
                        <span className="affiliate-link__placeholder" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="affiliate-card">
                <p className="affiliate-card__kicker">{t('Показывать статистику по ссылке')}</p>
                <div className="affiliate-filter">
                  <CustomSelect
                    value={selectedLinkId}
                    onChange={setSelectedLinkId}
                    options={[
                      { label: t('Все ссылки'), value: 'all' },
                      ...links.map(link => ({ label: linkName(link), value: link.id })),
                    ]}
                    dropDown
                  />
                </div>
              </div>

              <div className="affiliate-stats">
                {stats.map(stat => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </div>

              <div className="affiliate-card affiliate-table">
                <div className="affiliate-table__header">
                  <span className="affiliate-card__title">{t('Список партнёров')}</span>
                  <span className="affiliate-table__count">
                    {t('{count} пользователей', { count: visiblePartners.length })}
                  </span>
                </div>
                <div className="affiliate-table__scroll">
                  <div className="affiliate-partner affiliate-partner--head">
                    {[t('Имя'), 'Email', t('Дата'), t('Пополнения'), t('Доход')].map(heading => (
                      <span key={heading}>{heading}</span>
                    ))}
                  </div>
                  {visiblePartners.map(partner => (
                    <div key={partner.id} className="affiliate-partner">
                      <span className="affiliate-partner__name">{partner.name}</span>
                      <span>{partner.email}</span>
                      <span>{partner.date}</span>
                      <span>{usd(partner.earned / REWARD_SHARE)}</span>
                      <span className="affiliate-partner__earned">{usd(partner.earned)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'funds' && (
            <div className="affiliate-page__stack">
              <div className="affiliate-card affiliate-card--padded">
                <div className="affiliate-wallet__title">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="1" y="4" width="14" height="9" rx="2" stroke="var(--muted)" strokeWidth="1.3" />
                    <path d="M1 7h14" stroke="var(--muted)" strokeWidth="1.3" />
                    <circle cx="4.5" cy="10" r="1" fill="var(--accent)" />
                  </svg>
                  <span className="affiliate-card__title">{t('Кошелёк для вывода')}</span>
                </div>
                <p className="affiliate-wallet__text">
                  {walletSaved
                    ? t('Сохранённый кошелёк используется для автоматического получения выплат.')
                    : t('Укажите адрес кошелька USDT ({network}) для автоматического получения выплат.', {
                        network: walletNetwork,
                      })}
                </p>
                {walletSaved ? (
                  <div className="affiliate-wallet__saved">
                    <div className="affiliate-wallet__saved-info">
                      <div className="affiliate-wallet__saved-icon">
                        <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <rect x="2" y="5" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
                          <path d="M2 8.5h16" stroke="currentColor" strokeWidth="1.4" />
                          <circle cx="6" cy="12.5" r="1.2" fill="currentColor" />
                        </svg>
                      </div>
                      <div className="affiliate-wallet__saved-text">
                        <div className="affiliate-wallet__saved-meta">
                          <span>USDT · {walletNetwork}</span>
                          <span className="affiliate-wallet__saved-badge">{t('СОХРАНЁН')}</span>
                        </div>
                        <div title={wallet} className="affiliate-wallet__address">
                          {wallet}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="affiliate-wallet__remove"
                      onClick={() => {
                        setWalletSaved(false)
                        setWallet('')
                      }}
                    >
                      <TrashIcon />
                      {t('Удалить')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="affiliate-wallet__network">
                      <div className="affiliate-wallet__network-label">{t('Сеть выплат')}</div>
                      <CustomSelect
                        value={walletNetwork}
                        onChange={setWalletNetwork}
                        options={NETWORK_OPTIONS}
                        dropDown
                      />
                    </div>
                    <div className="affiliate-wallet__form">
                      <input
                        className="affiliate-wallet__input"
                        type="text"
                        placeholder={t('Адрес кошелька USDT ({network})', { network: walletNetwork })}
                        value={wallet}
                        onChange={event => setWallet(event.target.value)}
                      />
                      <button type="button" onClick={saveWallet} className="affiliate-button affiliate-button--large">
                        {t('Сохранить')}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="affiliate-terms">
                <div className="affiliate-terms__icon">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                    <circle cx="7.5" cy="7.5" r="6" stroke="var(--muted)" strokeWidth="1.3" />
                    <path d="M7.5 4.5v4M7.5 10v.5" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="affiliate-terms__title">{t('Условия выплат')}</p>
                  <ul className="affiliate-terms__list">
                    {PAYOUT_TERMS.map(line => (
                      <li key={line}>{t(line)}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="affiliate-balances">
                {[
                  { label: t('Доступно к выводу'), value: '$22.70' },
                  { label: t('Следующая выплата'), value: '11.08.2026' },
                ].map(item => (
                  <div key={item.label} className="affiliate-card affiliate-balance">
                    <div className="affiliate-balance__label">{item.label}</div>
                    <div className="affiliate-balance__value">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="affiliate-card affiliate-withdrawals">
                <div className="affiliate-withdrawals__header">
                  <span className="affiliate-card__title">{t('История выводов')}</span>
                </div>
                {DEMO_WITHDRAWALS.length === 0 ? (
                  <div className="affiliate-withdrawals__empty">{t('Выводов пока не было')}</div>
                ) : (
                  <>
                    <div className="affiliate-withdrawal affiliate-withdrawal--head">
                      {[t('Дата'), t('Сумма'), t('Кошелёк'), t('Статус')].map(heading => (
                        <span key={heading}>{heading}</span>
                      ))}
                    </div>
                    {DEMO_WITHDRAWALS.map(withdrawal => (
                      <div key={withdrawal.id} className="affiliate-withdrawal">
                        <span>{withdrawal.date}</span>
                        <span className="affiliate-withdrawal__amount">{withdrawal.amount}</span>
                        <span>{withdrawal.wallet}</span>
                        <span className={`affiliate-withdrawal__status${withdrawal.completed ? ' is-completed' : ''}`}>
                          <span />
                          {withdrawal.completed ? t('Выплачено') : t('В обработке')}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </SectionLayout>
    </div>
  )
}
