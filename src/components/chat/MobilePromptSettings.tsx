import { ASSET_TYPE_OPTIONS, TIMEFRAME_OPTIONS } from '../../data/instruments'
import type { PromptBuilderState } from '../../hooks/usePromptBuilder'
import { useI18n } from '../../i18n/context'
import { tr } from '../../i18n/translate'
import { parseBarCount } from '../../utils/buildPrompt'
import CustomSelect from '../CustomSelect'
import { SlidersIcon } from '../icons'
import PairFlag from '../PairFlag'
import './MobilePromptSettings.css'

type MobilePromptSettingsProps = {
  builder: PromptBuilderState
  onClose: () => void
}

/** Full prompt builder settings in a dialog (phones only; the side panel is hidden there). */
export default function MobilePromptSettings({ builder, onClose }: MobilePromptSettingsProps) {
  const { t } = useI18n()
  const historyFields = [
    { id: 'mobile-price-history', label: tr('История цены'), value: builder.priceHistory, setValue: builder.setPriceHistory },
    { id: 'mobile-indicator-history', label: tr('История индикаторов'), value: builder.indicatorHistory, setValue: builder.setIndicatorHistory },
  ]

  return (
    <div className="mobile-settings-overlay" onClick={onClose} onKeyDown={event => event.key === 'Escape' && onClose()}>
      <div
        className="mobile-settings message-fade"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-prompt-settings-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="mobile-settings__header">
          <div className="mobile-settings__heading">
            <div className="mobile-settings__icon">
              <SlidersIcon />
            </div>
            <div>
              <div id="mobile-prompt-settings-title" className="mobile-settings__title">
                {t('Настройки промпта')}
              </div>
              <div className="mobile-settings__subtitle">{t('Параметры генерации запроса')}</div>
            </div>
          </div>
          <button type="button" aria-label={t('Закрыть')} className="mobile-settings__close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="m3 3 8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mobile-settings__content">
          <div className="mobile-settings__row">
            <div data-prompt-guide="currency-pair" className="mobile-settings__field">
              <div className="mobile-settings__label">{t('Валютная пара')}</div>
              <CustomSelect
                value={builder.pair}
                onChange={builder.setPair}
                options={builder.instruments.map(pair => ({ label: pair, value: pair, icon: <PairFlag pair={pair} size={13} /> }))}
                dropDown
              />
            </div>
            <div data-prompt-guide="asset-type" className="mobile-settings__field">
              <div className="mobile-settings__label">{t('Тип актива')}</div>
              <CustomSelect
                value={builder.assetType}
                onChange={builder.setAssetType}
                options={ASSET_TYPE_OPTIONS}
                menuWidth="min(220px, calc(100vw - 56px))"
                menuAlign="right"
                dropDown
              />
            </div>
          </div>

          <div data-prompt-guide="bar-count" className="prompt-data-volume">
            <div className="prompt-data-volume__title">{t('Объём данных в промпте')}</div>
            <div className="prompt-data-volume__history">
              {historyFields.map(field => (
                <div key={field.id} className="mobile-settings__field">
                  <label htmlFor={field.id} className="prompt-field__label prompt-field__label--small mobile-settings__history-label">
                    {t(field.label)}
                  </label>
                  <input
                    id={field.id}
                    className="prompt-number-input mobile-settings__number-input"
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
                <div key={index} data-prompt-guide={`timeframe-${index + 1}`} className="mobile-settings__field">
                  <div className="mobile-settings__label mobile-settings__label--large">TF {index + 1}</div>
                  <CustomSelect
                    value={value}
                    onChange={next => builder.setTimeframe(index as 0 | 1 | 2, next)}
                    options={TIMEFRAME_OPTIONS}
                    placeholder={index > 0 ? t('Выбрать') : undefined}
                  />
                </div>
              ))}
            </div>
          </div>

          <div data-prompt-guide="prompt-purpose" className="mobile-settings__field">
            <div className="mobile-settings__purpose-header">
              <label htmlFor="mobile-prompt-purpose">{t('Дополнение к промпту')}</label>
              <span>{t('Необязательно')}</span>
            </div>
            <textarea
              id="mobile-prompt-purpose"
              className="mobile-settings__purpose"
              placeholder={t('Добавьте собственную задачу для AI')}
              value={builder.purpose}
              onChange={event => builder.setPurpose(event.target.value)}
            />
          </div>
        </div>

        <div className="mobile-settings__footer">
          <button type="button" className="mobile-settings__done" onClick={onClose}>
            {t('Готово')}
          </button>
        </div>
      </div>
    </div>
  )
}
