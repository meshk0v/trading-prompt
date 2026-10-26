export const ALL_INSTRUMENTS: Record<string, string[]> = {
  'Мажорные':    ['EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','USD/CAD','NZD/USD','EUR/JPY','GBP/JPY','EUR/GBP','EUR/CHF','AUD/JPY','GBP/CHF','NZD/JPY','AUD/NZD','CHF/JPY','EUR/AUD','GBP/AUD','EUR/CAD','GBP/CAD'],
  'Минорные':    ['AUD/CAD','AUD/CHF','CAD/CHF','CAD/JPY','EUR/DKK','EUR/NOK','EUR/NZD','EUR/PLN','EUR/SEK','GBP/NZD','NZD/CAD','NZD/CHF','AUD/SGD','CAD/SGD','EUR/CZK','EUR/HUF','EUR/RON','GBP/DKK','GBP/NOK','GBP/PLN','GBP/SEK','GBP/SGD','NZD/SGD','SGD/JPY','USD/CNH'],
  'Экзотические':['USD/TRY','USD/ZAR','USD/MXN','USD/SGD','USD/HKD','EUR/TRY','USD/BRL','USD/PLN','USD/NOK','USD/SEK','USD/DKK','EUR/NOK','USD/THB','USD/IDR','USD/INR','USD/PHP','USD/KRW','USD/CZK','USD/HUF','USD/RON','USD/ILS','USD/AED','USD/SAR','USD/QAR','USD/EGP','EUR/ZAR','GBP/ZAR','EUR/MXN'],
  'Крипто':      ['BTC/USD','ETH/USD','BNB/USD','XRP/USD','SOL/USD','ADA/USD','AVAX/USD','DOT/USD','MATIC/USD','LINK/USD','LTC/USD','ATOM/USD','DOGE/USD','TRX/USD'],
  'Товары':      ['XAU/USD','XAG/USD','OIL/USD','BRENT/USD','GAS/USD','COPPER/USD','WHEAT/USD','CORN/USD','PLATINUM/USD'],
  'Индексы':     ['SPX500','NDX100','DAX40','FTSE100','NKY225','HK50','CAC40','ASX200','DJ30'],
}

export const DEFAULT_WATCHLIST = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'AUD/USD', 'USD/CHF', 'GBP/JPY', 'NZD/USD', 'USD/CAD', 'EUR/GBP', 'EUR/JPY', 'OIL/USD', 'USD/TRY', 'EUR/CHF', 'AUD/CAD', 'USD/ZAR', 'USD/NOK', 'GBP/CHF', 'EUR/AUD', 'XAG/USD']

export const PAIR_CATEGORIES = {
  Crypto:  ALL_INSTRUMENTS['Крипто'],
  Major:   ALL_INSTRUMENTS['Мажорные'],
  Minor:   ALL_INSTRUMENTS['Минорные'],
  Exotic:  ALL_INSTRUMENTS['Экзотические'],
  Товары:  ALL_INSTRUMENTS['Товары'],
  Индексы: ALL_INSTRUMENTS['Индексы'],
}
export const CURRENCY_PAIRS = Object.values(PAIR_CATEGORIES).flat()
export const TIMEFRAME_OPTIONS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M10', 'M12', 'M15', 'M20', 'M30', 'H1', 'H2', 'H3', 'H4', 'H6', 'H8', 'H12', 'D1', 'W1', 'MN']
  .map(period => ({ label: period, value: period }))

export const ASSET_TYPE_OPTIONS = ['Crypto', 'Major', 'Minor', 'Exotic'].map(type => ({ label: type, value: type }))
