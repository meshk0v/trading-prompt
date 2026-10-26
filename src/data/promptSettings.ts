import { tr } from '../i18n/translate'
import { ALL_INSTRUMENTS } from './instruments'

export type IndicatorGroup = {
  id: string
  label: string
  description: string
  /** Colour of the group marker and parameter values. */
  accent: string
  indicators: { id: string; code: string; name: string; description: string; parameters: string }[]
}

export const INDICATOR_GROUPS: IndicatorGroup[] = [
  {
    id: 'trend',
    label: tr('Трендовые'),
    description: tr('Направление и сила текущего тренда'),
    accent: '#8B7CFF',
    indicators: [
      {
        id: 'sma',
        code: 'SMA',
        name: 'Simple Moving Average',
        description: tr('Простая скользящая средняя'),
        parameters: '20 / 50 / 200',
      },
      {
        id: 'ema',
        code: 'EMA',
        name: 'Exponential Moving Average',
        description: tr('Экспоненциальная скользящая'),
        parameters: '12 / 26 / 50',
      },
      {
        id: 'macd',
        code: 'MACD',
        name: 'MACD',
        description: tr('Схождение и расхождение средних'),
        parameters: '12 / 26 / 9',
      },
      {
        id: 'adx',
        code: 'ADX',
        name: 'Average Directional Index',
        description: tr('Сила направленного движения'),
        parameters: '14',
      },
    ],
  },
  {
    id: 'momentum',
    label: tr('Импульсные'),
    description: tr('Перекупленность, перепроданность и импульс'),
    accent: '#4CC9F0',
    indicators: [
      {
        id: 'rsi',
        code: 'RSI',
        name: 'Relative Strength Index',
        description: tr('Индекс относительной силы'),
        parameters: '14',
      },
      {
        id: 'stoch',
        code: 'STO',
        name: 'Stochastic Oscillator',
        description: tr('Положение цены в диапазоне'),
        parameters: '14 / 3 / 3',
      },
      {
        id: 'cci',
        code: 'CCI',
        name: 'Commodity Channel Index',
        description: tr('Отклонение цены от среднего'),
        parameters: '20',
      },
      {
        id: 'williams',
        code: '%R',
        name: 'Williams %R',
        description: tr('Импульс и точки разворота'),
        parameters: '14',
      },
    ],
  },
  {
    id: 'market',
    label: tr('Объём и волатильность'),
    description: tr('Активность рынка и диапазон движения'),
    accent: '#FF8A6B',
    indicators: [
      {
        id: 'bb',
        code: 'BB',
        name: 'Bollinger Bands',
        description: tr('Границы текущей волатильности'),
        parameters: '20 / 2',
      },
      {
        id: 'atr',
        code: 'ATR',
        name: 'Average True Range',
        description: tr('Средний истинный диапазон'),
        parameters: '14',
      },
      {
        id: 'obv',
        code: 'OBV',
        name: 'On-Balance Volume',
        description: tr('Баланс объёма покупок и продаж'),
        parameters: 'Volume',
      },
      {
        id: 'vwap',
        code: 'VWAP',
        name: 'Volume Weighted Average Price',
        description: tr('Средняя цена с учётом объёма'),
        parameters: 'Session',
      },
    ],
  },
]

export type FundamentalGroup = {
  id: string
  label: string
  description: string
  accent: string
  items: { id: string; code: string; name: string; description: string }[]
}

export const FUNDAMENTAL_GROUPS: FundamentalGroup[] = [
  {
    id: 'macro',
    label: tr('Макроэкономика'),
    description: tr('Ключевые показатели и решения регуляторов'),
    accent: '#8B7CFF',
    items: [
      {
        id: 'calendar',
        code: 'CAL',
        name: tr('Экономический календарь'),
        description: tr('Публикации высокой и средней важности'),
      },
      {
        id: 'central-banks',
        code: 'CB',
        name: tr('Центральные банки'),
        description: tr('Решения по ставкам и заявления регуляторов'),
      },
      { id: 'inflation', code: 'CPI', name: tr('Инфляция'), description: tr('CPI, PPI и инфляционные ожидания') },
      {
        id: 'labor',
        code: 'NFP',
        name: tr('Рынок труда'),
        description: tr('Занятость, безработица и динамика зарплат'),
      },
    ],
  },
  {
    id: 'news',
    label: tr('Новости'),
    description: tr('События, способные повлиять на стоимость активов'),
    accent: '#4CC9F0',
    items: [
      {
        id: 'breaking-news',
        code: '24H',
        name: tr('Срочные новости'),
        description: tr('Важные события в режиме реального времени'),
      },
      {
        id: 'geopolitics',
        code: 'GEO',
        name: tr('Геополитика'),
        description: tr('Конфликты, санкции и международные отношения'),
      },
      {
        id: 'corporate',
        code: 'EPS',
        name: tr('Корпоративные события'),
        description: tr('Отчётность, прогнозы и действия компаний'),
      },
      {
        id: 'commodities-news',
        code: 'CMD',
        name: tr('Сырьевые рынки'),
        description: tr('Запасы, производство и логистика сырья'),
      },
    ],
  },
  {
    id: 'sentiment',
    label: tr('Рыночные настроения'),
    description: tr('Позиционирование участников и склонность к риску'),
    accent: '#FF8A6B',
    items: [
      {
        id: 'cot',
        code: 'COT',
        name: tr('Отчёты COT'),
        description: tr('Позиции крупных участников фьючерсного рынка'),
      },
      {
        id: 'fear-greed',
        code: 'F&G',
        name: tr('Индекс страха и жадности'),
        description: tr('Общий уровень аппетита инвесторов к риску'),
      },
      {
        id: 'bond-yields',
        code: 'YLD',
        name: tr('Доходности облигаций'),
        description: tr('Кривая доходности и ожидания по ставкам'),
      },
      {
        id: 'market-flow',
        code: 'FLOW',
        name: tr('Потоки капитала'),
        description: tr('Переток средств между классами активов'),
      },
    ],
  },
]

export const WATCHLIST_GROUPS = [
  { key: 'major', label: tr('Мажорные'), color: '#CFCDE3', pairs: ALL_INSTRUMENTS['Мажорные'] },
  { key: 'minor', label: tr('Минорные'), color: '#9A98B5', pairs: ALL_INSTRUMENTS['Минорные'] },
  { key: 'exotic', label: tr('Экзотические'), color: '#8B7CFF', pairs: ALL_INSTRUMENTS['Экзотические'] },
]
