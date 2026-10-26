import { ASSET_TYPE_OPTIONS, TIMEFRAME_OPTIONS } from '../../data/instruments'
import type { PromptBuilderState } from '../../hooks/usePromptBuilder'
import { useI18n } from '../../i18n/context'
import { tr } from '../../i18n/translate'
import { parseBarCount } from '../../utils/buildPrompt'
import CustomSelect from '../CustomSelect'
import { BoltIcon, GearIcon, SparkleBoldIcon, SparkleIcon } from '../icons'
import PairFlag from '../PairFlag'
import PromptPanelResizeHandle from '../PromptPanelResizeHandle'
import './PromptBuilderPanel.css'

type PromptBuilderPanelProps = {
  builder: PromptBuilderState
  hidden: boolean
  panelWidth: number
  onPanelWidthChange: (width: number) => void
  remainingPrompts: number
  promptLimit: number
  onGenerate: () => void
  onOpenMobileSettings: () => void
}

/** Prompt builder: a side panel on desktop, a compact action bar on phones. */
export default function PromptBuilderPanel({
  builder,
  hidden,
  panelWidth,
  onPanelWidthChange,
  remainingPrompts,
  promptLimit,
  onGenerate,
  onOpenMobileSettings,
}: PromptBuilderPanelProps) {
  const { t } = useI18n()
  const historyFields = [
    { id: 'price-history', label: tr('История цены'), value: builder.priceHistory, setValue: builder.setPriceHistory },
    { id: 'indicator-history', label: tr('История индикаторов'), value: builder.indicatorHistory, setValue: builder.setIndicatorHistory },
  ]

  return (
    <div className="prompt-panel scrollable" hidden={hidden}>
      <PromptPanelResizeHandle width={panelWidth} onResize={onPanelWidthChange} />
      <div className="prompt-panel__inner">
        <div className="prompt-builder">
          <div className="prompt-builder__header">
            <div className="prompt-builder__header-icon">
              <SparkleIcon />
            </div>
            <div className="prompt-builder__header-text">
              <div className="prompt-builder__title">{t('Конструктор промпта')}</div>
              <div className="prompt-builder__subtitle">{t('Настройте инструмент, глубину данных и период графика')}</div>
            </div>
          </div>

          <div className="prompt-builder__fields">
            <div className="prompt-builder__row">
              <div data-prompt-guide="currency-pair" className="prompt-field">
                <label className="prompt-field__label">{t('Инструмент')}</label>
                <CustomSelect
                  value={builder.instruments.includes(builder.pair) ? builder.pair : builder.instruments[0]}
                  onChange={builder.setPair}
                  options={builder.instruments.map(pair => ({ label: pair, value: pair, icon: <PairFlag pair={pair} size={13} /> }))}
                  dropDown
                />
              </div>
              <div data-prompt-guide="asset-type" className="prompt-field">
                <label className="prompt-field__label">{t('Тип инструмента')}</label>
                <CustomSelect
                  value={builder.assetType}
                  onChange={builder.setAssetType}
                  options={ASSET_TYPE_OPTIONS}
                  menuWidth="min(240px, calc(100vw - 48px))"
                  menuAlign="right"
                  dropDown
                />
              </div>
            </div>

            <div data-prompt-guide="bar-count" className="prompt-data-volume">
              <div className="prompt-data-volume__title">{t('Объём данных в промпте')}</div>
              <div className="prompt-data-volume__history">
                {historyFields.map(field => (
                  <div key={field.id} className="prompt-field">
                    <label htmlFor={field.id} className="prompt-field__label prompt-field__label--small">
                      {t(field.label)}
                    </label>
                    <input
                      id={field.id}
                      className="prompt-number-input"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={field.value}
                      onChange={event => field.setValue(event.target.value)}
                      onBlur={() => field.setValue(current => String(parseBarCount(current)))}
                    />
                  </div>
                ))}
              </div>
              <div className="prompt-data-volume__timeframes">
                {builder.timeframes.map((value, index) => (
                  <div key={index} data-prompt-guide={`timeframe-${index + 1}`} className="prompt-field">
                    <div className="prompt-field__label prompt-field__label--timeframe">TF {index + 1}</div>
                    <CustomSelect
                      value={value}
                      onChange={next => builder.setTimeframe(index as 0 | 1 | 2, next)}
                      options={TIMEFRAME_OPTIONS}
                      placeholder={index > 0 ? t('Выбрать') : undefined}
                      dropDown
                    />
                  </div>
                ))}
              </div>
            </div>

            <button data-prompt-guide="create-prompt" type="button" onClick={onGenerate} className="prompt-builder__submit">
              <SparkleBoldIcon />
              {t('Собрать промпт')}
            </button>
          </div>

          {/* Phones: settings open in a dialog, only the main action stays visible. */}
          <div className="prompt-builder__mobile-actions">
            <button
              type="button"
              data-prompt-guide="mobile-settings"
              className="prompt-builder__settings-button"
              aria-label={t('Настройки конструктора промпта')}
              title={t('Настройки конструктора промпта')}
              onClick={onOpenMobileSettings}
            >
              <GearIcon />
            </button>
            <button data-prompt-guide="create-prompt" type="button" onClick={onGenerate} className="prompt-builder__mobile-submit">
              <BoltIcon />
              {t('Собрать промпт')}
            </button>
          </div>
          <div className="prompt-builder__usage">
            <span>
              {t('Доступно промптов')}{' '}
              <span className="prompt-builder__usage-count">
                {remainingPrompts}/{promptLimit}
              </span>
            </span>
          </div>

          <div data-prompt-guide="prompt-purpose" className="prompt-builder__purpose">
            <label htmlFor="prompt-purpose" className="prompt-field__label prompt-field__label--purpose">
              {t('Дополнение к промпту')}
            </label>
            <textarea
              id="prompt-purpose"
              className="prompt-builder__purpose-input"
              aria-label={t('Дополнительные требования к анализу')}
              value={builder.purpose}
              onChange={event => builder.setPurpose(event.target.value)}
              placeholder={t('Например: оцени вероятность роста или падения по данному активу в ближайший час')}
              rows={5}
            />
            <div className="prompt-builder__purpose-footer">
              <span>{t('Будет добавлено в готовый промпт')}</span>
              <span>{builder.purpose.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
