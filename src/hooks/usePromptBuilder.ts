import { useEffect, useState } from 'react'
import { CURRENCY_PAIRS, PAIR_CATEGORIES } from '../data/instruments'

function instrumentsFor(assetType: string, watchlist: string[]): string[] {
  const all = PAIR_CATEGORIES[assetType as keyof typeof PAIR_CATEGORIES] ?? CURRENCY_PAIRS
  const watched = all.filter(pair => watchlist.includes(pair))
  // With nothing from this category in the watchlist, offer the whole category.
  return watched.length > 0 ? watched : all
}

/** Form state of the prompt builder (shared by the desktop panel and the mobile settings dialog). */
export function usePromptBuilder(watchlist: string[]) {
  const [assetType, setAssetTypeState] = useState('Major')
  const [pair, setPair] = useState('EUR/USD')
  const [timeframes, setTimeframes] = useState<[string, string, string]>(['M5', '', ''])
  const [priceHistory, setPriceHistory] = useState('1000')
  const [indicatorHistory, setIndicatorHistory] = useState('1000')
  const [purpose, setPurpose] = useState('')

  const instruments = instrumentsFor(assetType, watchlist)

  const setAssetType = (value: string) => {
    setAssetTypeState(value)
    setPair(instrumentsFor(value, watchlist)[0])
  }

  const setTimeframe = (index: 0 | 1 | 2, value: string) =>
    setTimeframes(current => current.map((item, i) => (i === index ? value : item)) as [string, string, string])

  // Keep the selected pair valid when the watchlist changes.
  useEffect(() => {
    if (!instruments.includes(pair)) setPair(instruments[0])
  }, [assetType, watchlist]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    assetType,
    setAssetType,
    pair,
    setPair,
    instruments,
    timeframes,
    setTimeframe,
    priceHistory,
    setPriceHistory,
    indicatorHistory,
    setIndicatorHistory,
    purpose,
    setPurpose,
  }
}

export type PromptBuilderState = ReturnType<typeof usePromptBuilder>
