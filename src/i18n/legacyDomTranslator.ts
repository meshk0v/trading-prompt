// TEMPORARY: translates already-rendered Russian text by patching the DOM.
// Kept only while components migrate to t(); removed at the end of the refactor.
import { en as RU_TO_EN } from './en'
import type { Language as AppLanguage } from './translate'
const EN_TO_RU = Object.fromEntries(Object.entries(RU_TO_EN).map(([ru, en]) => [en, ru]))
const ATTRIBUTES = ['aria-label', 'title', 'placeholder', 'src'] as const

function translateValue(value: string, language: AppLanguage) {
  const dictionary = language === 'en' ? RU_TO_EN : EN_TO_RU
  const leading = value.match(/^\s*/)?.[0] ?? ''
  const trailing = value.match(/\s*$/)?.[0] ?? ''
  const core = value.trim()
  if (!core) return value
  if (dictionary[core]) return `${leading}${dictionary[core]}${trailing}`

  let translated = core
  for (const [source, target] of Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length)) {
    if (translated.includes(source)) translated = translated.split(source).join(target)
  }
  return translated === core ? value : `${leading}${translated}${trailing}`
}

function translateNode(node: Node, language: AppLanguage) {
  if (node.nodeType === Node.TEXT_NODE && node.textContent) {
    const next = translateValue(node.textContent, language)
    if (next !== node.textContent) node.textContent = next
    return
  }
  if (!(node instanceof Element)) return

  for (const attribute of ATTRIBUTES) {
    const value = node.getAttribute(attribute)
    if (!value) continue
    const next = translateValue(value, language)
    if (next !== value) node.setAttribute(attribute, next)
  }
  for (const child of Array.from(node.childNodes)) translateNode(child, language)
}

export function applyAppLanguage(language: AppLanguage) {
  document.documentElement.lang = language
  translateNode(document.body, language)

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') translateNode(mutation.target, language)
      if (mutation.type === 'attributes') translateNode(mutation.target, language)
      for (const node of Array.from(mutation.addedNodes)) translateNode(node, language)
    }
  })
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRIBUTES],
  })
  return () => observer.disconnect()
}
