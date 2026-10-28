// Lists t('…') strings that have no English translation in src/i18n/en.ts,
// and dictionary entries that are no longer used anywhere.
// A key also counts as used when it appears as a plain string literal (data passed to t() later,
// e.g. FAQ items) or as an error message returned by the PHP API.
// Also refreshes src/i18n/textSections.json: which part of the site each text belongs to,
// used to group texts in the admin text editor.
// Usage: npm run i18n:check
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve(import.meta.dirname, '../src')
const API = path.resolve(import.meta.dirname, '../public/api')
const SECTIONS_FILE = path.join(SRC, 'i18n/textSections.json')

// Part of the site by source file (paths relative to src/). The first match wins.
const SECTION_RULES = [
  [/^pages\/TextsPage/, 'admin'],
  [/^components\/layout\//, 'layout'],
  [/^components\/PromptBuilderGuide/, 'guide'],
  [/^components\/(AuthModal|LimitModal)/, 'auth'],
  [/^(pages\/FaqPage|data\/faq)/, 'faq'],
  [/^(pages\/(Public)?AffiliatePage|data\/affiliate)/, 'affiliate'],
  [/^(pages\/SupportPage|data\/supportTickets)/, 'support'],
  [/^pages\/EconomicCalendarPage/, 'calendar'],
  [/^(pages\/LegalPage|data\/legal)/, 'legal'],
  [/^pages\/settings\/CreditsSettings/, 'credits'],
  [/^(pages\/settings\/prompt\/|data\/promptSettings)/, 'prompt-settings'],
  [/^(pages\/settings\/|components\/AccountBalanceSummary)/, 'account'],
  [/^data\/(instruments|mockMarketData)/, 'instruments'],
  [/^(components\/chat\/|components\/|hooks\/|utils\/|data\/greetings|App\.tsx)/, 'chat'],
  [/^(api\/|\.\.\/public\/api\/)/, 'errors'],
]

function sectionOf(file) {
  const relative = path.relative(SRC, file).split(path.sep).join('/')
  return SECTION_RULES.find(([pattern]) => pattern.test(relative))?.[1] ?? 'other'
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : []
  })
}

function unescape(text) {
  return text.replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n')
}

const dictionarySource = fs.readFileSync(path.join(SRC, 'i18n/en.ts'), 'utf8')
const dictionary = new Set(
  [
    ...dictionarySource.matchAll(/^\s*'((?:[^'\\]|\\.)*)'\s*:/gm),
    ...dictionarySource.matchAll(/^\s*"((?:[^"\\]|\\.)*)"\s*:/gm),
  ].map(m => unescape(m[1])),
)

const used = new Map()
// Every part of the site where a dictionary text appears.
const sectionsByKey = new Map()
const addSection = (key, file) => {
  if (!sectionsByKey.has(key)) sectionsByKey.set(key, new Set())
  sectionsByKey.get(key).add(sectionOf(file))
}
for (const file of walk(SRC)) {
  if (file.endsWith(path.join('i18n', 'en.ts'))) continue
  const source = fs.readFileSync(file, 'utf8')
  // t('…'), t("…") and translatable data marked with tr('…')
  for (const match of source.matchAll(/\b(?:t|tr)\(\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1/g)) {
    const key = unescape(match[2])
    if (!/[А-Яа-яЁё]/.test(key)) continue
    if (!used.has(key)) used.set(key, path.relative(SRC, file))
    addSection(key, file)
  }
}

const referenced = new Set(used.keys())
const sources = [
  ...walk(SRC).filter(file => !file.endsWith(path.join('i18n', 'en.ts'))),
  ...fs
    .readdirSync(API)
    .filter(name => name.endsWith('.php'))
    .map(name => path.join(API, name)),
]
for (const file of sources) {
  const source = fs.readFileSync(file, 'utf8')
  for (const match of source.matchAll(/(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g)) {
    const key = unescape(match[2])
    referenced.add(key)
    if (dictionary.has(key)) addSection(key, file)
  }
}

// Texts shown in several parts of the site (buttons like "Закрыть") are grouped as "common".
const sections = {}
for (const key of dictionary) {
  const found = [...(sectionsByKey.get(key) ?? [])].filter(section => section !== 'admin')
  if (sectionsByKey.get(key)?.has('admin') && !found.length) sections[key] = 'admin'
  else sections[key] = found.length > 1 ? 'common' : (found[0] ?? 'other')
}
const sectionsJson = `${JSON.stringify(sections, null, 2)}\n`
const previousJson = fs.existsSync(SECTIONS_FILE) ? fs.readFileSync(SECTIONS_FILE, 'utf8') : ''
if (sectionsJson !== previousJson) {
  fs.writeFileSync(SECTIONS_FILE, sectionsJson)
  console.log(`updated ${path.relative(process.cwd(), SECTIONS_FILE)}`)
}

const missing = [...used].filter(([key]) => !dictionary.has(key))
const unused = [...dictionary].filter(key => !referenced.has(key))

for (const [key, file] of missing) console.log(`missing  ${file}: ${JSON.stringify(key)}`)
if (process.argv.includes('--unused')) for (const key of unused) console.log(`unused   ${JSON.stringify(key)}`)
console.log(
  `\n${used.size} strings in code, ${missing.length} without English translation, ${unused.length} unused dictionary entries`,
)
process.exitCode = missing.length ? 1 : 0
